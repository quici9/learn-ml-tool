# Tài liệu 06: Feature Engineering cho Dữ liệu Mạng (Zeek/Suricata)

> **Mục tiêu:** Chuyển raw network logs thành feature vectors cho ML – đây là bước quyết định 80% chất lượng model.
> **Thời gian học:** 3-4 ngày | **Yêu cầu:** Đã hoàn thành Tài liệu 01-05

---

## Mục lục

1. [Feature Engineering là gì?](#1-feature-engineering-là-gì)
2. [Cấu trúc Zeek conn.log](#2-cấu-trúc-zeek-connlog)
3. [Numerical Features](#3-numerical-features)
4. [Categorical Features – Encoding](#4-categorical-features--encoding)
5. [IP Aggregation Features](#5-ip-aggregation-features)
6. [Time-window Features](#6-time-window-features)
7. [Dấu hiệu từng loại tấn công](#7-dấu-hiệu-từng-loại-tấn-công)
8. [Pipeline hoàn chỉnh](#8-pipeline-hoàn-chỉnh)
9. [Bài tập thực hành](#9-bài-tập-thực-hành)

---

## 1. Feature Engineering là gì?

Feature Engineering là quá trình **chuyển dữ liệu thô thành các con số có ý nghĩa** để ML model học. Đây là bước quan trọng nhất – model tốt nhất cũng vô dụng nếu features tệ.

```
Raw Zeek log entry:
  ts=1709285400 uid=C1 source=10.0.0.1 dest=8.8.8.8 port=53
  proto=udp duration=0.02 orig_bytes=50 resp_bytes=120

                    ↓ Feature Engineering

Feature vector (1 IP trong 5 phút):
  [conn_count=15, unique_ports=3, avg_duration=1.2,
   total_bytes=12000, bytes_ratio=0.3, port_diversity=0.2]
```

**Quy tắc vàng:** Không đưa raw IP vào model (model không hiểu "10.0.0.1" là gì). Thay vào đó, tính **hành vi** của IP đó.

---

## 2. Cấu trúc Zeek conn.log

Zeek conn.log ghi lại **mỗi kết nối mạng** với các trường sau:

| Trường | Giải thích | Ví dụ | Dùng cho ML? |
|---|---|---|---|
| `ts` | Timestamp | 1709285400.123 | ✅ Time-window |
| `uid` | Connection ID | CHhAvVGS1DHFjwGM9 | ❌ Identifier |
| `id.orig_h` | Source IP | 10.0.0.1 | ✅ Aggregation |
| `id.orig_p` | Source port | 52431 | ⚠️ Ít ý nghĩa |
| `id.resp_h` | Destination IP | 8.8.8.8 | ✅ Aggregation |
| `id.resp_p` | Destination port | 53 | ✅ Trực tiếp + encoding |
| `proto` | Protocol | tcp/udp | ✅ Encoding |
| `service` | Dịch vụ | dns/http/ssl | ✅ Encoding |
| `duration` | Thời gian (giây) | 0.023 | ✅ Trực tiếp |
| `orig_bytes` | Bytes gửi | 1024 | ✅ Trực tiếp |
| `resp_bytes` | Bytes nhận | 4096 | ✅ Trực tiếp |
| `conn_state` | Trạng thái kết nối | SF/S0/REJ | ✅ Encoding |

### Trạng thái kết nối (conn_state) – quan trọng

```
SF   = Bình thường (connection established, finished)
S0   = Chỉ có SYN, không reply → có thể port scan
REJ  = Connection rejected
S1   = SYN from originator, reply from responder (connection established)
RSTR = Responder sent RST
```

---

## 3. Numerical Features

Các trường số dùng trực tiếp – chỉ cần xử lý NaN và outlier:

```python
import pandas as pd
import numpy as np

# Giả lập dữ liệu Zeek conn.log
df = pd.DataFrame({
    "source_ip": ["10.0.0.1"] * 5 + ["10.0.0.99"] * 3,
    "dest_ip": ["8.8.8.8", "8.8.8.8", "1.1.1.1", "8.8.4.4", "172.16.0.1",
                "evil.com", "c2.bad", "malware.net"],
    "dest_port": [53, 443, 53, 80, 8080, 4444, 5555, 31337],
    "protocol": ["udp", "tcp", "udp", "tcp", "tcp", "tcp", "tcp", "tcp"],
    "service": ["dns", "ssl", "dns", "http", "http", "-", "-", "-"],
    "duration": [0.02, 1.5, 0.01, 2.3, 0.8, 120.0, 60.5, 90.2],
    "orig_bytes": [50, 1024, 45, 2048, 512, 500000, 200000, 350000],
    "resp_bytes": [120, 4096, 100, 8192, 1024, 500, 200, 100],
    "conn_state": ["SF", "SF", "SF", "SF", "SF", "S1", "S1", "S1"],
})

# === Numerical features: dùng trực tiếp ===
numerical_features = ["duration", "orig_bytes", "resp_bytes"]

# Xử lý giá trị thiếu
for col in numerical_features:
    df[col] = df[col].fillna(0)

# Tạo features phái sinh
df["total_bytes"] = df["orig_bytes"] + df["resp_bytes"]
df["bytes_ratio"] = df["orig_bytes"] / (df["resp_bytes"] + 1)

print(df[["source_ip", "duration", "orig_bytes", "resp_bytes", "total_bytes", "bytes_ratio"]])
```

**Ý nghĩa features:**
- `duration` cao bất thường → C2 beacon (kết nối duy trì lâu)
- `orig_bytes` cao + `resp_bytes` thấp → data exfiltration
- `bytes_ratio` >> 1 → gửi nhiều hơn nhận → đáng ngờ

---

## 4. Categorical Features – Encoding

ML model chỉ hiểu số. Phải chuyển text thành số:

### One-Hot Encoding

```python
# Protocol: tcp, udp → 2 cột binary
protocol_encoded = pd.get_dummies(df["protocol"], prefix="proto")
print(protocol_encoded)
#    proto_tcp  proto_udp
# 0      False      True
# 1       True     False
# ...

# conn_state: SF, S0, S1, REJ → nhiều cột binary
state_encoded = pd.get_dummies(df["conn_state"], prefix="state")
```

### Label Encoding (cho port ranges)

```python
# Phân loại port thay vì dùng raw port number
def encode_port_range(port: int) -> int:
    """Phân loại port thành category."""
    if port <= 1023:
        return 0    # Well-known (system)
    elif port <= 49151:
        return 1    # Registered
    else:
        return 2    # Dynamic/ephemeral

df["port_category"] = df["dest_port"].apply(encode_port_range)
```

### Service Encoding

```python
# Zeek service: dns, http, ssl, ftp, ssh, - (unknown)
KNOWN_SERVICES = ["dns", "http", "ssl", "ftp", "ssh", "smtp"]

df["has_known_service"] = df["service"].isin(KNOWN_SERVICES).astype(int)
# 1 = dịch vụ đã biết, 0 = unknown → service "-" đáng ngờ
```

---

## 5. IP Aggregation Features

**KHÔNG đưa raw IP vào model.** Thay vào đó, tính **hành vi** của mỗi IP:

```python
# === Tính features cho mỗi source_ip ===
ip_features = df.groupby("source_ip").agg(
    # Số lượng kết nối
    connection_count=("dest_ip", "count"),

    # Đa dạng destination
    unique_dest_ips=("dest_ip", "nunique"),
    unique_dest_ports=("dest_port", "nunique"),

    # Thống kê thời gian
    avg_duration=("duration", "mean"),
    max_duration=("duration", "max"),
    std_duration=("duration", "std"),

    # Thống kê bytes
    total_orig_bytes=("orig_bytes", "sum"),
    total_resp_bytes=("resp_bytes", "sum"),
    avg_orig_bytes=("orig_bytes", "mean"),
    max_orig_bytes=("orig_bytes", "max"),
).reset_index()

# Features phái sinh
ip_features["bytes_ratio"] = (
    ip_features["total_orig_bytes"] / (ip_features["total_resp_bytes"] + 1)
)
ip_features["port_diversity"] = (
    ip_features["unique_dest_ports"] / ip_features["connection_count"]
)

# Xử lý NaN (std = NaN khi chỉ có 1 connection)
ip_features["std_duration"] = ip_features["std_duration"].fillna(0)

print(ip_features)
```

### Giải thích từng feature

| Feature | Giá trị bình thường | Giá trị bất thường | Dấu hiệu |
|---|---|---|---|
| `connection_count` | 5-50 | >500 | DDoS, scan |
| `unique_dest_ports` | 1-5 | >50 | Port scan |
| `avg_duration` | 1-10s | <0.01s hoặc >100s | Scan hoặc C2 |
| `bytes_ratio` | 0.1-2.0 | >10 | Data exfiltration |
| `port_diversity` | <0.3 | >0.8 | Scan |

---

## 6. Time-window Features

Chia dữ liệu theo **cửa sổ thời gian** (5 phút) – phát hiện spike traffic:

```python
# Thêm timestamp giả lập
from datetime import datetime, timedelta

base_time = datetime(2026, 3, 13, 10, 0, 0)
df["timestamp"] = [base_time + timedelta(seconds=np.random.randint(0, 3600))
                   for _ in range(len(df))]

# Chia thành window 5 phút
df["time_window"] = df["timestamp"].dt.floor("5min")

# Tính features theo time window
window_features = df.groupby("time_window").agg(
    connections_per_window=("source_ip", "count"),
    unique_sources=("source_ip", "nunique"),
    unique_destinations=("dest_ip", "nunique"),
    total_bytes=("orig_bytes", "sum"),
    avg_bytes=("orig_bytes", "mean"),
).reset_index()

# Phát hiện window bất thường (baseline)
mean_conns = window_features["connections_per_window"].mean()
std_conns = window_features["connections_per_window"].std()

window_features["is_spike"] = (
    window_features["connections_per_window"] > mean_conns + 2 * std_conns
)

print(window_features)
```

### Sliding Window (phụ lục PT186S yêu cầu)

```python
# Sliding window: mỗi 5 phút, phân tích 15 phút gần nhất
WINDOW_SIZE = "15min"
SLIDE_STEP = "5min"

# Trong production: dùng Elasticsearch time range query
# Ở đây demo concept:
def get_features_for_window(df: pd.DataFrame, window_end: datetime, window_size_minutes: int = 15):
    """Tính features cho 1 cửa sổ thời gian."""
    window_start = window_end - timedelta(minutes=window_size_minutes)
    window_data = df[
        (df["timestamp"] >= window_start) & (df["timestamp"] < window_end)
    ]

    if len(window_data) == 0:
        return None

    features = {
        "window_end": window_end,
        "total_connections": len(window_data),
        "unique_source_ips": window_data["source_ip"].nunique(),
        "unique_dest_ips": window_data["dest_ip"].nunique(),
        "unique_dest_ports": window_data["dest_port"].nunique(),
        "total_bytes": window_data["orig_bytes"].sum(),
        "avg_duration": window_data["duration"].mean(),
    }
    return features
```

---

## 7. Dấu hiệu từng loại tấn công

### Port Scan

```python
# Dấu hiệu: 1 IP → rất nhiều port khác nhau, duration rất ngắn
def detect_port_scan_features(ip_features: pd.DataFrame) -> pd.DataFrame:
    """Thêm features phát hiện port scan."""
    ip_features["scan_score"] = (
        ip_features["unique_dest_ports"] *        # nhiều port
        (1 / (ip_features["avg_duration"] + 0.01)) *  # duration ngắn
        ip_features["port_diversity"]              # phần lớn là port khác nhau
    )
    return ip_features
```

### DDoS / DoS

```python
# Dấu hiệu: rất nhiều connection đến CÙNG 1 destination trong thời gian ngắn
# → connection_count cao, unique_dest_ips thấp
```

### C2 Beacon

```python
# Dấu hiệu: kết nối định kỳ (interval đều), duration dài, port lạ
# → std_duration thấp (interval đều), avg_duration cao
```

### Data Exfiltration

```python
# Dấu hiệu: gửi nhiều bytes, nhận ít → bytes_ratio cao
# → total_orig_bytes >> total_resp_bytes
```

---

## 8. Pipeline hoàn chỉnh

```python
"""
Feature Engineering Pipeline cho PT186S ML Engine
Input:  Raw Zeek conn.log records (list of dicts)
Output: Feature matrix (numpy array) sẵn sàng cho Isolation Forest
"""
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler

FEATURE_COLUMNS = [
    "connection_count",
    "unique_dest_ips",
    "unique_dest_ports",
    "avg_duration",
    "max_duration",
    "std_duration",
    "total_orig_bytes",
    "total_resp_bytes",
    "avg_orig_bytes",
    "bytes_ratio",
    "port_diversity",
    "has_unknown_service_ratio",
    "s0_ratio",
]


def extract_features(raw_records: list[dict]) -> pd.DataFrame:
    """
    Chuyển raw Zeek records thành feature table theo source_ip.

    Args:
        raw_records: List of dicts từ Elasticsearch

    Returns:
        DataFrame với mỗi dòng là feature vector của 1 source_ip
    """
    df = pd.DataFrame(raw_records)

    # Xử lý missing values
    df["duration"] = df["duration"].fillna(0)
    df["orig_bytes"] = df["orig_bytes"].fillna(0)
    df["resp_bytes"] = df["resp_bytes"].fillna(0)
    df["service"] = df["service"].fillna("-")
    df["conn_state"] = df["conn_state"].fillna("OTH")

    # Helper columns
    df["is_unknown_service"] = (df["service"] == "-").astype(int)
    df["is_s0"] = (df["conn_state"] == "S0").astype(int)

    # Aggregate per source_ip
    features = df.groupby("source_ip").agg(
        connection_count=("dest_ip", "count"),
        unique_dest_ips=("dest_ip", "nunique"),
        unique_dest_ports=("dest_port", "nunique"),
        avg_duration=("duration", "mean"),
        max_duration=("duration", "max"),
        std_duration=("duration", "std"),
        total_orig_bytes=("orig_bytes", "sum"),
        total_resp_bytes=("resp_bytes", "sum"),
        avg_orig_bytes=("orig_bytes", "mean"),
        has_unknown_service_ratio=("is_unknown_service", "mean"),
        s0_ratio=("is_s0", "mean"),
    ).reset_index()

    # Derived features
    features["bytes_ratio"] = (
        features["total_orig_bytes"] / (features["total_resp_bytes"] + 1)
    )
    features["port_diversity"] = (
        features["unique_dest_ports"] / features["connection_count"]
    )

    # Handle NaN
    features = features.fillna(0)

    return features


def prepare_for_ml(features: pd.DataFrame) -> tuple[np.ndarray, list[str]]:
    """
    Chuyển feature DataFrame thành numpy array cho Scikit-learn.

    Returns:
        (X, source_ips): feature matrix và danh sách IP tương ứng
    """
    source_ips = features["source_ip"].tolist()
    X = features[FEATURE_COLUMNS].values.astype(float)

    return X, source_ips


# === Sử dụng ===
if __name__ == "__main__":
    # Giả lập raw records (thực tế đọc từ Elasticsearch)
    raw_records = [
        {"source_ip": "10.0.0.1", "dest_ip": "8.8.8.8", "dest_port": 53,
         "protocol": "udp", "service": "dns", "duration": 0.02,
         "orig_bytes": 50, "resp_bytes": 120, "conn_state": "SF"},
        # ... thêm records
    ]

    features = extract_features(raw_records)
    X, ips = prepare_for_ml(features)

    print(f"Feature matrix shape: {X.shape}")
    print(f"IPs: {ips}")
    print(f"Feature columns: {FEATURE_COLUMNS}")
```

---

## 9. Bài tập thực hành

### Bài 1: One-Hot Encoding conn_state

Viết hàm nhận DataFrame có cột `conn_state`, trả về DataFrame mới với One-Hot Encoding. Kiểm tra: nếu có conn_state chưa gặp khi training, xử lý thế nào?

### Bài 2: Phát hiện DNS Tunneling

DNS Tunneling dấu hiệu: rất nhiều DNS queries (port 53), mỗi query có `orig_bytes` lớn bất thường (>200 bytes). Viết code tính features phát hiện DNS tunneling từ conn.log.

### Bài 3: So sánh feature sets

Chạy Isolation Forest với 2 feature sets:
- Set A: chỉ numerical (`duration`, `orig_bytes`, `resp_bytes`)
- Set B: đầy đủ (+ `bytes_ratio`, `port_diversity`, `connection_count`, ...)

So sánh Recall và FPR. Feature set nào tốt hơn?

---

> **Tài liệu tiếp theo:** [07 – FastAPI: Xây dựng ML Engine REST API](./07-fastapi-ml-engine.md)
