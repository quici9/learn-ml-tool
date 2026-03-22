# Tài liệu 01: Python Cơ bản cho Developer TypeScript/JavaScript

> **Mục tiêu:** Nắm nhanh Python bằng cách so sánh trực tiếp với TypeScript – ngôn ngữ bạn đã biết.
> **Thời gian học:** 3-5 ngày | **Yêu cầu:** Python 3.11+ đã cài đặt

---

## Mục lục

1. [Cài đặt môi trường](#1-cài-đặt-môi-trường)
2. [Biến và kiểu dữ liệu](#2-biến-và-kiểu-dữ-liệu)
3. [Cấu trúc dữ liệu](#3-cấu-trúc-dữ-liệu)
4. [Hàm và Lambda](#4-hàm-và-lambda)
5. [Type Hints](#5-type-hints)
6. [Class và Dataclass](#6-class-và-dataclass)
7. [Module và Package](#7-module-và-package)
8. [Virtual Environment](#8-virtual-environment)
9. [File I/O và JSON](#9-file-io-và-json)
10. [Error Handling](#10-error-handling)
11. [List Comprehension](#11-list-comprehension)
12. [Bài tập thực hành](#12-bài-tập-thực-hành)

---

## 1. Cài đặt môi trường

### Kiểm tra Python

```bash
python3 --version
# Python 3.11.x hoặc cao hơn
```

### Virtual Environment – tương đương `node_modules`

Trong Node.js, bạn dùng `npm install` để cài thư viện vào `node_modules/`. Python dùng **virtual environment** (venv) – một thư mục chứa Python interpreter riêng và các thư viện.

```bash
# Tạo virtual environment (giống npm init)
python3 -m venv .venv

# Kích hoạt (giống khi bạn cd vào project có node_modules)
source .venv/bin/activate    # macOS/Linux

# Cài thư viện (giống npm install pandas)
pip install pandas numpy scikit-learn

# Lưu dependencies (giống package.json)
pip freeze > requirements.txt

# Cài từ file (giống npm install từ package.json)
pip install -r requirements.txt

# Thoát venv
deactivate
```

**So sánh nhanh:**

| Node.js | Python |
|---|---|
| `npm init` | `python3 -m venv .venv` |
| `npm install pandas` | `pip install pandas` |
| `package.json` | `requirements.txt` |
| `node_modules/` | `.venv/` |
| `npx` | `python -m` |

---

## 2. Biến và kiểu dữ liệu

### Khai báo biến

```typescript
// TypeScript
const name: string = "PT186S";
let count: number = 42;
const isActive: boolean = true;
const nothing: null = null;
```

```python
# Python – không cần từ khóa khai báo, không cần dấu ;
name: str = "PT186S"
count: int = 42
is_active: bool = True       # True/False thay vì true/false
nothing: None = None         # None thay vì null
```

**Lưu ý quan trọng:**
- Python dùng **snake_case** cho biến/hàm (thay vì camelCase)
- `True`/`False`/`None` viết hoa chữ cái đầu
- Không có `const` – mọi biến đều mutable (dùng UPPER_CASE cho hằng số theo convention)

### Kiểu dữ liệu cơ bản

| TypeScript | Python | Ghi chú |
|---|---|---|
| `string` | `str` | |
| `number` | `int`, `float` | Python phân biệt số nguyên và số thực |
| `boolean` | `bool` | `True`/`False` |
| `null` | `None` | |
| `undefined` | Không có | Python không có `undefined` |
| `any` | Không có | Python dynamic typing mặc định |

### String formatting – f-string

```typescript
// TypeScript
const ip = "192.168.1.1";
const port = 443;
console.log(`Connection to ${ip}:${port}`);
```

```python
# Python – f-string (giống template literal)
ip = "192.168.1.1"
port = 443
print(f"Connection to {ip}:{port}")

# Các cách khác
print("Connection to {}:{}".format(ip, port))
print("Connection to %s:%d" % (ip, port))  # style cũ
```

---

## 3. Cấu trúc dữ liệu

### List – tương đương Array

```typescript
// TypeScript
const ips: string[] = ["10.0.0.1", "10.0.0.2", "10.0.0.3"];
ips.push("10.0.0.4");
const first = ips[0];
const length = ips.length;
const filtered = ips.filter(ip => ip.startsWith("10.0.0"));
```

```python
# Python
ips: list[str] = ["10.0.0.1", "10.0.0.2", "10.0.0.3"]
ips.append("10.0.0.4")       # push → append
first = ips[0]
length = len(ips)             # .length → len()
filtered = [ip for ip in ips if ip.startswith("10.0.0")]  # filter → list comprehension

# Slicing – khả năng mạnh mà JS không có
last_two = ips[-2:]           # 2 phần tử cuối
reversed_ips = ips[::-1]      # đảo ngược
```

### Dict – tương đương Object/Map

```typescript
// TypeScript
const alert: Record<string, any> = {
  severity: "high",
  source_ip: "192.168.1.100",
  count: 15
};
alert["status"] = "open";
const severity = alert.severity;
```

```python
# Python
alert: dict[str, any] = {
    "severity": "high",
    "source_ip": "192.168.1.100",
    "count": 15
}
alert["status"] = "open"
severity = alert["severity"]       # hoặc alert.get("severity", "unknown")

# .get() an toàn hơn – trả default nếu key không tồn tại (thay vì crash)
status = alert.get("missing_key", "default_value")

# Duyệt dict
for key, value in alert.items():
    print(f"{key}: {value}")
```

### Tuple – giống Array nhưng immutable

```python
# Tuple: không thể thay đổi sau khi tạo
connection = ("192.168.1.1", 443, "tcp")
ip, port, proto = connection    # destructuring (giống JS)

# Dùng khi: trả về nhiều giá trị từ hàm
def get_ip_port():
    return "10.0.0.1", 8080     # trả tuple

ip, port = get_ip_port()
```

### Set – tập hợp không trùng lặp

```python
# Giống JS Set
unique_ips = {"10.0.0.1", "10.0.0.2", "10.0.0.1"}
print(unique_ips)   # {"10.0.0.1", "10.0.0.2"}

unique_ips.add("10.0.0.3")

# Rất hữu ích: tìm IP xuất hiện ở cả 2 danh sách
internal = {"10.0.0.1", "10.0.0.2", "10.0.0.3"}
suspicious = {"10.0.0.2", "10.0.0.3", "192.168.1.1"}
overlap = internal & suspicious    # intersection: {"10.0.0.2", "10.0.0.3"}
```

---

## 4. Hàm và Lambda

### Khai báo hàm

```typescript
// TypeScript
function calculateThreatScore(
  connections: number,
  uniquePorts: number,
  avgBytes: number
): number {
  return connections * 0.3 + uniquePorts * 0.5 + avgBytes * 0.2;
}

// Arrow function
const isHighRisk = (score: number): boolean => score > 80;
```

```python
# Python
def calculate_threat_score(
    connections: int,
    unique_ports: int,
    avg_bytes: float
) -> float:
    """Tính điểm đe dọa dựa trên network metrics."""  # docstring
    return connections * 0.3 + unique_ports * 0.5 + avg_bytes * 0.2

# Lambda – giống arrow function nhưng chỉ 1 biểu thức
is_high_risk = lambda score: score > 80

# Default parameters
def analyze(data: list, threshold: float = 0.5, verbose: bool = False):
    if verbose:
        print(f"Analyzing {len(data)} records, threshold={threshold}")
    # ...
```

**Khác biệt quan trọng:**
- Python dùng **indent (thụt lề)** thay vì `{}` để phân chia block code
- Docstring (`"""..."""`) thay vì JSDoc
- Lambda chỉ được 1 dòng – hàm phức tạp phải dùng `def`

### Destructuring / Unpacking

```python
# Giống destructuring trong JS
source_ip, dest_ip, port = ("10.0.0.1", "192.168.1.1", 443)

# Spread operator → * trong Python
first, *rest = [1, 2, 3, 4, 5]
# first = 1, rest = [2, 3, 4, 5]

# Dict unpacking → **
defaults = {"threshold": 0.5, "batch_size": 100}
config = {**defaults, "threshold": 0.7}  # override threshold
```

---

## 5. Type Hints

Python là dynamic typing mặc định, nhưng hỗ trợ **type hints** tương tự TypeScript. Type hints không bắt buộc nhưng rất khuyến khích.

```python
from typing import Optional

# Kiểu cơ bản
name: str = "anomaly_detector"
count: int = 42
score: float = 0.95
is_valid: bool = True

# List, Dict, Tuple
ips: list[str] = ["10.0.0.1", "10.0.0.2"]
config: dict[str, int] = {"threshold": 50, "batch_size": 100}
connection: tuple[str, int] = ("10.0.0.1", 443)

# Optional – giống `string | null` trong TypeScript
username: Optional[str] = None        # có thể là str hoặc None

# Union types (Python 3.10+)
result: str | int = "success"          # giống TypeScript union

# Hàm
def detect_anomaly(
    features: list[float],
    threshold: float = 0.5
) -> bool:
    return max(features) > threshold
```

**So sánh TypeScript ↔ Python:**

| TypeScript | Python |
|---|---|
| `string \| null` | `Optional[str]` hoặc `str \| None` |
| `Array<string>` | `list[str]` |
| `Record<string, number>` | `dict[str, int]` |
| `[string, number]` | `tuple[str, int]` |
| `interface` | `TypedDict` hoặc `dataclass` |

---

## 6. Class và Dataclass

### Class thường

```typescript
// TypeScript
class AnomalyDetector {
  private threshold: number;
  private modelName: string;

  constructor(modelName: string, threshold: number = 0.5) {
    this.modelName = modelName;
    this.threshold = threshold;
  }

  detect(score: number): boolean {
    return score > this.threshold;
  }
}
```

```python
# Python
class AnomalyDetector:
    def __init__(self, model_name: str, threshold: float = 0.5):
        self.model_name = model_name        # self thay vì this
        self.threshold = threshold
        self._trained = False               # _ prefix = private (convention)

    def detect(self, score: float) -> bool:
        """Phát hiện bất thường dựa trên score."""
        return score > self.threshold

# Sử dụng
detector = AnomalyDetector("isolation_forest", threshold=0.7)
is_anomaly = detector.detect(0.85)      # True
```

### Dataclass – tương đương interface/DTO

Rất hay dùng để định nghĩa cấu trúc dữ liệu, giống DTO trong NestJS:

```python
from dataclasses import dataclass, field

@dataclass
class NetworkFlow:
    """Một bản ghi kết nối mạng – tương tự Zeek conn.log record."""
    source_ip: str
    dest_ip: str
    dest_port: int
    protocol: str
    duration: float
    orig_bytes: int
    resp_bytes: int
    conn_state: str = "SF"                    # default value
    is_anomaly: bool = False
    tags: list[str] = field(default_factory=list)  # mutable default

# Tạo instance – không cần new
flow = NetworkFlow(
    source_ip="10.0.0.1",
    dest_ip="192.168.1.100",
    dest_port=443,
    protocol="tcp",
    duration=2.5,
    orig_bytes=1024,
    resp_bytes=4096
)

print(flow.source_ip)   # "10.0.0.1"
print(flow)             # tự động có __repr__
```

**Tại sao dùng `@dataclass`?**
- Tự động tạo `__init__`, `__repr__`, `__eq__`
- Giống cách bạn dùng `class-validator` DTO trong NestJS nhưng gọn hơn
- Dùng nhiều khi định nghĩa cấu trúc dữ liệu ML: features, predictions, model config

---

## 7. Module và Package

### Import

```typescript
// TypeScript
import { AlertService } from './alerts/alerts.service';
import * as fs from 'fs';
import axios from 'axios';
```

```python
# Python
from alerts.alert_service import AlertService     # tương tự
import os                                          # giống import * as os
import requests                                    # giống import axios

# Import cụ thể
from sklearn.ensemble import IsolationForest
from typing import Optional, List

# Alias
import numpy as np
import pandas as pd
```

### Cấu trúc project

```
ml-engine/
├── main.py                  # entry point
├── requirements.txt         # dependencies
├── config/
│   ├── __init__.py         # đánh dấu đây là package (giống index.ts)
│   └── settings.py
├── services/
│   ├── __init__.py
│   ├── detector.py
│   └── feature_extractor.py
└── models/
    ├── __init__.py
    └── schemas.py           # dataclass definitions
```

File `__init__.py` giống `index.ts` – đánh dấu thư mục là Python package để có thể import.

---

## 8. Virtual Environment (Chi tiết)

### Tại sao cần?

Giống lý do Node.js dùng `node_modules` riêng cho mỗi project – để tránh xung đột version:

```bash
# Project A cần pandas 1.5
# Project B cần pandas 2.0
# → Mỗi project có venv riêng, không conflict
```

### Workflow thường dùng

```bash
# 1. Tạo project mới
mkdir ml-engine && cd ml-engine

# 2. Tạo venv
python3 -m venv .venv

# 3. Kích hoạt
source .venv/bin/activate

# 4. Cài dependencies
pip install fastapi uvicorn pandas numpy scikit-learn elasticsearch

# 5. Freeze dependencies
pip freeze > requirements.txt

# 6. Thêm vào .gitignore
echo ".venv/" >> .gitignore
```

---

## 9. File I/O và JSON

### Đọc/ghi file

```python
# Đọc file (giống fs.readFileSync)
with open("data.txt", "r") as f:
    content = f.read()               # đọc toàn bộ
    # hoặc
    lines = f.readlines()            # đọc từng dòng

# Ghi file
with open("output.txt", "w") as f:
    f.write("Hello from ML Engine\n")
```

`with` tự động đóng file khi xong – giống `try-finally` nhưng gọn hơn.

### JSON – dùng rất nhiều khi giao tiếp với NestJS

```python
import json

# Parse JSON string → dict (giống JSON.parse)
json_str = '{"severity": "high", "score": 0.95}'
data = json.loads(json_str)
print(data["severity"])   # "high"

# Dict → JSON string (giống JSON.stringify)
result = {"anomaly": True, "score": 0.95, "model": "isolation_forest"}
json_output = json.dumps(result, indent=2)

# Đọc JSON file
with open("config.json", "r") as f:
    config = json.load(f)

# Ghi JSON file
with open("result.json", "w") as f:
    json.dump(result, f, indent=2)
```

---

## 10. Error Handling

```typescript
// TypeScript
try {
  const result = riskyOperation();
} catch (error) {
  if (error instanceof HttpException) {
    console.error(`HTTP Error: ${error.message}`);
  }
} finally {
  cleanup();
}
```

```python
# Python
try:
    result = risky_operation()
except ValueError as e:          # catch → except
    print(f"Value error: {e}")
except (TypeError, KeyError):    # bắt nhiều loại
    print("Type or key error")
except Exception as e:           # catch-all (giống catch(error))
    print(f"Unexpected error: {e}")
else:
    print("No error occurred")   # chạy khi KHÔNG có lỗi
finally:
    cleanup()

# Raise exception (giống throw)
def validate_threshold(value: float):
    if not 0 <= value <= 1:
        raise ValueError(f"Threshold must be 0-1, got {value}")
```

### Custom Exception

```python
class ModelNotTrainedError(Exception):
    """Lỗi khi cố predict nhưng model chưa được train."""
    def __init__(self, model_name: str):
        super().__init__(f"Model '{model_name}' has not been trained yet")
        self.model_name = model_name

# Sử dụng
def predict(features):
    if not model_loaded:
        raise ModelNotTrainedError("isolation_forest")
```

---

## 11. List Comprehension

Đây là tính năng rất hay của Python mà JS không có tương đương ngắn gọn. Dùng cực nhiều trong data processing.

```python
# Thay vì:
result = []
for ip in all_ips:
    if ip.startswith("10."):
        result.append(ip)

# Viết gọn thành 1 dòng:
result = [ip for ip in all_ips if ip.startswith("10.")]

# So sánh TypeScript:
# const result = allIps.filter(ip => ip.startsWith("10."))

# Thêm transform (giống .map + .filter):
scores = [calculate_score(ip) for ip in all_ips if ip.startswith("10.")]
# TS: allIps.filter(ip => ip.startsWith("10.")).map(ip => calculateScore(ip))

# Dict comprehension
port_counts = {port: count for port, count in raw_data.items() if count > 10}

# Set comprehension
unique_protocols = {flow["protocol"] for flow in flows}
```

**Ví dụ thực tế – xử lý network data:**

```python
# Dữ liệu network connections
connections = [
    {"src": "10.0.0.1", "dst": "8.8.8.8", "port": 53, "bytes": 120},
    {"src": "10.0.0.2", "dst": "192.168.1.1", "port": 443, "bytes": 5000},
    {"src": "10.0.0.1", "dst": "evil.com", "port": 4444, "bytes": 50000},
    {"src": "10.0.0.3", "dst": "8.8.4.4", "port": 53, "bytes": 80},
]

# Lọc connection có bytes > 10000 (tiềm năng data exfiltration)
large_transfers = [c for c in connections if c["bytes"] > 10000]

# Lấy danh sách IP nguồn duy nhất
unique_sources = {c["src"] for c in connections}

# Tạo dict: IP → tổng bytes
from collections import defaultdict
bytes_by_ip = defaultdict(int)
for c in connections:
    bytes_by_ip[c["src"]] += c["bytes"]
# {'10.0.0.1': 50120, '10.0.0.2': 5000, '10.0.0.3': 80}
```

---

## 12. Bài tập thực hành

### Bài 1: Script đọc JSON config

Viết script Python đọc file `config.json` chứa cấu hình ML engine, in ra các giá trị. Nếu file không tồn tại, in thông báo lỗi.

```json
{
  "model_name": "isolation_forest",
  "threshold": 0.5,
  "batch_size": 1000,
  "features": ["duration", "orig_bytes", "resp_bytes"]
}
```

### Bài 2: Phân tích danh sách connections

Cho danh sách connections (list of dicts), viết hàm:
- Đếm số connection từ mỗi `source_ip`
- Tìm IP có nhiều connection nhất
- Lọc các connection có `dest_port` thuộc danh sách suspicious ports: `[4444, 5555, 6666, 31337]`

### Bài 3: Dataclass NetworkAlert

Tạo `@dataclass` cho `NetworkAlert` gồm các trường: `alert_id`, `source_ip`, `dest_ip`, `severity` (high/medium/low), `score` (float), `timestamp` (str), `description`. Viết hàm `to_json()` chuyển sang dict để gửi API.

---

> **Tài liệu tiếp theo:** [02 – Pandas: Xử lý dữ liệu dạng bảng](./02-pandas-data-processing.md)
