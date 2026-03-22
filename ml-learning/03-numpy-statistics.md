# Tài liệu 03: NumPy – Tính toán Ma trận và Thống kê

> **Mục tiêu:** Hiểu NumPy array – nền tảng tính toán cho mọi thư viện ML (Scikit-learn, PyTorch đều dùng NumPy bên dưới).
> **Thời gian học:** 2-3 ngày | **Yêu cầu:** Đã hoàn thành Tài liệu 01

---

## Mục lục

1. [Tại sao cần NumPy?](#1-tại-sao-cần-numpy)
2. [Tạo Array](#2-tạo-array)
3. [Indexing và Slicing](#3-indexing-và-slicing)
4. [Phép toán trên Array](#4-phép-toán-trên-array)
5. [Broadcasting](#5-broadcasting)
6. [Thống kê cơ bản](#6-thống-kê-cơ-bản)
7. [Chuẩn hóa dữ liệu](#7-chuẩn-hóa-dữ-liệu)
8. [Reshape và Dimension](#8-reshape-và-dimension)
9. [Ví dụ thực tế: Chuẩn hóa Network Features](#9-ví-dụ-thực-tế-chuẩn-hóa-network-features)
10. [Bài tập thực hành](#10-bài-tập-thực-hành)

---

## 1. Tại sao cần NumPy?

Python list chậm vì mỗi phần tử có thể khác kiểu. NumPy array chứa **cùng kiểu dữ liệu** → tính toán nhanh hơn **10-100 lần**.

```python
import numpy as np
import time

# So sánh tốc độ
size = 1_000_000

# Python list
py_list = list(range(size))
start = time.time()
result = [x * 2 for x in py_list]
print(f"Python list: {time.time() - start:.4f}s")

# NumPy array
np_array = np.arange(size)
start = time.time()
result = np_array * 2
print(f"NumPy array: {time.time() - start:.4f}s")

# NumPy nhanh hơn ~50-100 lần
```

**Khi nào dùng NumPy?**
- Tính toán số học trên lượng dữ liệu lớn (network traffic logs)
- Chuẩn hóa dữ liệu trước khi đưa vào ML model
- Scikit-learn nhận input là NumPy array (hoặc Pandas DataFrame tự chuyển)

---

## 2. Tạo Array

### Từ Python list

```python
import numpy as np

# 1D array (vector)
bytes_data = np.array([120, 5000, 50000, 80, 150])
print(bytes_data)        # [  120  5000 50000    80   150]
print(bytes_data.dtype)  # int64
print(bytes_data.shape)  # (5,) → 5 phần tử, 1 chiều

# 2D array (matrix) – giống bảng dữ liệu
# Mỗi dòng là 1 connection: [duration, orig_bytes, resp_bytes]
features = np.array([
    [2.5, 1024, 4096],
    [0.1, 50, 20],
    [120.0, 500000, 1000],
    [1.8, 800, 3200],
])
print(features.shape)   # (4, 3) → 4 dòng, 3 cột
```

### Hàm tạo array tiện dụng

```python
# Array toàn 0 (dùng để khởi tạo)
zeros = np.zeros((3, 4))         # 3 dòng x 4 cột, toàn 0

# Array toàn 1
ones = np.ones((2, 3))

# Dãy số (giống range())
sequence = np.arange(0, 10, 2)   # [0, 2, 4, 6, 8]

# Dãy số cách đều (hay dùng cho threshold)
thresholds = np.linspace(0.1, 0.9, 9)  # [0.1, 0.2, ..., 0.9]

# Random array (giả lập dữ liệu)
random_bytes = np.random.randint(0, 100000, size=100)  # 100 số ngẫu nhiên 0-99999
random_scores = np.random.random(50)                    # 50 số thực 0.0-1.0
```

---

## 3. Indexing và Slicing

```python
data = np.array([10, 20, 30, 40, 50, 60, 70, 80, 90])

# Giống Python list / JS array
print(data[0])      # 10
print(data[-1])     # 90 (phần tử cuối)
print(data[2:5])    # [30, 40, 50]

# 2D array
features = np.array([
    [2.5,  1024, 4096],    # connection 0
    [0.1,    50,   20],    # connection 1
    [120.0, 500000, 1000], # connection 2
])

print(features[0])         # [2.5, 1024., 4096.] → dòng 0
print(features[0, 1])      # 1024.0 → dòng 0, cột 1
print(features[:, 0])      # [2.5, 0.1, 120.0] → tất cả dòng, cột 0 (duration)
print(features[:, 1:])     # cột 1 trở đi (orig_bytes, resp_bytes)

# Boolean indexing (cực mạnh!)
durations = features[:, 0]
long_connections = features[durations > 2.0]
# Trả về các dòng có duration > 2.0
```

---

## 4. Phép toán trên Array

NumPy thực hiện phép toán **element-wise** (từng phần tử) – không cần vòng lặp:

```python
bytes_sent = np.array([1024, 2048, 512, 4096])
bytes_recv = np.array([4096, 1024, 256, 8192])

# Cộng
total = bytes_sent + bytes_recv    # [5120, 3072, 768, 12288]

# Tỷ lệ (ratio) – dấu hiệu phát hiện bất thường
ratio = bytes_sent / (bytes_recv + 1)  # +1 tránh chia 0
# [0.25, 2.0, 2.0, 0.5]
# ratio > 1 = gửi nhiều hơn nhận → tiềm năng data exfiltration

# So sánh → array boolean
is_suspicious = ratio > 1.5    # [False, True, True, False]

# Đếm True
suspicious_count = np.sum(is_suspicious)  # 2
```

---

## 5. Broadcasting

Broadcasting là cách NumPy tự động "mở rộng" array nhỏ để khớp với array lớn. Nghe phức tạp nhưng thực tế rất trực quan:

```python
# Ví dụ 1: Nhân tất cả phần tử với 1 số (scalar)
bytes_data = np.array([1024, 2048, 512])
kb_data = bytes_data / 1024    # [1.0, 2.0, 0.5]
# NumPy tự "mở rộng" 1024 thành [1024, 1024, 1024]

# Ví dụ 2: Chuẩn hóa bằng trừ mean
data = np.array([100, 200, 300, 400, 500])
mean = data.mean()  # 300
centered = data - mean  # [-200, -100, 0, 100, 200]
# NumPy tự trừ 300 cho TỪNG phần tử

# Ví dụ 3: 2D – chuẩn hóa theo cột
features = np.array([
    [2.5,  1024,  4096],
    [0.1,    50,    20],
    [120.0, 500000, 1000],
])
col_means = features.mean(axis=0)  # mean MỖI CỘT: [40.87, 167024.67, 1705.33]
col_stds = features.std(axis=0)    # std MỖI CỘT

normalized = (features - col_means) / col_stds
# Kết quả: mỗi cột có mean ≈ 0, std ≈ 1
# Đây chính là StandardScaler trong Scikit-learn!
```

**Tại sao quan trọng?** Khi dữ liệu mạng có cột `duration` (0-300 giây) và `bytes` (0-5.000.000), nếu không chuẩn hóa, cột `bytes` sẽ "áp đảo" cột `duration` trong ML model.

---

## 6. Thống kê cơ bản

```python
data = np.array([120, 5000, 50000, 80, 150, 200, 800, 3000, 450, 50])

# Các hàm thống kê quan trọng cho ML
print(f"Mean (trung bình):    {np.mean(data):.1f}")      # 5985.0
print(f"Median (trung vị):    {np.median(data):.1f}")     # 325.0
print(f"Std (độ lệch chuẩn): {np.std(data):.1f}")        # 14847.5
print(f"Min:                   {np.min(data)}")            # 50
print(f"Max:                   {np.max(data)}")            # 50000

# Percentile – rất quan trọng cho threshold
print(f"P25:  {np.percentile(data, 25):.1f}")   # 127.5
print(f"P75:  {np.percentile(data, 75):.1f}")   # 3500.0
print(f"P95:  {np.percentile(data, 95):.1f}")   # 32000.0
print(f"P99:  {np.percentile(data, 99):.1f}")   # 46400.0
```

### Ý nghĩa trong phát hiện bất thường

```python
# Cách phát hiện outlier đơn giản: Z-score
# Nếu giá trị cách mean hơn 2 lần std → bất thường
mean = np.mean(data)
std = np.std(data)

z_scores = (data - mean) / std
outliers = data[np.abs(z_scores) > 2]
print(f"Outliers (Z > 2): {outliers}")  # [50000]

# Cách khác: IQR (Interquartile Range)
q1 = np.percentile(data, 25)
q3 = np.percentile(data, 75)
iqr = q3 - q1
lower_bound = q1 - 1.5 * iqr
upper_bound = q3 + 1.5 * iqr
outliers_iqr = data[(data < lower_bound) | (data > upper_bound)]
print(f"Outliers (IQR): {outliers_iqr}")
```

---

## 7. Chuẩn hóa dữ liệu

### Tại sao phải chuẩn hóa?

Hãy tưởng tượng bạn so sánh 2 người: một đo chiều cao bằng cm (170), một đo bằng mm (1700). Con số khác xa nhau nhưng thực tế bằng nhau. ML model cũng bị "nhầm" tương tự nếu dữ liệu không cùng scale.

```python
# Dữ liệu mạng: các cột có scale rất khác nhau
# duration: 0.01 - 300 (giây)
# orig_bytes: 50 - 5000000 (bytes)
# dest_port: 1 - 65535
```

### Min-Max Scaling (0-1)

```python
# Công thức: (x - min) / (max - min)
# Kết quả: tất cả giá trị nằm trong [0, 1]

data = np.array([120, 5000, 50000, 80, 150])
data_normalized = (data - data.min()) / (data.max() - data.min())
print(data_normalized)
# [0.0008, 0.0986, 1.0, 0.0, 0.0014]
```

### Standard Scaling (Z-score)

```python
# Công thức: (x - mean) / std
# Kết quả: mean ≈ 0, std ≈ 1 (phổ biến nhất cho ML)

data_standardized = (data - data.mean()) / data.std()
print(data_standardized)
# [-0.42, -0.14, 2.96, -0.43, -0.42]
```

**Scikit-learn làm điều này tự động bằng `StandardScaler` – bạn sẽ học ở tài liệu 05.**

---

## 8. Reshape và Dimension

ML model yêu cầu dữ liệu đúng shape. Hiểu reshape giúp debug lỗi thường gặp.

```python
# 1D → 2D (1 cột)
data = np.array([1, 2, 3, 4, 5, 6])
print(data.shape)          # (6,) → 1D

column = data.reshape(-1, 1)  # -1 = tự tính
print(column.shape)        # (6, 1) → 6 dòng x 1 cột

# Flatten 2D → 1D
matrix = np.array([[1, 2], [3, 4], [5, 6]])
flat = matrix.flatten()    # [1, 2, 3, 4, 5, 6]

# Transpose (hoán vị hàng ↔ cột)
print(matrix.T)
# [[1, 3, 5],
#  [2, 4, 6]]
```

### Lỗi thường gặp trong ML

```python
from sklearn.ensemble import IsolationForest

# Lỗi: Scikit-learn yêu cầu 2D input
data_1d = np.array([1, 2, 3, 4, 5])
# model.fit(data_1d)  # ValueError: Expected 2D array, got 1D array

# Fix: reshape thành 2D
data_2d = data_1d.reshape(-1, 1)  # (5,) → (5, 1)
# model.fit(data_2d)  # OK!
```

---

## 9. Ví dụ thực tế: Chuẩn hóa Network Features

```python
import numpy as np
import pandas as pd

# Đọc features từ tài liệu 02
# (hoặc tạo giả lập)
features = np.array([
    # [conn_count, unique_ports, avg_duration, total_bytes, bytes_ratio]
    [15,  3,   2.1,   15000,  0.25],  # IP bình thường
    [12,  2,   1.8,   10000,  0.30],  # IP bình thường
    [500, 100, 0.05,  50000,  5.00],  # IP đáng ngờ: nhiều port, duration thấp → port scan?
    [8,   1,   45.0,  800000, 8.00],  # IP đáng ngờ: duration cao, bytes lớn → C2?
    [20,  4,   3.2,   18000,  0.20],  # IP bình thường
])

feature_names = ["conn_count", "unique_ports", "avg_duration", "total_bytes", "bytes_ratio"]

# === Bước 1: Xem dữ liệu thô ===
print("--- Dữ liệu thô ---")
for i, name in enumerate(feature_names):
    col = features[:, i]
    print(f"{name:15s}: min={col.min():10.2f}, max={col.max():10.2f}, mean={col.mean():10.2f}")

# Scale rất khác nhau:
# conn_count:  8-500
# total_bytes: 10000-800000
# bytes_ratio: 0.2-8.0

# === Bước 2: Standard Scaling ===
means = features.mean(axis=0)
stds = features.std(axis=0)
features_scaled = (features - means) / stds

print("\n--- Sau chuẩn hóa (StandardScaler) ---")
for i, name in enumerate(feature_names):
    col = features_scaled[:, i]
    print(f"{name:15s}: min={col.min():7.2f}, max={col.max():7.2f}, mean={col.mean():7.4f}")

# Bây giờ tất cả cột có scale tương đương
# ML model sẽ "nhìn" tất cả features công bằng

# === Bước 3: Lưu scaler params (để dùng lại khi predict) ===
scaler_params = {"means": means.tolist(), "stds": stds.tolist()}
print(f"\nScaler params (lưu lại cho inference): {scaler_params}")
```

---

## 10. Bài tập thực hành

### Bài 1: Phát hiện outlier bằng Z-score

Cho mảng bytes: `[120, 200, 150, 5000000, 180, 220, 160, 140, 190, 170]`.
Viết code tìm giá trị nào là outlier (Z-score > 2). Giải thích tại sao `5000000` là outlier.

### Bài 2: Chuẩn hóa nhiều hình thức

Cho dữ liệu: `[10, 20, 30, 40, 50]`:
- Áp dụng Min-Max Scaling → kết quả trong [0, 1]
- Áp dụng Standard Scaling → kết quả mean ≈ 0, std ≈ 1
- So sánh 2 kết quả, khi nào dùng cách nào?

### Bài 3: Feature matrix cho ML

Tạo feature matrix 2D từ 3 mảng 1D (giả lập 100 connections):
- `durations = np.random.exponential(2.0, 100)`
- `bytes_sent = np.random.lognormal(6, 1, 100)`
- `bytes_recv = np.random.lognormal(7, 1, 100)`

Stack 3 mảng thành matrix (100, 3), chuẩn hóa, kiểm tra shape.

---

> **Tài liệu tiếp theo:** [04 – Kiến thức ML cơ bản](./04-ml-fundamentals.md)
