import type { Lesson } from '../types/lesson';

export const lesson03: Lesson = {
  id: '03-numpy-statistics',
  number: 3,
  title: 'NumPy – Ma trận và Thống kê',
  description:
    'Hiểu NumPy array – nền tảng tính toán cho mọi thư viện ML (Scikit-learn, PyTorch đều dùng NumPy bên dưới)',
  phase: 'phase-1',
  estimatedTime: '2-3 ngày',
  prerequisites: ['01-python-fundamentals'],

  sections: [
    /* ───── 1. Tại sao cần NumPy ───── */
    {
      id: 'why-numpy',
      title: '1. Tại sao cần NumPy?',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'numpy_speed.py',
        description:
          'Python list chậm vì mỗi phần tử có thể khác kiểu. NumPy array chứa CÙNG kiểu dữ liệu → tính toán nhanh hơn 10-100 lần. Scikit-learn, PyTorch đều dùng NumPy bên dưới.',
        code: `import numpy as np
import time

# So sánh tốc độ: Python list vs NumPy array
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

# NumPy nhanh hơn ~50-100 lần!`,
        output: `Python list: 0.0800s
NumPy array: 0.0010s`,
      },
    },

    /* ───── 2. Tạo Array ───── */
    {
      id: 'array-creation',
      title: '2. Tạo Array',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'create_arrays.py',
        description:
          '1D array = vector, 2D array = matrix (bảng dữ liệu). NumPy cung cấp nhiều hàm tạo array tiện dụng.',
        code: `import numpy as np

# === 1D array (vector) ===
bytes_data = np.array([120, 5000, 50000, 80, 150])
print(bytes_data.dtype)   # int64
print(bytes_data.shape)   # (5,) → 5 phần tử, 1 chiều

# === 2D array (matrix) – giống bảng dữ liệu ===
# Mỗi dòng là 1 connection: [duration, orig_bytes, resp_bytes]
features = np.array([
    [2.5, 1024, 4096],
    [0.1, 50, 20],
    [120.0, 500000, 1000],
    [1.8, 800, 3200],
])
print(features.shape)     # (4, 3) → 4 dòng, 3 cột

# === Hàm tạo tiện dụng ===
zeros = np.zeros((3, 4))              # 3×4, toàn 0
ones = np.ones((2, 3))                # 2×3, toàn 1
sequence = np.arange(0, 10, 2)        # [0, 2, 4, 6, 8]
thresholds = np.linspace(0.1, 0.9, 9) # [0.1, 0.2, ..., 0.9]
random_data = np.random.randint(0, 100000, size=100)  # 100 số ngẫu nhiên`,
      },
    },

    /* ───── 3. Indexing & Slicing ───── */
    {
      id: 'indexing-slicing',
      title: '3. Indexing và Slicing',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'indexing.py',
        description:
          'NumPy mở rộng indexing của Python với 2D indexing và boolean masking – công cụ cực mạnh để lọc dữ liệu.',
        code: `import numpy as np

data = np.array([10, 20, 30, 40, 50, 60, 70, 80, 90])
print(data[0])       # 10
print(data[-1])      # 90 (phần tử cuối)
print(data[2:5])     # [30, 40, 50]

# === 2D indexing ===
features = np.array([
    [2.5,  1024,   4096],    # connection 0
    [0.1,    50,     20],    # connection 1
    [120.0, 500000, 1000],   # connection 2
])

print(features[0])          # [2.5, 1024., 4096.] → dòng 0
print(features[0, 1])       # 1024.0 → dòng 0, cột 1
print(features[:, 0])       # [2.5, 0.1, 120.0] → tất cả dòng, cột 0
print(features[:, 1:])      # cột 1 trở đi

# === Boolean indexing (cực mạnh!) ===
durations = features[:, 0]
long_conn = features[durations > 2.0]
print(long_conn)
# Trả về dòng có duration > 2.0: [[2.5, 1024, 4096], [120.0, 500000, 1000]]`,
        output: `10
90
[30 40 50]
[  2.5 1024.  4096. ]
1024.0
[  2.5   0.1 120. ]
[[  2.5e+00   1.024e+03   4.096e+03]
 [  1.2e+02   5.0e+05   1.0e+03]]`,
      },
    },

    /* ───── 4. Phép toán trên Array ───── */
    {
      id: 'array-operations',
      title: '4. Phép toán trên Array',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'array_ops.py',
        description:
          'NumPy thực hiện phép toán element-wise (từng phần tử) – không cần vòng lặp. Đây gọi là vectorized operations.',
        code: `import numpy as np

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
print(f"Suspicious connections: {suspicious_count}")`,
        output: `Suspicious connections: 2`,
      },
    },

    /* ───── 5. Broadcasting ───── */
    {
      id: 'broadcasting',
      title: '5. Broadcasting',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'broadcasting.py',
        description:
          'Broadcasting là cách NumPy tự động "mở rộng" array nhỏ để khớp với array lớn. Đây chính là cơ chế bên dưới StandardScaler của Scikit-learn!',
        code: `import numpy as np

# Ví dụ 1: Scalar broadcasting
bytes_data = np.array([1024, 2048, 512])
kb_data = bytes_data / 1024    # [1.0, 2.0, 0.5]
# NumPy tự "mở rộng" 1024 thành [1024, 1024, 1024]

# Ví dụ 2: Trừ mean
data = np.array([100, 200, 300, 400, 500])
centered = data - data.mean()   # [-200, -100, 0, 100, 200]

# Ví dụ 3: 2D – chuẩn hóa theo cột (StandardScaler thủ công)
features = np.array([
    [2.5,   1024,  4096],
    [0.1,     50,    20],
    [120.0, 500000, 1000],
])

col_means = features.mean(axis=0)  # mean MỖI CỘT
col_stds = features.std(axis=0)    # std MỖI CỘT

normalized = (features - col_means) / col_stds
# Mỗi cột có mean ≈ 0, std ≈ 1
# Đây chính là StandardScaler trong Scikit-learn!
print("Normalized means:", normalized.mean(axis=0))
print("Normalized stds:", normalized.std(axis=0))`,
        output: `Normalized means: [ 0.  0.  0.]
Normalized stds: [1. 1. 1.]`,
      },
    },

    /* ───── 5b. Tại sao phải chuẩn hóa ───── */
    {
      id: 'why-normalize',
      title: 'Tại sao phải chuẩn hóa dữ liệu?',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          'Khi dữ liệu mạng có cột `duration` (0–300 giây) và `bytes` (0–5.000.000), nếu không chuẩn hóa, cột `bytes` sẽ **"áp đảo"** cột `duration` trong ML model.',
          'Chuẩn hóa đưa tất cả features về cùng scale → model xem xét mỗi feature **công bằng**.',
        ],
        highlights: [
          {
            type: 'important',
            text: 'Quy tắc: **LUÔN** chuẩn hóa dữ liệu trước khi đưa vào ML model (trừ tree-based models như Random Forest).',
          },
        ],
      },
    },

    /* ───── 6. Thống kê cơ bản ───── */
    {
      id: 'basic-statistics',
      title: '6. Thống kê cơ bản',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'statistics.py',
        description:
          'Các hàm thống kê cốt lõi cho ML: mean, median, std, percentile. Percentile cực kỳ quan trọng để đặt threshold phát hiện bất thường.',
        code: `import numpy as np

data = np.array([120, 5000, 50000, 80, 150, 200, 800, 3000, 450, 50])

# Các hàm thống kê quan trọng cho ML
print(f"Mean (trung bình):     {np.mean(data):.1f}")     # 5985.0
print(f"Median (trung vị):     {np.median(data):.1f}")    # 325.0
print(f"Std (độ lệch chuẩn):  {np.std(data):.1f}")       # 14847.5
print(f"Min:                    {np.min(data)}")           # 50
print(f"Max:                    {np.max(data)}")           # 50000

# Percentile – quan trọng cho threshold
print(f"P25: {np.percentile(data, 25):.1f}")   # 127.5
print(f"P75: {np.percentile(data, 75):.1f}")   # 3500.0
print(f"P95: {np.percentile(data, 95):.1f}")   # 32000.0
print(f"P99: {np.percentile(data, 99):.1f}")   # 46400.0

# === Phát hiện outlier bằng Z-score ===
mean = np.mean(data)
std = np.std(data)
z_scores = (data - mean) / std
outliers = data[np.abs(z_scores) > 2]
print(f"\\nOutliers (Z > 2): {outliers}")       # [50000]

# === Phát hiện outlier bằng IQR ===
q1 = np.percentile(data, 25)
q3 = np.percentile(data, 75)
iqr = q3 - q1
outliers_iqr = data[(data < q1 - 1.5*iqr) | (data > q3 + 1.5*iqr)]
print(f"Outliers (IQR): {outliers_iqr}")`,
        output: `Mean (trung bình):     5985.0
Median (trung vị):     325.0
Std (độ lệch chuẩn):  14847.5
Min:                    50
Max:                    50000
P25: 127.5
P75: 3500.0
P95: 32000.0
P99: 46400.0

Outliers (Z > 2): [50000]
Outliers (IQR): [50000]`,
      },
    },

    /* ───── 7. Chuẩn hóa ───── */
    {
      id: 'normalization',
      title: '7. Chuẩn hóa dữ liệu',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'normalization.py',
        description:
          'Hai phương pháp chuẩn hóa phổ biến nhất: Min-Max Scaling (co về [0,1]) và Standard Scaling (Z-score, mean=0, std=1).',
        code: `import numpy as np

data = np.array([120, 5000, 50000, 80, 150])

# === Min-Max Scaling (0-1) ===
# Công thức: (x - min) / (max - min)
data_minmax = (data - data.min()) / (data.max() - data.min())
print("Min-Max:", data_minmax)
# [0.0008, 0.0986, 1.0, 0.0, 0.0014]

# === Standard Scaling (Z-score) ===
# Công thức: (x - mean) / std
data_zscore = (data - data.mean()) / data.std()
print("Z-score:", data_zscore)
# [-0.42, -0.14, 2.96, -0.43, -0.42]`,
      },
    },

    /* ───── 7b. So sánh Min-Max vs Z-score ───── */
    {
      id: 'scaling-comparison',
      title: 'Min-Max Scaling ↔ Standard Scaling',
      type: 'comparison-table',
      content: {
        kind: 'comparison-table',
        headers: ['Tiêu chí', 'Min-Max (0-1)', 'Standard (Z-score)'],
        rows: [
          ['Công thức', '(x - min) / (max - min)', '(x - mean) / std'],
          ['Khoảng giá trị', '[0, 1]', 'Không giới hạn'],
          ['Nhạy với outlier', 'CÓ – outlier nén các giá trị khác', 'Ít hơn'],
          ['Khi nào dùng', 'Neural network, image data', 'Hầu hết ML models'],
          ['Scikit-learn', 'MinMaxScaler', 'StandardScaler'],
        ],
        caption: 'Standard Scaling (Z-score) phổ biến hơn cho ML truyền thống',
      },
    },

    /* ───── 8. Reshape ───── */
    {
      id: 'reshape-dimension',
      title: '8. Reshape và Dimension',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'reshape.py',
        description:
          'ML model yêu cầu dữ liệu đúng shape. reshape(-1, 1) là fix phổ biến nhất cho lỗi "Expected 2D array, got 1D".',
        code: `import numpy as np

# 1D → 2D (1 cột) – fix lỗi thường gặp trong ML
data = np.array([1, 2, 3, 4, 5, 6])
print(data.shape)           # (6,) → 1D

column = data.reshape(-1, 1)  # -1 = tự tính số dòng
print(column.shape)         # (6, 1) → 6 dòng x 1 cột

# Flatten 2D → 1D
matrix = np.array([[1, 2], [3, 4], [5, 6]])
flat = matrix.flatten()     # [1, 2, 3, 4, 5, 6]

# Transpose (hoán vị hàng ↔ cột)
print(matrix.T)
# [[1, 3, 5],
#  [2, 4, 6]]

# === Lỗi thường gặp trong ML ===
# model.fit(data_1d)  → ValueError: Expected 2D array, got 1D
# Fix: data_2d = data_1d.reshape(-1, 1)  → OK!`,
      },
    },

    /* ───── 9. Ví dụ thực tế ───── */
    {
      id: 'practical-example',
      title: '9. Ví dụ thực tế: Chuẩn hóa Network Features',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'normalize_network_features.py',
        description:
          'Pipeline hoàn chỉnh: tạo feature matrix với scale rất khác nhau → StandardScaler thủ công → lưu scaler params để dùng khi inference.',
        code: `import numpy as np

# Feature matrix: mỗi dòng = 1 IP, mỗi cột = 1 feature
features = np.array([
    # [conn_count, unique_ports, avg_duration, total_bytes, bytes_ratio]
    [15,  3,   2.1,   15000,  0.25],  # IP bình thường
    [12,  2,   1.8,   10000,  0.30],  # IP bình thường
    [500, 100, 0.05,  50000,  5.00],  # Đáng ngờ: port scan?
    [8,   1,   45.0,  800000, 8.00],  # Đáng ngờ: C2?
    [20,  4,   3.2,   18000,  0.20],  # IP bình thường
])

feature_names = [
    "conn_count", "unique_ports", "avg_duration",
    "total_bytes", "bytes_ratio",
]

# Bước 1: Xem dữ liệu thô – scale rất khác nhau!
print("--- Dữ liệu thô ---")
for i, name in enumerate(feature_names):
    col = features[:, i]
    print(f"{name:15s}: min={col.min():>10.2f}, max={col.max():>10.2f}")

# Bước 2: Standard Scaling
means = features.mean(axis=0)
stds = features.std(axis=0)
features_scaled = (features - means) / stds

print("\\n--- Sau chuẩn hóa ---")
for i, name in enumerate(feature_names):
    col = features_scaled[:, i]
    print(f"{name:15s}: min={col.min():>7.2f}, max={col.max():>7.2f}")

# Bước 3: Lưu scaler params (cần khi predict dữ liệu mới)
scaler_params = {"means": means.tolist(), "stds": stds.tolist()}
print(f"\\nScaler params: {scaler_params}")`,
        output: `--- Dữ liệu thô ---
conn_count     : min=      8.00, max=    500.00
unique_ports   : min=      1.00, max=    100.00
avg_duration   : min=      0.05, max=     45.00
total_bytes    : min=  10000.00, max= 800000.00
bytes_ratio    : min=      0.20, max=      8.00

--- Sau chuẩn hóa ---
conn_count     : min=  -0.53, max=   2.21
unique_ports   : min=  -0.55, max=   2.17
avg_duration   : min=  -0.48, max=   2.44
total_bytes    : min=  -0.41, max=   2.29
bytes_ratio    : min=  -0.52, max=   2.17`,
      },
    },
  ],

  quiz: [
    {
      id: 'q03-1',
      type: 'multiple-choice',
      question:
        'Array có shape (100, 5) nghĩa là gì?',
      options: [
        '100 cột, 5 dòng',
        '100 dòng, 5 cột',
        '500 phần tử, 1 chiều',
        '5 ma trận, mỗi ma trận 100 phần tử',
      ],
      correctAnswer: 1,
      explanation:
        'Shape (100, 5) = 100 dòng × 5 cột. Trong ML: 100 samples (connections), mỗi sample có 5 features.',
    },
    {
      id: 'q03-2',
      type: 'multiple-choice',
      question:
        'Phép tính nào sau đây cho kết quả array [2.0, 4.0, 6.0]?',
      options: [
        'np.array([1, 2, 3]) + np.array([1, 2, 3])',
        'np.array([1, 2, 3]) * 2',
        'Cả hai đều đúng',
        'Không có đáp án đúng',
      ],
      correctAnswer: 2,
      explanation:
        'Cả hai đều đúng nhờ vectorized operations: phép cộng element-wise và broadcasting (nhân scalar tự mở rộng cho từng phần tử).',
    },
    {
      id: 'q03-3',
      type: 'multiple-choice',
      question:
        'Để chuẩn hóa dữ liệu về mean=0, std=1, dùng công thức nào?',
      options: [
        '(x - min) / (max - min)',
        '(x - mean) / std',
        'x / max',
        'log(x)',
      ],
      correctAnswer: 1,
      explanation:
        '(x - mean) / std là công thức Standard Scaling (Z-score). Scikit-learn gói gọn trong StandardScaler. Đây là phương pháp chuẩn hóa phổ biến nhất.',
    },
    {
      id: 'q03-4',
      type: 'multiple-choice',
      question:
        'Khi gặp lỗi "Expected 2D array, got 1D array" trong Scikit-learn, bạn fix bằng cách nào?',
      options: [
        'data.flatten()',
        'data.reshape(-1, 1)',
        'data.transpose()',
        'np.expand_dims(data, axis=0)',
      ],
      correctAnswer: 1,
      explanation:
        'reshape(-1, 1) chuyển array 1D shape (n,) thành 2D shape (n, 1). -1 nghĩa là NumPy tự tính số dòng. Đây là fix phổ biến nhất cho lỗi shape trong ML.',
    },
    {
      id: 'q03-5',
      type: 'multiple-choice',
      question:
        'Percentile 95 (P95) của anomaly score được dùng để làm gì?',
      options: [
        'Tính trung bình score',
        'Đặt threshold phát hiện bất thường – 5% bất thường nhất bị flag',
        'Loại bỏ 95% dữ liệu',
        'Chuẩn hóa score về [0, 1]',
      ],
      correctAnswer: 1,
      explanation:
        'P95 = giá trị mà 95% dữ liệu nằm dưới. Dùng P95 làm threshold nghĩa là flag 5% điểm dữ liệu có score cao nhất là bất thường.',
    },
  ],
};
