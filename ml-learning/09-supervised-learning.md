# Tài liệu 09: Supervised Learning – Random Forest cho Network Security

> **Mục tiêu:** Nâng cấp từ unsupervised (Isolation Forest) lên supervised learning khi đã có labeled data.
> **Thời gian học:** 3-4 ngày | **Yêu cầu:** Đã hoàn thành Tài liệu 01-08

---

## Mục lục

1. [Khi nào chuyển sang Supervised?](#1-khi-nào-chuyển-sang-supervised)
2. [Random Forest – Ý tưởng và Ưu điểm](#2-random-forest--ý-tưởng-và-ưu-điểm)
3. [Chuẩn bị Labeled Data](#3-chuẩn-bị-labeled-data)
4. [Train/Test Split](#4-traintest-split)
5. [Training và Đánh giá](#5-training-và-đánh-giá)
6. [Feature Importance](#6-feature-importance)
7. [Cross-Validation](#7-cross-validation)
8. [Hyperparameter Tuning](#8-hyperparameter-tuning)
9. [So sánh Isolation Forest vs Random Forest](#9-so-sánh-isolation-forest-vs-random-forest)
10. [Bài tập thực hành](#10-bài-tập-thực-hành)

---

## 1. Khi nào chuyển sang Supervised?

Phụ lục kỹ-chiến thuật PT186S xác định lộ trình 2 giai đoạn:

```
Giai đoạn 1 (MVP): Isolation Forest (Unsupervised)
  → Không cần labeled data → triển khai ngay
  → Phát hiện dựa trên "khác biệt so với đám đông"

Giai đoạn 2: Random Forest (Supervised)
  → CẦN labeled data từ analyst feedback
  → Phân loại chính xác: "normal" vs "port_scan" vs "c2" vs ...
  → Đạt Recall ≥ 90% (cao hơn ~80% của IF)
```

**Điều kiện chuyển sang Supervised:**
- Có ≥ 500 records đã labeled (analyst xác nhận qua dashboard)
- Có ít nhất 50 records cho mỗi loại anomaly
- Isolation Forest đã chạy ổn định ≥ 3 tháng

---

## 2. Random Forest – Ý tưởng và Ưu điểm

### Trực giác

Tưởng tượng bạn hỏi ý kiến 100 analyst khác nhau, mỗi người chỉ nhìn một phần dữ liệu:

```
Analyst 1 (nhìn duration, bytes):  "Trông giống port scan"
Analyst 2 (nhìn port, conn_state): "Trông giống port scan"
Analyst 3 (nhìn bytes_ratio, IPs): "Trông bình thường"
...
Analyst 100 (nhìn duration, port): "Trông giống port scan"

→ Bỏ phiếu: 72/100 nói "port scan" → Kết luận: PORT SCAN
```

Random Forest = tập hợp nhiều Decision Trees → **bỏ phiếu** → quyết định cuối cùng.

### Tại sao Random Forest cho Network Security?

| Ưu điểm | Giải thích |
|---|---|
| Interpretable | Feature importance cho biết TẠI SAO alert |
| Robust | Không bị ảnh hưởng bởi outliers |
| Ít overfitting | Do bagging (random sampling) |
| Multi-class | Phân loại nhiều loại tấn công |
| Nhanh training | Nhanh hơn deep learning |

---

## 3. Chuẩn bị Labeled Data

### Nguồn labeled data trong PT186S

```python
# Cách 1: Từ analyst feedback (PT186S Alert system)
# Khi analyst xác nhận/bác bỏ alert → tạo labeled record

# Cách 2: Từ Suricata rules (có label sẵn)
# Suricata alert.signature = label

# Cách 3: Semi-supervised
# Isolation Forest detect → Analyst review → Label
```

### Tạo labeled dataset

```python
import pandas as pd
import numpy as np

np.random.seed(42)

def create_labeled_dataset(n_samples: int = 2000) -> pd.DataFrame:
    """Tạo dataset giả lập với labels."""
    data_parts = []

    # Normal traffic (60%)
    n_normal = int(n_samples * 0.60)
    data_parts.append(pd.DataFrame({
        "connection_count": np.random.randint(1, 30, n_normal),
        "unique_dest_ips": np.random.randint(1, 5, n_normal),
        "unique_dest_ports": np.random.randint(1, 4, n_normal),
        "avg_duration": np.random.exponential(2.0, n_normal),
        "total_orig_bytes": np.random.lognormal(7, 1, n_normal),
        "total_resp_bytes": np.random.lognormal(8, 1, n_normal),
        "bytes_ratio": np.random.uniform(0.1, 2.0, n_normal),
        "port_diversity": np.random.uniform(0.05, 0.3, n_normal),
        "s0_ratio": np.random.uniform(0, 0.05, n_normal),
        "label": "normal",
    }))

    # Port Scan (15%)
    n_scan = int(n_samples * 0.15)
    data_parts.append(pd.DataFrame({
        "connection_count": np.random.randint(100, 500, n_scan),
        "unique_dest_ips": np.random.randint(1, 3, n_scan),
        "unique_dest_ports": np.random.randint(50, 200, n_scan),
        "avg_duration": np.random.exponential(0.01, n_scan),
        "total_orig_bytes": np.random.lognormal(5, 0.5, n_scan),
        "total_resp_bytes": np.random.lognormal(4, 0.5, n_scan),
        "bytes_ratio": np.random.uniform(0.5, 5.0, n_scan),
        "port_diversity": np.random.uniform(0.7, 1.0, n_scan),
        "s0_ratio": np.random.uniform(0.6, 0.95, n_scan),
        "label": "port_scan",
    }))

    # C2 Beacon (10%)
    n_c2 = int(n_samples * 0.10)
    data_parts.append(pd.DataFrame({
        "connection_count": np.random.randint(10, 50, n_c2),
        "unique_dest_ips": np.random.randint(1, 2, n_c2),
        "unique_dest_ports": np.random.randint(1, 3, n_c2),
        "avg_duration": np.random.uniform(60, 300, n_c2),
        "total_orig_bytes": np.random.lognormal(6, 1, n_c2),
        "total_resp_bytes": np.random.lognormal(5, 1, n_c2),
        "bytes_ratio": np.random.uniform(1.0, 10.0, n_c2),
        "port_diversity": np.random.uniform(0.01, 0.1, n_c2),
        "s0_ratio": np.random.uniform(0, 0.1, n_c2),
        "label": "c2_beacon",
    }))

    # DDoS (10%)
    n_ddos = int(n_samples * 0.10)
    data_parts.append(pd.DataFrame({
        "connection_count": np.random.randint(500, 2000, n_ddos),
        "unique_dest_ips": np.random.randint(1, 2, n_ddos),
        "unique_dest_ports": np.random.randint(1, 3, n_ddos),
        "avg_duration": np.random.exponential(0.005, n_ddos),
        "total_orig_bytes": np.random.lognormal(10, 1, n_ddos),
        "total_resp_bytes": np.random.lognormal(4, 1, n_ddos),
        "bytes_ratio": np.random.uniform(5.0, 50.0, n_ddos),
        "port_diversity": np.random.uniform(0.001, 0.01, n_ddos),
        "s0_ratio": np.random.uniform(0.8, 1.0, n_ddos),
        "label": "ddos",
    }))

    # Data Exfiltration (5%)
    n_exfil = n_samples - n_normal - n_scan - n_c2 - n_ddos
    data_parts.append(pd.DataFrame({
        "connection_count": np.random.randint(5, 20, n_exfil),
        "unique_dest_ips": np.random.randint(1, 3, n_exfil),
        "unique_dest_ports": np.random.randint(1, 3, n_exfil),
        "avg_duration": np.random.uniform(10, 60, n_exfil),
        "total_orig_bytes": np.random.lognormal(12, 1, n_exfil),
        "total_resp_bytes": np.random.lognormal(5, 1, n_exfil),
        "bytes_ratio": np.random.uniform(10.0, 100.0, n_exfil),
        "port_diversity": np.random.uniform(0.05, 0.3, n_exfil),
        "s0_ratio": np.random.uniform(0, 0.1, n_exfil),
        "label": "data_exfiltration",
    }))

    df = pd.concat(data_parts, ignore_index=True).sample(frac=1, random_state=42)
    return df

df = create_labeled_dataset()
print(f"Dataset: {len(df)} samples")
print(df["label"].value_counts())
```

---

## 4. Train/Test Split

```python
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

FEATURE_COLUMNS = [
    "connection_count", "unique_dest_ips", "unique_dest_ports",
    "avg_duration", "total_orig_bytes", "total_resp_bytes",
    "bytes_ratio", "port_diversity", "s0_ratio",
]

X = df[FEATURE_COLUMNS].values
le = LabelEncoder()
y = le.fit_transform(df["label"])

# Stratified split: giữ tỉ lệ labels trong train/test
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"Train: {len(X_train)} | Test: {len(X_test)}")
print(f"Labels: {le.classes_}")
```

---

## 5. Training và Đánh giá

```python
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

# Pipeline: Scaler + Random Forest
pipeline = Pipeline([
    ("scaler", StandardScaler()),
    ("classifier", RandomForestClassifier(
        n_estimators=100,
        max_depth=15,
        min_samples_split=5,
        random_state=42,
        class_weight="balanced",  # Tự cân bằng classes
    ))
])

pipeline.fit(X_train, y_train)

# Predict
y_pred = pipeline.predict(X_test)

# Đánh giá
print("Classification Report:")
print(classification_report(y_test, y_pred, target_names=le.classes_))

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))
```

---

## 6. Feature Importance

Random Forest cho biết **feature nào quan trọng nhất** – rất hữu ích để giải thích alert cho analyst:

```python
# Feature importance
rf_model = pipeline.named_steps["classifier"]
importances = rf_model.feature_importances_

# Sắp xếp theo mức độ quan trọng
feature_importance = sorted(
    zip(FEATURE_COLUMNS, importances),
    key=lambda x: x[1],
    reverse=True,
)

print("\nFeature Importance:")
for name, importance in feature_importance:
    bar = "█" * int(importance * 50)
    print(f"  {name:25s} {importance:.3f} {bar}")
```

### Dùng Feature Importance trong Alert

```python
def explain_prediction(pipeline, feature_values: dict) -> str:
    """Tạo giải thích cho prediction (hiển thị trên dashboard)."""
    rf_model = pipeline.named_steps["classifier"]
    importances = rf_model.feature_importances_

    top_features = sorted(
        zip(FEATURE_COLUMNS, importances, [feature_values[c] for c in FEATURE_COLUMNS]),
        key=lambda x: x[1],
        reverse=True,
    )[:3]

    reasons = []
    for name, imp, value in top_features:
        reasons.append(f"{name}={value:.1f} (importance={imp:.2f})")

    return "Top contributors: " + "; ".join(reasons)
```

---

## 7. Cross-Validation

Đánh giá model ổn định hơn bằng K-Fold Cross-Validation:

```python
from sklearn.model_selection import cross_val_score

scores = cross_val_score(
    pipeline, X, y,
    cv=5,                    # 5-fold
    scoring="f1_weighted",   # F1 score (weighted cho imbalanced classes)
)

print(f"Cross-Validation F1 Scores: {scores}")
print(f"Mean: {scores.mean():.3f} ± {scores.std():.3f}")
```

---

## 8. Hyperparameter Tuning

```python
from sklearn.model_selection import GridSearchCV

param_grid = {
    "classifier__n_estimators": [50, 100, 200],
    "classifier__max_depth": [10, 15, 20, None],
    "classifier__min_samples_split": [2, 5, 10],
}

grid_search = GridSearchCV(
    pipeline,
    param_grid,
    cv=3,
    scoring="f1_weighted",
    n_jobs=-1,       # Dùng tất cả CPU cores
    verbose=1,
)

grid_search.fit(X_train, y_train)

print(f"Best params: {grid_search.best_params_}")
print(f"Best F1: {grid_search.best_score_:.3f}")

# Dùng best model
best_pipeline = grid_search.best_estimator_
y_pred_best = best_pipeline.predict(X_test)
print("\nBest Model Report:")
print(classification_report(y_test, y_pred_best, target_names=le.classes_))
```

---

## 9. So sánh Isolation Forest vs Random Forest

| Tiêu chí | Isolation Forest | Random Forest |
|---|---|---|
| Loại | Unsupervised | Supervised |
| Cần labeled data? | **Không** | Có (≥500 records) |
| Output | Binary: normal/anomaly | Multi-class: loại tấn công |
| Giải thích được? | Hạn chế (chỉ có score) | **Feature importance** |
| Recall kỳ vọng | ~80% | **≥90%** |
| Khi nào dùng? | Triển khai ban đầu | Đã có labeled data |
| Giai đoạn PT186S | Giai đoạn 1 | Giai đoạn 2 |

---

## 10. Bài tập thực hành

### Bài 1: Binary Classification

Chuyển multi-class (normal, port_scan, c2, ...) thành binary (normal vs anomaly). So sánh Recall và FPR với Isolation Forest.

### Bài 2: Label từ Suricata alerts

Viết hàm nhận Suricata alerts, tạo label dựa trên `alert.category`:
- `"Attempted Information Leak"` → `data_exfiltration`
- `"A Network Trojan was Detected"` → `c2_beacon`
- `"Potential Corporate Privacy Violation"` → `normal`

### Bài 3: Model Serving

Cập nhật FastAPI `/api/v1/detection/analyze` endpoint để:
- Nếu có labeled model → dùng Random Forest (trả loại tấn công)
- Nếu chưa có → fallback về Isolation Forest (trả binary)

---

> **Tài liệu tiếp theo:** [10 – PyTorch Autoencoder cho Anomaly Detection nâng cao](./10-autoencoder-anomaly-detection.md)
