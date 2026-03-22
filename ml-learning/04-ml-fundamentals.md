# Tài liệu 04: Kiến thức Machine Learning Cơ bản

> **Mục tiêu:** Hiểu bức tranh toàn cảnh ML – đủ để sử dụng Scikit-learn cho anomaly detection mà không cần nền tảng toán nặng.
> **Thời gian học:** 3-4 ngày | **Yêu cầu:** Đã hoàn thành Tài liệu 01-03

---

## Mục lục

1. [ML là gì? Rule-based vs ML-based](#1-ml-là-gì-rule-based-vs-ml-based)
2. [Ba loại Machine Learning](#2-ba-loại-machine-learning)
3. [Quy trình ML từ A đến Z](#3-quy-trình-ml-từ-a-đến-z)
4. [Train/Test Split – Tại sao phải tách dữ liệu](#4-traintest-split)
5. [Overfitting và Underfitting](#5-overfitting-và-underfitting)
6. [Metrics đánh giá – Accuracy, Precision, Recall, F1](#6-metrics-đánh-giá)
7. [Confusion Matrix](#7-confusion-matrix)
8. [Cross-Validation](#8-cross-validation)
9. [Ví dụ tổng hợp: Đánh giá 1000 kết nối mạng](#9-ví-dụ-tổng-hợp)
10. [Bài tập thực hành](#10-bài-tập-thực-hành)

---

## 1. ML là gì? Rule-based vs ML-based

### Rule-based detection (cách hiện tại – Suricata)

Bạn đã quen với cách này trong PT186S: viết rule cụ thể và Suricata kiểm tra từng gói tin.

```
# Suricata rule: phát hiện kết nối đến port 4444 (Metasploit default)
alert tcp any any -> any 4444 (msg:"Possible Metasploit reverse shell"; sid:1000001;)
```

**Hạn chế:**
- Chỉ phát hiện những gì đã biết trước (known attacks)
- Attacker thay đổi port → rule vô dụng
- Cần cập nhật rule liên tục

### ML-based detection (cách mới)

ML **học từ dữ liệu** thay vì dựa vào rule viết sẵn:

```
Dữ liệu mạng bình thường × 10.000 bản ghi
         ↓ ML học pattern
"Pattern bình thường: duration 1-5s, bytes 100-10000, port 53/80/443"
         ↓ Khi có dữ liệu mới
"Connection: duration 0.01s, bytes 500000, port 31337"
         ↓ So sánh với pattern đã học
"→ ANOMALY! Không giống pattern bình thường"
```

**Ưu điểm:**
- Phát hiện tấn công chưa biết trước (zero-day)
- Tự thích ứng với đặc thù mạng của từng đơn vị
- Phát hiện anomaly dựa trên hành vi, không dựa trên signature

**Nhược điểm:**
- Cần dữ liệu huấn luyện (baseline)
- Có false positive (cảnh báo sai)
- "Black box" – khó giải thích tại sao

### Kết hợp cả hai (chiến lược PT186S)

```
Suricata Rules → Phát hiện tấn công đã biết (nhanh, chính xác)
      +
ML Model → Phát hiện hành vi bất thường (unknown threats)
      =
Bảo vệ toàn diện
```

---

## 2. Ba loại Machine Learning

### Supervised Learning (học có giám sát)

**Ý tưởng:** Dạy model bằng dữ liệu đã có đáp án (labeled data).

Giống việc dạy nhân viên mới: "Đây là tấn công DDoS, đây là port scan, đây là bình thường" → sau đó nhân viên tự đánh giá kết nối mới.

```
Input (features)              → Output (label)
[duration=0.01, bytes=50, ports=100]  → "port_scan"
[duration=60, bytes=500000, ports=1]  → "c2_beacon"
[duration=2, bytes=1024, ports=1]     → "normal"
```

**Khi nào dùng:** Khi CÓ dữ liệu đã gán nhãn (ví dụ: dataset công khai CICIDS2017, hoặc từ vận hành thực tế).

**Thuật toán phổ biến:** Random Forest, Gradient Boosting, SVM.

### Unsupervised Learning (học không giám sát) ⭐

**Ý tưởng:** Model tự tìm pattern từ dữ liệu KHÔNG có đáp án.

Giống việc thả nhân viên mới vào phòng server 2 tuần: tự quan sát traffic "bình thường" là gì → khi thấy cái gì khác biệt → cảnh báo.

```
Input (features)                       → Output
[duration=2, bytes=1024, ports=1]      → Normal (giống đa số)
[duration=2.5, bytes=800, ports=1]     → Normal
[duration=0.01, bytes=50, ports=500]   → ANOMALY (khác biệt!)
```

**Khi nào dùng:** Khi KHÔNG CÓ dữ liệu gán nhãn – đây là tình huống thực tế khi triển khai PT186S tại đơn vị mới. Model chỉ cần dữ liệu mạng bình thường, không cần biết trước "tấn công trông như thế nào".

**Thuật toán phổ biến:** Isolation Forest ⭐ (chính của PT186S), DBSCAN, Autoencoder.

### Reinforcement Learning (học tăng cường)

Agent thử-sai trong môi trường, nhận thưởng/phạt. Dùng cho game, robotics – **không liên quan đến PT186S**.

### Chiến lược PT186S (theo phụ lục)

```
Giai đoạn 1: Unsupervised (Isolation Forest)
  → Không cần labeled data
  → Triển khai được ngay
  → Đủ để phát hiện anomaly cơ bản

Giai đoạn 2: Supervised (Random Forest, GBM)
  → Khi đã có labeled data từ vận hành
  → Phân loại chính xác LOẠI tấn công
  → Giảm false positive
```

---

## 3. Quy trình ML từ A đến Z

```
┌─────────────────────────────────────────────────────────┐
│  1. Thu thập dữ liệu                                    │
│     Zeek conn.log, Suricata alerts → Elasticsearch      │
├─────────────────────────────────────────────────────────┤
│  2. Tiền xử lý (Preprocessing)                          │
│     Xử lý NaN, chuẩn hóa, loại bỏ cột không cần       │
├─────────────────────────────────────────────────────────┤
│  3. Feature Engineering                                  │
│     Raw logs → Feature vectors (conn_count, bytes_ratio) │
├─────────────────────────────────────────────────────────┤
│  4. Chia dữ liệu (Train/Test Split)                     │
│     80% train, 20% test                                  │
├─────────────────────────────────────────────────────────┤
│  5. Huấn luyện model (Training)                          │
│     model.fit(X_train)                                   │
├─────────────────────────────────────────────────────────┤
│  6. Đánh giá (Evaluation)                                │
│     Accuracy, Recall, FPR trên test set                  │
├─────────────────────────────────────────────────────────┤
│  7. Triển khai (Deployment)                              │
│     Save model → Load trong FastAPI → NestJS gọi API     │
├─────────────────────────────────────────────────────────┤
│  8. Giám sát & Huấn luyện lại                            │
│     Model drift detection, scheduled retraining          │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Train/Test Split

### Tại sao phải tách dữ liệu?

Hãy tưởng tượng: bạn cho học sinh làm bài kiểm tra bằng **chính đề cương** → ai cũng 10 điểm, nhưng **không chứng minh được hiểu bài**. ML cũng vậy – phải test trên dữ liệu model **chưa từng thấy**.

```python
from sklearn.model_selection import train_test_split
import numpy as np

# 1000 kết nối mạng, mỗi kết nối có 5 features
X = np.random.rand(1000, 5)       # features
y = np.random.choice([0, 1], 1000, p=[0.95, 0.05])  # labels (0=normal, 1=anomaly)

# Chia 80% train, 20% test
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,        # 20% cho test
    random_state=42,      # seed cho reproducibility
    stratify=y            # giữ tỷ lệ normal/anomaly như ban đầu
)

print(f"Train: {X_train.shape[0]} samples")  # 800
print(f"Test:  {X_test.shape[0]} samples")   # 200
```

**Lưu ý quan trọng:**
- `random_state=42`: giống `seed` – cho kết quả giống nhau mỗi lần chạy
- `stratify=y`: đảm bảo tỷ lệ anomaly trong train và test giống nhau

---

## 5. Overfitting và Underfitting

### Overfitting – "Học vẹt"

Model **ghi nhớ** dữ liệu train thay vì **học pattern**. Kết quả: train accuracy 99%, test accuracy 60%.

```
Ví dụ: Model nhớ rằng "IP 10.0.0.55 + port 443 + 15:30" là anomaly
  → Trên dữ liệu mới, IP khác + port khác → bỏ sót
  → Model không "tổng quát hóa" được
```

**Dấu hiệu:** Train score rất cao, Test score thấp hơn nhiều.

**Cách khắc phục:**
- Tăng dữ liệu train
- Giảm độ phức tạp model
- Dùng Cross-Validation

### Underfitting – "Học chưa đủ"

Model quá đơn giản, không nắm được pattern. Kết quả: cả train và test đều thấp.

```
Ví dụ: Model chỉ dựa vào 1 feature (bytes) để đánh giá
  → Port scan có bytes thấp nhưng NHIỀU connections → bỏ sót
  → Cần thêm features: unique_ports, connection_count
```

**Dấu hiệu:** Cả Train và Test score đều thấp.

**Cách khắc phục:**
- Thêm features
- Dùng model phức tạp hơn
- Huấn luyện lâu hơn

```
Underfitting ←──── Sweet Spot ────→ Overfitting
Quá đơn giản       Vừa đủ          Quá phức tạp
  ↓                  ↓                 ↓
Train: 60%        Train: 90%       Train: 99%
Test:  55%        Test:  87%       Test:  60%
```

---

## 6. Metrics đánh giá

### Accuracy – Độ chính xác tổng thể

```
Accuracy = Số dự đoán đúng / Tổng số dự đoán

Ví dụ: 1000 kết nối, model đoán đúng 900 → Accuracy = 90%
```

**⚠️ Bẫy Accuracy:** Nếu 950/1000 connections là normal, model đoán **tất cả** là normal cũng đạt 95% accuracy – nhưng **bỏ sót mọi tấn công!**

→ Accuracy KHÔNG ĐỦ cho bài toán anomaly detection. Cần Precision và Recall.

### Precision – "Khi model nói anomaly, đúng bao nhiêu?"

```
                 Model nói Anomaly
                 ┌──────────────────┐
Thực tế Anomaly  │  ✅ Đúng (TP)    │  → Precision = TP / (TP + FP)
Thực tế Normal   │  ❌ Sai (FP)     │
                 └──────────────────┘

Ví dụ: Model cảnh báo 100 kết nối là anomaly
  - 80 thực sự là anomaly (True Positive = 80)
  - 20 thực ra là normal (False Positive = 20)
  → Precision = 80 / 100 = 80%
  → "80% cảnh báo của model là chính xác"
```

**Precision cao = ít cảnh báo sai → SOC analyst không bị alert fatigue.**

### Recall (True Positive Rate) – "Bỏ sót bao nhiêu tấn công?"

```
                 Tất cả Anomaly thực tế
                 ┌──────────────────────┐
Model phát hiện  │  ✅ Phát hiện (TP)   │  → Recall = TP / (TP + FN)
Model bỏ sót    │  ❌ Bỏ sót (FN)     │
                 └──────────────────────┘

Ví dụ: Có 100 tấn công thực tế
  - Model phát hiện 80 (True Positive = 80)
  - Model bỏ sót 20 (False Negative = 20)
  → Recall = 80 / 100 = 80%
  → "Model phát hiện được 80% tấn công"
```

**Recall cao = ít bỏ sót tấn công → an toàn hơn.**

### False Positive Rate (FPR) – Tỷ lệ cảnh báo sai

```
FPR = Số cảnh báo sai / Tổng số kết nối bình thường

Ví dụ: 950 kết nối normal, model cảnh báo sai 20 cái
  → FPR = 20 / 950 ≈ 2.1%
```

**Phụ lục PT186S yêu cầu: FPR ≤ 10% ban đầu, giảm ≤ 5% sau tuning.**

### F1-Score – Cân bằng Precision và Recall

```
F1 = 2 × (Precision × Recall) / (Precision + Recall)

Precision = 80%, Recall = 80%
F1 = 2 × (0.8 × 0.8) / (0.8 + 0.8) = 0.8 = 80%
```

### Trade-off: Precision vs Recall

```
Ngưỡng phát hiện THẤP (nhạy hơn):
  → Recall CAO (ít bỏ sót)
  → Precision THẤP (nhiều false alarm)
  → Phù hợp: hệ thống cCritical, chấp nhận nhiều alarm

Ngưỡng phát hiện CAO (chặt hơn):
  → Precision CAO (ít false alarm)
  → Recall THẤP (bỏ sót nhiều hơn)
  → Phù hợp: SOC đã quá tải, cần giảm noise
```

---

## 7. Confusion Matrix

Confusion Matrix là bảng 2×2 tổng hợp **tất cả** metrics ở trên:

```
                    Model dự đoán
                  Normal    Anomaly
Thực tế  Normal │  TN=930  │  FP=20  │  → 950 Normal thực tế
         Anomaly│  FN=10   │  TP=40  │  → 50 Anomaly thực tế
                └──────────┴─────────┘
                   940        60        → 1000 tổng

TN (True Negative)  = 930: Normal, model đoán Normal ✅
FP (False Positive) = 20:  Normal, model đoán Anomaly ❌ (cảnh báo sai)
FN (False Negative) = 10:  Anomaly, model đoán Normal ❌ (BỎ SÓT!)
TP (True Positive)  = 40:  Anomaly, model đoán Anomaly ✅

Tính metrics:
  Accuracy  = (930 + 40) / 1000 = 97.0%
  Precision = 40 / (40 + 20) = 66.7%
  Recall    = 40 / (40 + 10) = 80.0%
  FPR       = 20 / (20 + 930) = 2.1%
  F1        = 2 × (0.667 × 0.8) / (0.667 + 0.8) = 72.7%
```

### Code Python tính Confusion Matrix

```python
from sklearn.metrics import confusion_matrix, classification_report
import numpy as np

# y_true: nhãn thật, y_pred: dự đoán của model
y_true = np.array([0]*950 + [1]*50)   # 950 normal, 50 anomaly
y_pred = np.array([0]*930 + [1]*20 + [0]*10 + [1]*40)  # dự đoán

# Confusion Matrix
cm = confusion_matrix(y_true, y_pred)
print("Confusion Matrix:")
print(cm)
# [[930  20]
#  [ 10  40]]

# Báo cáo chi tiết
print(classification_report(y_true, y_pred, target_names=["normal", "anomaly"]))
#               precision    recall  f1-score   support
#       normal       0.99      0.98      0.98       950
#      anomaly       0.67      0.80      0.73        50
#     accuracy                           0.97      1000
```

---

## 8. Cross-Validation

### Vấn đề với 1 lần Train/Test Split

Nếu chỉ chia 1 lần, kết quả phụ thuộc vào "may mắn" – dữ liệu test có thể dễ hoặc khó.

### K-Fold Cross-Validation

Chia dữ liệu thành K phần, lần lượt dùng mỗi phần làm test:

```
K=5:
Fold 1: [Test] [Train] [Train] [Train] [Train] → Score: 85%
Fold 2: [Train] [Test] [Train] [Train] [Train] → Score: 88%
Fold 3: [Train] [Train] [Test] [Train] [Train] → Score: 82%
Fold 4: [Train] [Train] [Train] [Test] [Train] → Score: 86%
Fold 5: [Train] [Train] [Train] [Train] [Test] → Score: 84%

Kết quả: 85% ± 2.1% → đáng tin cậy hơn 1 con số duy nhất
```

```python
from sklearn.model_selection import cross_val_score
from sklearn.ensemble import IsolationForest

# Với Isolation Forest (unsupervised), dùng scoring khác
# Ở đây minh hoạ concept với Random Forest (supervised)
from sklearn.ensemble import RandomForestClassifier

model = RandomForestClassifier(n_estimators=100, random_state=42)
scores = cross_val_score(model, X, y, cv=5, scoring="accuracy")

print(f"Scores per fold: {scores}")
print(f"Mean: {scores.mean():.2f} ± {scores.std():.2f}")
```

---

## 9. Ví dụ tổng hợp: Đánh giá 1000 kết nối mạng

Ví dụ end-to-end kết hợp tất cả khái niệm:

```python
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest
from sklearn.metrics import confusion_matrix, classification_report

# === 1. Tạo dữ liệu giả lập ===
np.random.seed(42)

# 950 connections bình thường
normal = np.column_stack([
    np.random.exponential(2.0, 950),               # duration
    np.random.lognormal(6, 1.5, 950),              # orig_bytes
    np.random.lognormal(7, 1.5, 950),              # resp_bytes
    np.random.choice([53, 80, 443], 950),           # dest_port
    np.random.randint(1, 5, 950),                   # unique_dests
])

# 50 connections bất thường
anomaly = np.column_stack([
    np.random.exponential(0.05, 50),                # duration rất ngắn (scan)
    np.random.lognormal(10, 2, 50),                 # bytes rất cao
    np.random.lognormal(3, 1, 50),                  # response ít
    np.random.choice([4444, 5555, 31337], 50),      # port bất thường
    np.random.randint(50, 200, 50),                 # nhiều dest (scan)
])

X = np.vstack([normal, anomaly])
y_true = np.array([0]*950 + [1]*50)   # 0=normal, 1=anomaly

# === 2. Chuẩn hóa ===
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# === 3. Train Isolation Forest ===
model = IsolationForest(
    n_estimators=100,
    contamination=0.05,    # ước lượng 5% dữ liệu là anomaly
    random_state=42
)
model.fit(X_scaled)

# === 4. Predict ===
# Isolation Forest trả: 1 = normal, -1 = anomaly
predictions = model.predict(X_scaled)
y_pred = np.where(predictions == -1, 1, 0)  # chuyển về 0/1

# === 5. Đánh giá ===
cm = confusion_matrix(y_true, y_pred)
print("=== Confusion Matrix ===")
print(f"  TN={cm[0,0]}  FP={cm[0,1]}")
print(f"  FN={cm[1,0]}  TP={cm[1,1]}")

print("\n=== Classification Report ===")
print(classification_report(y_true, y_pred, target_names=["normal", "anomaly"]))

# Tính FPR riêng (quan trọng cho phụ lục PT186S)
tn, fp, fn, tp = cm.ravel()
fpr = fp / (fp + tn)
recall = tp / (tp + fn)
print(f"\nFalse Positive Rate: {fpr:.1%}")
print(f"Recall (Detection Rate): {recall:.1%}")
print(f"Yêu cầu phụ lục: FPR ≤ 10%, Recall ≥ 80%")
print(f"Kết quả: {'✅ ĐẠT' if fpr <= 0.1 and recall >= 0.8 else '❌ CHƯA ĐẠT'}")
```

---

## 10. Bài tập thực hành

### Bài 1: Tính metrics bằng tay

Cho Confusion Matrix:
```
  TN=880  FP=70
  FN=5    TP=45
```
Tính: Accuracy, Precision, Recall, FPR, F1-Score. Model này tốt hay không? Tại sao?

### Bài 2: Trade-off Precision vs Recall

Hai model A và B:
- Model A: Precision=95%, Recall=60%
- Model B: Precision=70%, Recall=95%

Trong bối cảnh SOC (Security Operations Center), bạn chọn model nào? Giải thích lý do.

### Bài 3: Chạy Isolation Forest

Copy code ở mục 9, thay đổi `contamination` thành `0.01`, `0.05`, `0.10`. So sánh kết quả (FPR, Recall). Rút ra kết luận: contamination ảnh hưởng thế nào đến model?

---

> **Tài liệu tiếp theo:** [05 – Scikit-learn: Thực hành Anomaly Detection](./05-sklearn-anomaly-detection.md)
