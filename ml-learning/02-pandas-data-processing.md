# Tài liệu 02: Pandas – Xử lý Dữ liệu Dạng Bảng

> **Mục tiêu:** Làm chủ Pandas để xử lý dữ liệu mạng (Zeek/Suricata logs) – kỹ năng cốt lõi trước khi đưa dữ liệu vào ML model.
> **Thời gian học:** 3-4 ngày | **Yêu cầu:** Đã hoàn thành Tài liệu 01

---

## Mục lục

1. [Pandas là gì?](#1-pandas-là-gì)
2. [DataFrame và Series](#2-dataframe-và-series)
3. [Đọc dữ liệu](#3-đọc-dữ-liệu)
4. [Truy vấn và lọc dữ liệu](#4-truy-vấn-và-lọc-dữ-liệu)
5. [Thêm, sửa, xóa cột](#5-thêm-sửa-xóa-cột)
6. [GroupBy và Aggregation](#6-groupby-và-aggregation)
7. [Xử lý dữ liệu bị thiếu](#7-xử-lý-dữ-liệu-bị-thiếu)
8. [Merge và Join](#8-merge-và-join)
9. [Ví dụ thực tế: Phân tích Zeek conn.log](#9-ví-dụ-thực-tế-phân-tích-zeek-connlog)
10. [Bài tập thực hành](#10-bài-tập-thực-hành)

---

## 1. Pandas là gì?

**Pandas** là thư viện xử lý dữ liệu dạng bảng (#1 trong Python data science). Nếu bạn đã quen:

| Bạn đã biết | Pandas tương đương |
|---|---|
| SQL `SELECT * FROM table` | `df[["col1", "col2"]]` |
| SQL `WHERE condition` | `df[df["col"] > 10]` |
| Prisma `findMany({ where, select })` | `df.query()` + column selection |
| Elasticsearch aggregation | `df.groupby().agg()` |
| Excel spreadsheet | DataFrame |

```python
import pandas as pd

# Convention: luôn import pandas as pd
```

---

## 2. DataFrame và Series

### DataFrame – Bảng dữ liệu 2 chiều

Hãy hình dung DataFrame giống **kết quả trả về từ SQL query** hoặc **một sheet Excel**:

```python
import pandas as pd

# Tạo DataFrame từ list of dicts (giống JSON array từ API)
data = [
    {"source_ip": "10.0.0.1", "dest_ip": "8.8.8.8", "port": 53, "bytes": 120, "protocol": "udp"},
    {"source_ip": "10.0.0.2", "dest_ip": "192.168.1.1", "port": 443, "bytes": 5000, "protocol": "tcp"},
    {"source_ip": "10.0.0.1", "dest_ip": "evil.com", "port": 4444, "bytes": 50000, "protocol": "tcp"},
    {"source_ip": "10.0.0.3", "dest_ip": "8.8.4.4", "port": 53, "bytes": 80, "protocol": "udp"},
    {"source_ip": "10.0.0.1", "dest_ip": "8.8.8.8", "port": 53, "bytes": 150, "protocol": "udp"},
]

df = pd.DataFrame(data)
print(df)
```

Kết quả:
```
   source_ip       dest_ip  port  bytes protocol
0   10.0.0.1       8.8.8.8    53    120      udp
1   10.0.0.2  192.168.1.1   443   5000      tcp
2   10.0.0.1      evil.com  4444  50000      tcp
3   10.0.0.3       8.8.4.4    53     80      udp
4   10.0.0.1       8.8.8.8    53    150      udp
```

### Series – Một cột dữ liệu

```python
# Lấy 1 cột → trả về Series (giống 1 array)
bytes_col = df["bytes"]
print(bytes_col)
# 0      120
# 1     5000
# 2    50000
# 3       80
# 4      150

# Thống kê nhanh
print(bytes_col.mean())     # trung bình: 11070.0
print(bytes_col.max())      # lớn nhất: 50000
print(bytes_col.describe()) # tóm tắt thống kê đầy đủ
```

### Xem nhanh dữ liệu

```python
df.head(3)          # 3 dòng đầu (giống LIMIT 3)
df.tail(2)          # 2 dòng cuối
df.shape            # (5, 5) → 5 dòng, 5 cột
df.dtypes           # kiểu dữ liệu mỗi cột
df.info()           # tóm tắt: số dòng, kiểu, null count
df.describe()       # thống kê cho cột số: mean, std, min, max, percentiles
```

---

## 3. Đọc dữ liệu

### Từ CSV

```python
# Đọc CSV (dùng nhiều với dataset ML)
df = pd.read_csv("zeek_conn_log.csv")

# Chỉ đọc một số cột
df = pd.read_csv("zeek_conn_log.csv", usecols=["source_ip", "dest_ip", "bytes"])

# Đọc với custom separator (Zeek log dùng tab)
df = pd.read_csv("conn.log", sep="\t", comment="#")
```

### Từ JSON

```python
# Đọc JSON array
df = pd.read_json("alerts.json")

# Từ JSON string (giống response API)
import json
json_str = '[{"ip": "10.0.0.1", "score": 0.9}, {"ip": "10.0.0.2", "score": 0.3}]'
df = pd.read_json(json_str)
```

### Từ Dict/List (dữ liệu trong code)

```python
# Từ Elasticsearch response (khi dùng ES Python client)
es_hits = [
    {"_source": {"source_ip": "10.0.0.1", "bytes": 120}},
    {"_source": {"source_ip": "10.0.0.2", "bytes": 5000}},
]
df = pd.DataFrame([hit["_source"] for hit in es_hits])
```

---

## 4. Truy vấn và lọc dữ liệu

### Chọn cột

```python
# Một cột → Series
ips = df["source_ip"]

# Nhiều cột → DataFrame mới
subset = df[["source_ip", "dest_ip", "bytes"]]
```

### Lọc dòng (WHERE)

```python
# Lọc đơn giản
high_traffic = df[df["bytes"] > 1000]
# Tương đương SQL: SELECT * FROM df WHERE bytes > 1000

# Nhiều điều kiện (dùng & và |, KHÔNG phải and/or)
suspicious = df[(df["bytes"] > 10000) & (df["port"] == 4444)]
# SQL: WHERE bytes > 10000 AND port = 4444

udp_or_dns = df[(df["protocol"] == "udp") | (df["port"] == 53)]
# SQL: WHERE protocol = 'udp' OR port = 53

# Lọc bằng isin (giống SQL IN)
internal_traffic = df[df["source_ip"].isin(["10.0.0.1", "10.0.0.2"])]
# SQL: WHERE source_ip IN ('10.0.0.1', '10.0.0.2')

# Lọc bằng string
evil_connections = df[df["dest_ip"].str.contains("evil")]
# SQL: WHERE dest_ip LIKE '%evil%'
```

### Sắp xếp (ORDER BY)

```python
# Sắp xếp theo bytes giảm dần
sorted_df = df.sort_values("bytes", ascending=False)

# Nhiều cột
sorted_df = df.sort_values(["protocol", "bytes"], ascending=[True, False])
```

### So sánh với Prisma (NestJS)

| Prisma | Pandas |
|---|---|
| `findMany({ where: { bytes: { gt: 1000 } } })` | `df[df["bytes"] > 1000]` |
| `findMany({ select: { sourceIp: true } })` | `df[["source_ip"]]` |
| `findMany({ orderBy: { bytes: 'desc' } })` | `df.sort_values("bytes", ascending=False)` |
| `findMany({ take: 10 })` | `df.head(10)` |

---

## 5. Thêm, sửa, xóa cột

### Thêm cột mới

```python
# Cột tính toán
df["total_bytes"] = df["orig_bytes"] + df["resp_bytes"]

# Cột dựa trên điều kiện (giống ternary)
df["is_large"] = df["bytes"] > 10000

# Cột dựa trên logic phức tạp
df["risk_level"] = df["bytes"].apply(
    lambda b: "high" if b > 10000 else ("medium" if b > 1000 else "low")
)

# Nhiều điều kiện → dùng np.select (gọn hơn nhiều if-else)
import numpy as np
conditions = [
    df["bytes"] > 10000,
    df["bytes"] > 1000,
]
choices = ["high", "medium"]
df["risk_level"] = np.select(conditions, choices, default="low")
```

### Sửa cột

```python
# Đổi tên cột
df = df.rename(columns={"source_ip": "src_ip", "dest_ip": "dst_ip"})

# Thay đổi kiểu dữ liệu
df["port"] = df["port"].astype(str)      # int → string
df["bytes"] = df["bytes"].astype(float)  # int → float (cần cho ML)
```

### Xóa cột

```python
df = df.drop(columns=["unnecessary_column"])
# hoặc
del df["unnecessary_column"]
```

---

## 6. GroupBy và Aggregation

Đây là tính năng **cực kỳ quan trọng** cho Feature Engineering – tính toán thống kê theo nhóm.

### Cơ bản

```python
# Đếm số connection từ mỗi source_ip
# SQL: SELECT source_ip, COUNT(*) FROM df GROUP BY source_ip
connection_counts = df.groupby("source_ip").size()
# source_ip
# 10.0.0.1    3
# 10.0.0.2    1
# 10.0.0.3    1

# Tổng bytes theo source_ip
bytes_per_ip = df.groupby("source_ip")["bytes"].sum()
```

### Nhiều aggregation cùng lúc

```python
# Giống Elasticsearch aggregation
stats = df.groupby("source_ip").agg(
    connection_count=("bytes", "count"),      # COUNT(*)
    total_bytes=("bytes", "sum"),             # SUM(bytes)
    avg_bytes=("bytes", "mean"),             # AVG(bytes)
    max_bytes=("bytes", "max"),              # MAX(bytes)
    unique_ports=("port", "nunique"),         # COUNT(DISTINCT port)
    unique_destinations=("dest_ip", "nunique")
).reset_index()

print(stats)
```

Kết quả:
```
  source_ip  connection_count  total_bytes    avg_bytes  max_bytes  unique_ports  unique_destinations
0  10.0.0.1                 3        50270  16756.67     50000            2                       2
1  10.0.0.2                 1         5000   5000.00      5000            1                       1
2  10.0.0.3                 1           80     80.00        80            1                       1
```

**Ý nghĩa với ML:** Bảng `stats` ở trên chính là **feature table** – mỗi dòng là feature vector của 1 IP, sẵn sàng đưa vào Isolation Forest.

### So sánh với ES Aggregation hiện tại

Trong `ZeekService` của PT186S, bạn đã quen:
```typescript
// NestJS + Elasticsearch
const aggs = {
  by_source_ip: {
    terms: { field: "id.orig_h" },
    aggs: {
      total_bytes: { sum: { field: "orig_bytes" } }
    }
  }
};
```

Pandas tương đương:
```python
df.groupby("source_ip")["bytes"].sum()
```

---

## 7. Xử lý dữ liệu bị thiếu

Dữ liệu thực tế **luôn có giá trị bị thiếu** (null, NaN). ML model không chấp nhận NaN → phải xử lý trước.

```python
# Kiểm tra dữ liệu thiếu
print(df.isnull().sum())      # đếm NaN mỗi cột

# Xóa dòng có NaN
df_clean = df.dropna()                        # xóa dòng có BẤT KỲ NaN
df_clean = df.dropna(subset=["bytes"])        # chỉ xóa nếu cột "bytes" NaN

# Điền giá trị thay thế
df["duration"] = df["duration"].fillna(0)                  # điền 0
df["service"] = df["service"].fillna("unknown")            # điền string
df["bytes"] = df["bytes"].fillna(df["bytes"].median())     # điền median (khuyên dùng cho ML)

# Kiểm tra
assert df.isnull().sum().sum() == 0, "Vẫn còn NaN!"
```

**Quy tắc chung cho ML:**
- Cột số: điền `median` (ít bị ảnh hưởng bởi outlier hơn mean)
- Cột categorical: điền `"unknown"`
- Nếu >50% dữ liệu bị thiếu → cân nhắc xóa cả cột

---

## 8. Merge và Join

Khi cần kết hợp dữ liệu từ nhiều nguồn (ví dụ: Zeek conn.log + Suricata alerts).

```python
# Dữ liệu Zeek
zeek_df = pd.DataFrame([
    {"flow_id": "abc1", "source_ip": "10.0.0.1", "bytes": 5000},
    {"flow_id": "abc2", "source_ip": "10.0.0.2", "bytes": 120},
])

# Dữ liệu Suricata alert
suricata_df = pd.DataFrame([
    {"flow_id": "abc1", "alert_signature": "ET MALWARE Command and Control"},
    {"flow_id": "abc3", "alert_signature": "ET SCAN Nmap Scripting Engine"},
])

# INNER JOIN – chỉ lấy dòng match cả 2 bảng
merged = pd.merge(zeek_df, suricata_df, on="flow_id", how="inner")
# flow_id source_ip  bytes                           alert_signature
#    abc1  10.0.0.1   5000  ET MALWARE Command and Control

# LEFT JOIN – lấy tất cả zeek, match suricata nếu có
merged = pd.merge(zeek_df, suricata_df, on="flow_id", how="left")
```

---

## 9. Ví dụ thực tế: Phân tích Zeek conn.log

Đây là ví dụ hoàn chỉnh – mô phỏng pipeline xử lý dữ liệu mạng cho ML:

```python
import pandas as pd
import numpy as np

# === 1. Tạo dữ liệu giả lập Zeek conn.log ===
np.random.seed(42)
NORMAL_COUNT = 950
ANOMALY_COUNT = 50

normal_data = {
    "source_ip": np.random.choice(["10.0.0." + str(i) for i in range(1, 20)], NORMAL_COUNT),
    "dest_ip": np.random.choice(["8.8.8.8", "8.8.4.4", "1.1.1.1", "172.16.0.1"], NORMAL_COUNT),
    "dest_port": np.random.choice([53, 80, 443, 8080], NORMAL_COUNT),
    "protocol": np.random.choice(["tcp", "udp"], NORMAL_COUNT, p=[0.7, 0.3]),
    "duration": np.random.exponential(2.0, NORMAL_COUNT),
    "orig_bytes": np.random.lognormal(6, 1.5, NORMAL_COUNT).astype(int),
    "resp_bytes": np.random.lognormal(7, 1.5, NORMAL_COUNT).astype(int),
    "label": "normal"
}

anomaly_data = {
    "source_ip": np.random.choice(["10.0.0.99", "10.0.0.100"], ANOMALY_COUNT),
    "dest_ip": np.random.choice(["evil-c2.com", "malware-cdn.net"], ANOMALY_COUNT),
    "dest_port": np.random.choice([4444, 5555, 31337, 9999], ANOMALY_COUNT),
    "protocol": ["tcp"] * ANOMALY_COUNT,
    "duration": np.random.exponential(30.0, ANOMALY_COUNT),
    "orig_bytes": np.random.lognormal(10, 2, ANOMALY_COUNT).astype(int),
    "resp_bytes": np.random.lognormal(4, 1, ANOMALY_COUNT).astype(int),
    "label": "anomaly"
}

df = pd.concat([pd.DataFrame(normal_data), pd.DataFrame(anomaly_data)], ignore_index=True)
df = df.sample(frac=1, random_state=42).reset_index(drop=True)  # shuffle

print(f"Dataset: {df.shape[0]} rows, {df.shape[1]} columns")
print(f"Normal: {(df['label'] == 'normal').sum()}, Anomaly: {(df['label'] == 'anomaly').sum()}")

# === 2. Khám phá dữ liệu ===
print("\n--- Thống kê cơ bản ---")
print(df.describe())

print("\n--- Phân bố protocol ---")
print(df["protocol"].value_counts())

print("\n--- Top 5 dest_port phổ biến ---")
print(df["dest_port"].value_counts().head(5))

# === 3. Feature Engineering cấp IP ===
features = df.groupby("source_ip").agg(
    connection_count=("dest_ip", "count"),
    unique_dest_ips=("dest_ip", "nunique"),
    unique_dest_ports=("dest_port", "nunique"),
    avg_duration=("duration", "mean"),
    total_orig_bytes=("orig_bytes", "sum"),
    total_resp_bytes=("resp_bytes", "sum"),
    avg_orig_bytes=("orig_bytes", "mean"),
    max_orig_bytes=("orig_bytes", "max"),
).reset_index()

# Tính thêm features
features["bytes_ratio"] = features["total_orig_bytes"] / (features["total_resp_bytes"] + 1)
features["port_diversity_score"] = features["unique_dest_ports"] / features["connection_count"]

print("\n--- Feature table (sẵn sàng cho ML) ---")
print(features.head(10))

# === 4. Lưu ra CSV để dùng ở tài liệu tiếp theo ===
features.to_csv("network_features.csv", index=False)
df.to_csv("network_connections.csv", index=False)
print("\nĐã lưu: network_features.csv, network_connections.csv")
```

---

## 10. Bài tập thực hành

### Bài 1: Phân tích traffic theo protocol

Từ dataset giả lập ở trên, viết code:
- Đếm số connection cho mỗi `protocol`
- Tính trung bình `orig_bytes` theo protocol
- Tìm protocol nào có `duration` trung bình cao nhất

### Bài 2: Phát hiện port scan đơn giản

Viết hàm nhận DataFrame, trả về danh sách IP mà:
- Kết nối đến **nhiều hơn 10 port khác nhau** trong dataset
- Có trung bình duration **nhỏ hơn 1 giây** (port scan thường rất nhanh)

### Bài 3: Time-window aggregation

Thêm cột `timestamp` (random trong 1 giờ), sau đó:
- Chia dữ liệu thành các window 5 phút
- Đếm số connection trong mỗi window
- Tìm window nào có số connection bất thường (> mean + 2*std)

---

> **Tài liệu tiếp theo:** [03 – NumPy: Tính toán ma trận và thống kê](./03-numpy-statistics.md)
