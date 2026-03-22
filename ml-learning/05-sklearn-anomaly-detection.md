# Tài liệu 05: Scikit-learn – Thực hành Anomaly Detection với Isolation Forest

> **Mục tiêu:** Thực hành xây dựng hệ thống phát hiện bất thường – thuật toán chính trong phụ lục kỹ-chiến thuật PT186S.
> **Thời gian học:** 3-4 ngày | **Yêu cầu:** Đã hoàn thành Tài liệu 01-04

---

## Mục lục

1. [Scikit-learn API Pattern](#1-scikit-learn-api-pattern)
2. [Isolation Forest – Ý tưởng cốt lõi](#2-isolation-forest--ý-tưởng-cốt-lõi)
3. [Thực hành: Train Isolation Forest](#3-thực-hành-train-isolation-forest)
4. [Hyperparameters quan trọng](#4-hyperparameters-quan-trọng)
5. [Pipeline: Scaler + Model](#5-pipeline-scaler--model)
6. [Threshold Tuning](#6-threshold-tuning)
7. [Model Serialization: Lưu và Nạp Model](#7-model-serialization-lưu-và-nạp-model)
8. [Ví dụ hoàn chỉnh: Network Anomaly Detection](#8-ví-dụ-hoàn-chỉnh)
9. [Bài tập thực hành](#9-bài-tập-thực-hành)

---

## 1. Scikit-learn API Pattern

Mọi model trong Scikit-learn đều theo cùng pattern – học 1 lần, dùng mãi:

```python
from sklearn.ensemble import IsolationForest

# 1. Khởi tạo model (giống new Service() trong NestJS)
model = IsolationForest(n_estimators=100, contamination=0.05)

# 2. Huấn luyện (giống setup/initialize)
model.fit(X_train)

# 3. Dự đoán (giống service method)
predictions = model.predict(X_new)

# 4. Tính score (mức độ bất thường)
scores = model.score_samples(X_new)
```

**So sánh với NestJS service:**

```typescript
// NestJS
const alertService = new AlertService(prisma, eventEmitter);  // 1. init
await alertService.loadRules(organizationId);                  // 2. setup
const result = alertService.evaluate(networkData);             // 3. use
```

```python
# Scikit-learn
model = IsolationForest(contamination=0.05)  # 1. init
model.fit(training_data)                      # 2. train (= setup)
result = model.predict(new_data)              # 3. predict (= use)
```

---

## 2. Isolation Forest – Ý tưởng cốt lõi

### Trực giác

Hãy tưởng tượng bạn chơi trò "20 Questions" để phân biệt từng kết nối mạng:

```
Kết nối bình thường (giống 95% traffic):
  Q1: bytes > 500?  → Yes
  Q2: port < 1024?  → Yes
  Q3: duration > 1s? → Yes
  Q4: protocol = tcp? → Yes
  → Cần 4 câu hỏi mới "cô lập" được connection này
    (vì nó giống nhiều connection khác)

Kết nối bất thường (khác biệt rõ ràng):
  Q1: bytes > 500000? → Yes (rất ít connection như vậy)
  → Chỉ 1 câu hỏi là "cô lập" được!
    (vì nó khác biệt, dễ tách ra khỏi đám đông)
```

**Nguyên lý Isolation Forest:**
- Xây nhiều cây quyết định ngẫu nhiên (random trees)
- Mỗi cây cố gắng "cô lập" từng điểm dữ liệu
- **Điểm bất thường bị cô lập nhanh hơn** (cần ít bước hơn)
- Anomaly score = trung bình path length qua tất cả cây

```
Path length ngắn → Dễ cô lập → Bất thường
Path length dài  → Khó cô lập → Bình thường
```

### Tại sao chọn Isolation Forest cho PT186S?

| Ưu điểm | Giải thích |
|---|---|
| Không cần labeled data | Triển khai ngay tại đơn vị mới |
| Hiệu quả với high-dimensional data | Network features có nhiều cột |
| Nhanh | Train trên 100K records trong vài giây |
| Ít hyperparameters | Dễ tune hơn deep learning |
| Scalable | Xử lý batch 5000+ records/phút dễ dàng |

---

## 3. Thực hành: Train Isolation Forest

```python
import numpy as np
from sklearn.ensemble import IsolationForest

# === Tạo dữ liệu giả lập ===
np.random.seed(42)

# 950 connections bình thường
# Features: [duration, orig_bytes, resp_bytes, dest_port, unique_dests]
normal = np.column_stack([
    np.random.exponential(2.0, 950),
    np.random.lognormal(6, 1.5, 950),
    np.random.lognormal(7, 1.5, 950),
    np.random.choice([53, 80, 443], 950),
    np.random.randint(1, 5, 950),
])

# 50 connections bất thường
anomaly = np.column_stack([
    np.random.exponential(0.05, 50),
    np.random.lognormal(10, 2, 50),
    np.random.lognormal(3, 1, 50),
    np.random.choice([4444, 5555, 31337], 50),
    np.random.randint(50, 200, 50),
])

X = np.vstack([normal, anomaly])
y_true = np.array([0]*950 + [1]*50)

# === Train Isolation Forest ===
model = IsolationForest(
    n_estimators=100,      # số cây quyết định
    contamination=0.05,    # ước lượng 5% anomaly
    random_state=42
)
model.fit(X)

# === Predict ===
# Output: 1 = normal, -1 = anomaly
raw_predictions = model.predict(X)
print(f"Normal:  {(raw_predictions == 1).sum()}")
print(f"Anomaly: {(raw_predictions == -1).sum()}")

# === Anomaly Scores ===
# Giá trị càng thấp (âm) → càng bất thường
scores = model.score_samples(X)
print(f"\nScore range: {scores.min():.3f} to {scores.max():.3f}")
print(f"Normal mean score:  {scores[:950].mean():.3f}")
print(f"Anomaly mean score: {scores[950:].mean():.3f}")
```

---

## 4. Hyperparameters quan trọng

### `n_estimators` – Số cây

```python
# Nhiều cây hơn → kết quả ổn định hơn, nhưng chậm hơn
# Mặc định: 100 (đủ cho hầu hết trường hợp)
model = IsolationForest(n_estimators=100)

# Production: 100-300 là đủ, tăng hơn hiếm khi cải thiện đáng kể
```

### `contamination` – Tỷ lệ anomaly ước lượng

Đây là hyperparameter **quan trọng nhất** – ảnh hưởng trực tiếp đến threshold.

```python
# contamination = tỷ lệ dữ liệu bạn NGHĨ là anomaly
# Ảnh hưởng trực tiếp đến ngưỡng (threshold) phân loại

# contamination thấp: ít alarm, có thể bỏ sót
model_strict = IsolationForest(contamination=0.01)  # 1% anomaly

# contamination cao: nhiều alarm, có thể nhiều false positive
model_sensitive = IsolationForest(contamination=0.10)  # 10% anomaly

# Khuyến nghị cho PT186S: 0.05 (5%) ban đầu, tune theo thực tế
```

### `max_features` – Số features mỗi cây

```python
# Mặc định: 1.0 (dùng tất cả features)
# Giảm xuống nếu có nhiều features không liên quan
model = IsolationForest(max_features=0.8)  # 80% features mỗi cây
```

---

## 5. Pipeline: Scaler + Model

Trong production, **luôn dùng Pipeline** để đảm bảo preprocessing và prediction nhất quán:

```python
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest

# === Tạo Pipeline ===
pipeline = Pipeline([
    ("scaler", StandardScaler()),           # Bước 1: chuẩn hóa
    ("detector", IsolationForest(           # Bước 2: detect
        n_estimators=100,
        contamination=0.05,
        random_state=42
    ))
])

# Train: pipeline tự động scale rồi train model
pipeline.fit(X_train)

# Predict: pipeline tự động scale rồi predict
predictions = pipeline.predict(X_new)

# Không cần nhớ scale thủ công!
```

**Tại sao dùng Pipeline?**

Không dùng Pipeline:
```python
# Dễ quên scale khi predict → kết quả sai
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
model.fit(X_train_scaled)

# Khi predict: PHẢI nhớ scale
X_new_scaled = scaler.transform(X_new)  # dùng transform(), KHÔNG phải fit_transform()!
predictions = model.predict(X_new_scaled)
```

Dùng Pipeline:
```python
# Gọn, không sợ quên
pipeline.fit(X_train)
predictions = pipeline.predict(X_new)  # tự động scale
```

---

## 6. Threshold Tuning

Isolation Forest trả `score_samples()` – số thực đo mức độ bất thường. Bạn có thể **tự chọn threshold** thay vì dùng mặc định:

```python
# Lấy anomaly scores
scores = model.score_samples(X)

# Default threshold (dựa trên contamination)
default_threshold = model.offset_   # score < threshold → anomaly

print(f"Default threshold: {default_threshold:.4f}")

# === Tự điều chỉnh threshold ===
import numpy as np

# Dùng percentile: ví dụ top 3% điểm anomaly nhất
custom_threshold = np.percentile(scores, 3)
custom_predictions = np.where(scores < custom_threshold, 1, 0)

# So sánh với mục tiêu phụ lục: FPR ≤ 10%, Recall ≥ 80%
from sklearn.metrics import confusion_matrix

cm = confusion_matrix(y_true, custom_predictions)
tn, fp, fn, tp = cm.ravel()

fpr = fp / (fp + tn)
recall = tp / (tp + fn)
print(f"Threshold: {custom_threshold:.4f}")
print(f"FPR: {fpr:.1%} (target: ≤ 10%)")
print(f"Recall: {recall:.1%} (target: ≥ 80%)")
```

### Tìm threshold tối ưu

```python
# Thử nhiều threshold, chọn cái thỏa mãn yêu cầu
thresholds = np.linspace(scores.min(), scores.max(), 100)

best_threshold = None
best_f1 = 0

for t in thresholds:
    preds = np.where(scores < t, 1, 0)
    cm = confusion_matrix(y_true, preds)
    tn, fp, fn, tp = cm.ravel()

    fpr = fp / (fp + tn)
    recall = tp / (tp + fn)
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0

    # Điều kiện: FPR ≤ 10% VÀ Recall ≥ 80%
    if fpr <= 0.10 and recall >= 0.80 and f1 > best_f1:
        best_f1 = f1
        best_threshold = t
        print(f"  Threshold={t:.4f}: FPR={fpr:.1%}, Recall={recall:.1%}, F1={f1:.1%}")

print(f"\nBest threshold: {best_threshold:.4f} (F1={best_f1:.1%})")
```

---

## 7. Model Serialization: Lưu và Nạp Model

Sau khi train xong, lưu model để dùng trong production (FastAPI service):

```python
import joblib
import json
from datetime import datetime

# === Lưu model ===
MODEL_DIR = "models/isolation_forest/v1.0"

# Lưu pipeline (bao gồm cả scaler)
joblib.dump(pipeline, f"{MODEL_DIR}/model.pkl")

# Lưu metadata
metadata = {
    "model_type": "IsolationForest",
    "version": "1.0",
    "trained_at": datetime.now().isoformat(),
    "n_samples": len(X_train),
    "n_features": X_train.shape[1],
    "feature_names": ["duration", "orig_bytes", "resp_bytes", "dest_port", "unique_dests"],
    "contamination": 0.05,
    "threshold": float(best_threshold),
    "metrics": {
        "accuracy": 0.97,
        "recall": 0.80,
        "fpr": 0.021,
        "f1": 0.727
    }
}
with open(f"{MODEL_DIR}/metadata.json", "w") as f:
    json.dump(metadata, f, indent=2)

print(f"Model saved to {MODEL_DIR}/")

# === Nạp model (trong FastAPI service) ===
loaded_pipeline = joblib.load(f"{MODEL_DIR}/model.pkl")
with open(f"{MODEL_DIR}/metadata.json", "r") as f:
    loaded_metadata = json.load(f)

# Predict với model đã nạp
predictions = loaded_pipeline.predict(X_new)
print(f"Model v{loaded_metadata['version']}: {(predictions == -1).sum()} anomalies detected")
```

---

## 8. Ví dụ hoàn chỉnh: Network Anomaly Detection

Code end-to-end – từ dữ liệu thô đến prediction sẵn sàng cho production:

```python
"""
Network Anomaly Detection Pipeline
Mô phỏng pipeline ML cho PT186S
"""
import numpy as np
import pandas as pd
import joblib
import json
from datetime import datetime
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest
from sklearn.metrics import confusion_matrix, classification_report

# ============================================================
# BƯỚC 1: Chuẩn bị dữ liệu (giả lập Zeek conn.log)
# ============================================================
np.random.seed(42)

def generate_network_data(n_normal: int = 950, n_anomaly: int = 50) -> pd.DataFrame:
    """Tạo dữ liệu mạng giả lập."""
    normal = pd.DataFrame({
        "source_ip": np.random.choice([f"10.0.0.{i}" for i in range(1, 20)], n_normal),
        "dest_ip": np.random.choice(["8.8.8.8", "1.1.1.1", "172.16.0.1"], n_normal),
        "dest_port": np.random.choice([53, 80, 443, 8080], n_normal),
        "protocol": np.random.choice(["tcp", "udp"], n_normal, p=[0.7, 0.3]),
        "duration": np.random.exponential(2.0, n_normal),
        "orig_bytes": np.random.lognormal(6, 1.5, n_normal).astype(int),
        "resp_bytes": np.random.lognormal(7, 1.5, n_normal).astype(int),
        "label": "normal"
    })

    anomaly = pd.DataFrame({
        "source_ip": np.random.choice(["10.0.0.99", "10.0.0.100"], n_anomaly),
        "dest_ip": np.random.choice(["evil-c2.com", "malware.net"], n_anomaly),
        "dest_port": np.random.choice([4444, 5555, 31337], n_anomaly),
        "protocol": "tcp",
        "duration": np.random.exponential(0.05, n_anomaly),
        "orig_bytes": np.random.lognormal(10, 2, n_anomaly).astype(int),
        "resp_bytes": np.random.lognormal(3, 1, n_anomaly).astype(int),
        "label": "anomaly"
    })

    return pd.concat([normal, anomaly], ignore_index=True).sample(frac=1, random_state=42)

df = generate_network_data()
print(f"Dataset: {len(df)} records")
print(f"Labels: {df['label'].value_counts().to_dict()}")

# ============================================================
# BƯỚC 2: Feature Engineering
# ============================================================
FEATURE_COLUMNS = ["duration", "orig_bytes", "resp_bytes", "dest_port"]

X = df[FEATURE_COLUMNS].values.astype(float)
y_true = (df["label"] == "anomaly").astype(int).values

print(f"\nFeature matrix shape: {X.shape}")  # (1000, 4)

# ============================================================
# BƯỚC 3: Tạo Pipeline và Train
# ============================================================
pipeline = Pipeline([
    ("scaler", StandardScaler()),
    ("detector", IsolationForest(
        n_estimators=100,
        contamination=0.05,
        random_state=42
    ))
])

pipeline.fit(X)
print("Model trained successfully!")

# ============================================================
# BƯỚC 4: Predict và Đánh giá
# ============================================================
raw_predictions = pipeline.predict(X)
y_pred = np.where(raw_predictions == -1, 1, 0)

# Confusion Matrix
cm = confusion_matrix(y_true, y_pred)
tn, fp, fn, tp = cm.ravel()

print(f"\n{'='*50}")
print("KẾT QUẢ ĐÁNH GIÁ")
print(f"{'='*50}")
print(f"Confusion Matrix:")
print(f"  TN={tn:4d}  FP={fp:4d}")
print(f"  FN={fn:4d}  TP={tp:4d}")
print(f"\nMetrics:")
print(f"  Accuracy:  {(tn+tp)/(tn+fp+fn+tp):.1%}")
print(f"  Precision: {tp/(tp+fp):.1%}")
print(f"  Recall:    {tp/(tp+fn):.1%}")
print(f"  FPR:       {fp/(fp+tn):.1%}")

fpr = fp / (fp + tn)
recall = tp / (tp + fn)
print(f"\nSo sánh với yêu cầu phụ lục PT186S:")
print(f"  FPR ≤ 10%:    {fpr:.1%} {'✅' if fpr <= 0.10 else '❌'}")
print(f"  Recall ≥ 80%: {recall:.1%} {'✅' if recall >= 0.80 else '❌'}")

# ============================================================
# BƯỚC 5: Lưu Model cho Production
# ============================================================
import os
MODEL_DIR = "models/isolation_forest/v1.0"
os.makedirs(MODEL_DIR, exist_ok=True)

joblib.dump(pipeline, f"{MODEL_DIR}/pipeline.pkl")

metadata = {
    "model_type": "IsolationForest",
    "version": "1.0",
    "trained_at": datetime.now().isoformat(),
    "feature_columns": FEATURE_COLUMNS,
    "n_training_samples": len(X),
    "contamination": 0.05,
    "metrics": {
        "accuracy": float((tn+tp)/(tn+fp+fn+tp)),
        "precision": float(tp/(tp+fp)),
        "recall": float(tp/(tp+fn)),
        "fpr": float(fpr)
    }
}
with open(f"{MODEL_DIR}/metadata.json", "w") as f:
    json.dump(metadata, f, indent=2)

print(f"\nModel saved to {MODEL_DIR}/")
```

---

## 9. Bài tập thực hành

### Bài 1: Thay đổi contamination

Chạy lại code ở mục 8 với `contamination` = `0.01`, `0.03`, `0.05`, `0.08`, `0.10`. Ghi lại FPR và Recall cho mỗi giá trị. Vẽ bảng so sánh, chọn giá trị tốt nhất.

### Bài 2: Thêm features

Thêm 2 features mới vào FEATURE_COLUMNS:
- `bytes_ratio = orig_bytes / (resp_bytes + 1)`
- `is_high_port = 1 if dest_port > 1024 else 0`

So sánh kết quả có cải thiện không?

### Bài 3: Simulate production predict

Viết hàm `detect_anomalies(new_data: list[dict]) -> list[dict]` mà:
1. Load model từ file `.pkl`
2. Nhận list kết nối mới (dạng dict)
3. Trả về list kết quả: `{"source_ip": ..., "is_anomaly": True/False, "score": ...}`

---

> **Tài liệu tiếp theo:** [06 – Feature Engineering cho dữ liệu mạng](./06-network-feature-engineering.md)
