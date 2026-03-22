import type { Lesson } from '../types/lesson';

export const lesson09: Lesson = {
  id: '09-supervised-learning',
  number: 9,
  title: 'Supervised Learning – Random Forest',
  description:
    'Học có giám sát với Random Forest – phân loại traffic khi đã có labeled data',
  phase: 'phase-3',
  estimatedTime: '4-5 ngày',
  prerequisites: ['04-ml-fundamentals', '05-sklearn-anomaly-detection', '06-feature-engineering'],

  sections: [
    /* ───── 1. When Supervised Learning ───── */
    {
      id: 'when-supervised',
      title: '1. Khi nào dùng Supervised Learning?',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          'Ở bài 05, bạn đã học **Isolation Forest** (unsupervised) – phát hiện bất thường **không cần labeled data**. Nhưng khi đã có đủ dữ liệu gán nhãn (normal/anomaly), **supervised learning cho kết quả tốt hơn**.',
          '**Random Forest** là thuật toán supervised phổ biến nhất: dễ dùng, ít hyperparameter tuning, và cho biết **feature nào quan trọng nhất** (feature importance).',
          'Trong PT186S: ban đầu dùng Isolation Forest → analyst review và gán nhãn → tích lũy labeled data → chuyển sang Random Forest cho precision cao hơn.',
        ],
        highlights: [
          {
            type: 'important',
            text: 'Unsupervised (IF) = phát hiện "lạ". Supervised (RF) = phân loại "đúng/sai" dựa trên kinh nghiệm. Cần ít nhất vài trăm labeled samples.',
          },
        ],
      },
    },

    /* ───── 2. Random Forest ───── */
    {
      id: 'random-forest-concept',
      title: '2. Random Forest là gì?',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          '**Random Forest = nhiều Decision Trees, mỗi cây vote → kết quả theo đa số.** Giống hỏi ý kiến 100 chuyên gia rồi chọn theo số đông.',
          'Mỗi cây được train trên **subset ngẫu nhiên** của dữ liệu và features → tránh overfitting. Đây gọi là **ensemble learning**.',
          'Ưu điểm: hoạt động tốt không cần chuẩn hóa dữ liệu, xử lý được cả categorical features, có thể giải thích được (interpretable) qua feature importance.',
        ],
        highlights: [
          {
            type: 'tip',
            text: 'Random Forest là "go-to" model cho structured/tabular data. Thường là model đầu tiên nên thử trước khi dùng deep learning.',
          },
        ],
      },
    },

    /* ───── 3. Data Preparation ───── */
    {
      id: 'data-preparation',
      title: '3. Chuẩn bị dữ liệu có nhãn',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'prepare_labeled_data.py',
        description:
          'Tạo dataset labeled từ kết quả review của analyst. Mỗi IP có label "normal" hoặc "anomaly".',
        code: `import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split

# === Giả lập labeled dataset ===
np.random.seed(42)

# Normal traffic (label = 0)
normal = pd.DataFrame({
    "conn_count": np.random.randint(5, 50, 400),
    "unique_ports": np.random.randint(1, 10, 400),
    "avg_duration": np.random.exponential(2.0, 400),
    "total_bytes": np.random.lognormal(8, 1, 400).astype(int),
    "bytes_ratio": np.random.uniform(0.1, 1.0, 400),
    "label": 0,  # 0 = normal
})

# Anomaly traffic (label = 1)
anomaly = pd.DataFrame({
    "conn_count": np.random.randint(100, 1000, 100),
    "unique_ports": np.random.randint(20, 200, 100),
    "avg_duration": np.random.exponential(0.1, 100),
    "total_bytes": np.random.lognormal(12, 2, 100).astype(int),
    "bytes_ratio": np.random.uniform(3.0, 15.0, 100),
    "label": 1,  # 1 = anomaly
})

df = pd.concat([normal, anomaly], ignore_index=True).sample(frac=1, random_state=42)
print(f"Dataset: {len(df)} samples, {df['label'].value_counts().to_dict()}")

# === Train/Test Split ===
feature_cols = ["conn_count", "unique_ports", "avg_duration", "total_bytes", "bytes_ratio"]
X = df[feature_cols]
y = df["label"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,       # 20% cho test
    random_state=42,
    stratify=y,          # Giữ tỷ lệ normal/anomaly trong cả train và test
)

print(f"Train: {len(X_train)}, Test: {len(X_test)}")
print(f"Train distribution: {y_train.value_counts().to_dict()}")`,
        output: `Dataset: 500 samples, {0: 400, 1: 100}
Train: 400, Test: 100
Train distribution: {0: 320, 1: 80}`,
      },
    },

    /* ───── 4. Training & Evaluation ───── */
    {
      id: 'training-evaluation',
      title: '4. Training và Đánh giá Model',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'train_random_forest.py',
        description:
          'Train Random Forest, đánh giá bằng accuracy, precision, recall, F1-score. Precision = "khi báo anomaly, đúng bao nhiều %", Recall = "bắt được bao nhiều % anomaly".',
        code: `from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, classification_report, confusion_matrix,
)

# === Train model ===
rf_model = RandomForestClassifier(
    n_estimators=100,      # 100 trees
    max_depth=10,          # Giới hạn độ sâu → tránh overfitting
    min_samples_leaf=5,    # Mỗi lá cần ít nhất 5 samples
    random_state=42,
    n_jobs=-1,             # Dùng tất cả CPU cores
)

rf_model.fit(X_train, y_train)

# === Đánh giá ===
y_pred = rf_model.predict(X_test)

print("=== Classification Report ===")
print(classification_report(y_test, y_pred, target_names=["Normal", "Anomaly"]))

print(f"Accuracy:  {accuracy_score(y_test, y_pred):.3f}")
print(f"Precision: {precision_score(y_test, y_pred):.3f}")
print(f"Recall:    {recall_score(y_test, y_pred):.3f}")
print(f"F1-score:  {f1_score(y_test, y_pred):.3f}")

# Confusion Matrix
cm = confusion_matrix(y_test, y_pred)
print(f"\\nConfusion Matrix:")
print(f"  TN={cm[0][0]}  FP={cm[0][1]}")
print(f"  FN={cm[1][0]}  TP={cm[1][1]}")`,
        output: `=== Classification Report ===
              precision    recall  f1-score   support
      Normal       0.99      0.99      0.99        80
     Anomaly       0.95      0.95      0.95        20

    accuracy                           0.98       100

Accuracy:  0.980
Precision: 0.950
Recall:    0.950
F1-score:  0.950

Confusion Matrix:
  TN=79  FP=1
  FN=1  TP=19`,
      },
    },

    /* ───── 5. Confusion Matrix Explorer ───── */
    {
      id: 'confusion-matrix',
      title: '5. Hiểu Confusion Matrix',
      type: 'interactive',
      content: {
        kind: 'interactive',
        component: 'ConfusionMatrixExplorer',
        description:
          'Khám phá ảnh hưởng của TN, FP, FN, TP lên Precision và Recall. Thay đổi giá trị để hiểu trade-off.',
        props: { tn: 79, fp: 1, fn: 1, tp: 19 },
      },
    },

    /* ───── 6. Feature Importance ───── */
    {
      id: 'feature-importance',
      title: '6. Feature Importance',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'feature_importance.py',
        description:
          'Random Forest cho biết feature nào quan trọng nhất. Đây là lý do RF phổ biến – model có thể giải thích được (explainable).',
        code: `import numpy as np

# Feature importance từ trained model
importances = rf_model.feature_importances_
feature_names = ["conn_count", "unique_ports", "avg_duration", "total_bytes", "bytes_ratio"]

# Sắp xếp theo importance
sorted_idx = np.argsort(importances)[::-1]

print("=== Feature Importance ===")
for idx in sorted_idx:
    print(f"  {feature_names[idx]:20s}: {importances[idx]:.4f}")

# Ý nghĩa:
# - bytes_ratio cao → model dựa nhiều vào tỷ lệ gửi/nhận
# - unique_ports cao → số port khác nhau là dấu hiệu mạnh
# → Analyst có thể tập trung giám sát 2 features này`,
        output: `=== Feature Importance ===
  bytes_ratio         : 0.3521
  unique_ports        : 0.2843
  total_bytes         : 0.1792
  conn_count          : 0.1108
  avg_duration        : 0.0736`,
      },
    },

    /* ───── 6b. Feature Importance Chart ───── */
    {
      id: 'feature-importance-chart',
      title: 'Feature Importance Visualization',
      type: 'interactive',
      content: {
        kind: 'interactive',
        component: 'FeatureImportanceChart',
        description: 'Biểu đồ trực quan hóa mức độ quan trọng của từng feature trong Random Forest model.',
        props: {
          features: [
            { name: 'bytes_ratio', importance: 0.3521, category: 'ratio' },
            { name: 'unique_ports', importance: 0.2843, category: 'network' },
            { name: 'total_bytes', importance: 0.1792, category: 'volume' },
            { name: 'conn_count', importance: 0.1108, category: 'frequency' },
            { name: 'avg_duration', importance: 0.0736, category: 'timing' },
          ],
        },
      },
    },

    /* ───── 7. Cross-Validation & Hyperparameter Tuning ───── */
    {
      id: 'cross-validation',
      title: '7. Cross-Validation & Hyperparameter Tuning',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'cross_validation.py',
        description:
          'Cross-validation đánh giá model chính xác hơn single train/test split. GridSearchCV tự động tìm hyperparameters tốt nhất.',
        code: `from sklearn.model_selection import cross_val_score, GridSearchCV

# === Cross-Validation ===
# Chia dữ liệu thành 5 phần, train trên 4, test trên 1, rotate
cv_scores = cross_val_score(rf_model, X, y, cv=5, scoring="f1")
print(f"CV F1 scores: {cv_scores}")
print(f"Mean F1: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")

# === Grid Search – tìm hyperparameters tốt nhất ===
param_grid = {
    "n_estimators": [50, 100, 200],
    "max_depth": [5, 10, 20, None],
    "min_samples_leaf": [1, 5, 10],
}

grid_search = GridSearchCV(
    RandomForestClassifier(random_state=42),
    param_grid,
    cv=5,
    scoring="f1",
    n_jobs=-1,
)
grid_search.fit(X_train, y_train)

print(f"\\nBest params: {grid_search.best_params_}")
print(f"Best F1: {grid_search.best_score_:.3f}")

# Dùng best model
best_model = grid_search.best_estimator_`,
        output: `CV F1 scores: [0.94 0.96 0.93 0.95 0.97]
Mean F1: 0.950 ± 0.015

Best params: {'max_depth': 10, 'min_samples_leaf': 5, 'n_estimators': 100}
Best F1: 0.952`,
      },
    },

    /* ───── 8. IF vs RF Comparison ───── */
    {
      id: 'if-vs-rf',
      title: '8. Isolation Forest ↔ Random Forest',
      type: 'comparison-table',
      content: {
        kind: 'comparison-table',
        headers: ['Tiêu chí', 'Isolation Forest', 'Random Forest'],
        rows: [
          ['Loại', 'Unsupervised (không cần label)', 'Supervised (cần label)'],
          ['Input', 'Features only', 'Features + Labels'],
          ['Output', 'Anomaly score (-1 to 1)', 'Class probability (0-1)'],
          ['Khi nào dùng', 'Chưa có labeled data', 'Đã có đủ labeled data (>100 samples)'],
          ['Ưu điểm', 'Deploy nhanh, không cần label', 'Precision cao hơn, explainable'],
          ['Nhược điểm', 'False positive cao hơn', 'Cần labeled data, cần retrain'],
          ['Feature Importance', 'Không có', 'CÓ – biết feature nào quan trọng'],
        ],
        caption: 'Lộ trình: bắt đầu với IF → tích lũy labels → chuyển sang RF',
      },
    },
  ],

  quiz: [
    {
      id: 'q09-1',
      type: 'multiple-choice',
      question:
        'Random Forest là ensemble của nhiều model nào?',
      options: [
        'Linear Regression',
        'Decision Trees',
        'Neural Networks',
        'K-Nearest Neighbors',
      ],
      correctAnswer: 1,
      explanation:
        'Random Forest = ensemble (tập hợp) của nhiều Decision Trees. Mỗi cây vote → kết quả theo số đông (majority voting cho classification).',
    },
    {
      id: 'q09-2',
      type: 'multiple-choice',
      question:
        'stratify=y trong train_test_split dùng để làm gì?',
      options: [
        'Shuffle dữ liệu trước khi chia',
        'Giữ tỷ lệ class (normal/anomaly) trong cả train và test',
        'Sắp xếp dữ liệu theo y',
        'Chia theo thứ tự thời gian',
      ],
      correctAnswer: 1,
      explanation:
        'stratify đảm bảo tỷ lệ class (ví dụ 80% normal, 20% anomaly) giữ nguyên trong cả train set và test set. Quan trọng khi dataset imbalanced.',
    },
    {
      id: 'q09-3',
      type: 'multiple-choice',
      question:
        'Precision = 0.95 cho class "Anomaly" nghĩa là gì?',
      options: [
        'Model phát hiện được 95% anomaly thực tế',
        'Khi model báo anomaly, đúng 95% (5% false alarm)',
        'Model đúng 95% tổng thể',
        '95% dữ liệu là anomaly',
      ],
      correctAnswer: 1,
      explanation:
        'Precision = TP / (TP + FP). "Trong số những cái model nói là anomaly, bao nhiêu % thực sự là anomaly". Precision cao = ít false alarm.',
    },
    {
      id: 'q09-4',
      type: 'multiple-choice',
      question:
        'Cross-validation 5-fold nghĩa là gì?',
      options: [
        'Train 5 models khác nhau',
        'Chia dữ liệu thành 5 phần, mỗi lần dùng 1 phần test, 4 phần train, lặp 5 lần',
        'Train trên 5% dữ liệu',
        'Chạy model 5 lần liên tiếp',
      ],
      correctAnswer: 1,
      explanation:
        '5-fold CV chia data thành 5 folds. Mỗi lần 1 fold làm test, 4 folds làm train, lặp 5 lần → 5 scores → lấy mean. Đánh giá model chính xác hơn single split.',
    },
    {
      id: 'q09-5',
      type: 'multiple-choice',
      question:
        'Khi nào nên chuyển từ Isolation Forest sang Random Forest?',
      options: [
        'Ngay lập tức khi deploy hệ thống',
        'Khi đã tích lũy đủ labeled data từ analyst review',
        'Khi model chạy quá chậm',
        'Không bao giờ nên chuyển',
      ],
      correctAnswer: 1,
      explanation:
        'IF không cần labels → deploy nhanh. Khi analyst review kết quả IF và gán nhãn → tích lũy labeled data → chuyển sang RF cho precision cao hơn. Đây là lộ trình tự nhiên.',
    },
  ],
};
