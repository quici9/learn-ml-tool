import type { Lesson } from '../types/lesson';

export const lesson05: Lesson = {
  id: '05-sklearn-anomaly-detection',
  number: 5,
  title: 'Scikit-learn – Anomaly Detection',
  description:
    'Isolation Forest, Pipeline, Threshold Tuning, Model Serialization',
  phase: 'phase-2',
  estimatedTime: '3-4 ngày',
  prerequisites: ['04-ml-fundamentals'],

  sections: [
    /* ───── 1. Scikit-learn API Pattern ───── */
    {
      id: 'sklearn-api',
      title: '1. Scikit-learn API Pattern',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          'Mọi model trong Scikit-learn đều theo cùng pattern – **học 1 lần, dùng mãi**: `init → fit → predict`.',
          'Giống như NestJS service: khởi tạo (`new Service()`), setup (`loadRules()`), và sử dụng (`evaluate(data)`). Sklearn cũng tuần tự: tạo model, train (`fit`), rồi predict.',
          'Pattern này giúp bạn học 1 API → dùng được cho hầu hết model: `IsolationForest`, `RandomForest`, `KMeans`, `SVM`...',
        ],
        highlights: [
          {
            type: 'tip',
            text: '**init → fit → predict** — ghi nhớ 3 bước này, áp dụng cho mọi model trong sklearn.',
          },
        ],
      },
    },
    {
      id: 'sklearn-api-code',
      title: '1b. Code: Sklearn vs NestJS',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        code: `from sklearn.ensemble import IsolationForest

# 1. Khởi tạo model (giống new Service())
model = IsolationForest(n_estimators=100, contamination=0.05)

# 2. Huấn luyện (giống setup/initialize)
model.fit(X_train)

# 3. Dự đoán (giống service method)
predictions = model.predict(X_new)

# 4. Tính score (mức độ bất thường)
scores = model.score_samples(X_new)`,
        filename: 'sklearn_pattern.py',
        description: 'Pattern chuẩn: init → fit → predict/score_samples',
        output: `# Output:
# predictions: array([ 1,  1, -1,  1, ...])  # 1=normal, -1=anomaly
# scores: array([-0.02, 0.05, -0.43, ...])   # thấp=bất thường`,
      },
    },

    /* ───── 2. Isolation Forest – Ý tưởng cốt lõi ───── */
    {
      id: 'if-core-idea',
      title: '2. Isolation Forest – Ý tưởng cốt lõi',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          'Hãy tưởng tượng bạn chơi trò **"20 Questions"** để phân biệt từng kết nối mạng:',
          '**Kết nối bình thường** (giống 95% traffic): cần 4+ câu hỏi mới "cô lập" được — vì nó giống nhiều connection khác.',
          '**Kết nối bất thường** (khác biệt rõ ràng): chỉ 1 câu hỏi là "cô lập" được — vì nó khác biệt, dễ tách ra khỏi đám đông.',
          'Nguyên lý: Xây nhiều cây quyết định ngẫu nhiên. Mỗi cây cố gắng cô lập từng điểm. **Điểm bất thường bị cô lập nhanh hơn** (path length ngắn).',
        ],
        highlights: [
          {
            type: 'important',
            text: 'Path length ngắn → Dễ cô lập → **Bất thường**. Path length dài → Khó cô lập → **Bình thường**.',
          },
        ],
      },
    },

    /* ───── 2b. Interactive: Isolation Forest Diagram ───── */
    {
      id: 'if-diagram',
      title: '2b. Interactive: Isolation Forest Tree',
      type: 'interactive',
      content: {
        kind: 'interactive',
        component: 'IsolationForestDiagram',
        description:
          'Click "Normal Path" hoặc "Anomaly Path" để thấy sự khác biệt về path length.',
      },
    },

    /* ───── 2c. Why Isolation Forest? ───── */
    {
      id: 'if-why-pt186s',
      title: '2c. Tại sao chọn Isolation Forest cho PT186S?',
      type: 'comparison-table',
      content: {
        kind: 'comparison-table',
        headers: ['Ưu điểm', 'Giải thích'],
        rows: [
          ['Không cần labeled data', 'Triển khai ngay tại đơn vị mới'],
          ['High-dimensional data', 'Network features có nhiều cột'],
          ['Nhanh', 'Train trên 100K records trong vài giây'],
          ['Ít hyperparameters', 'Dễ tune hơn deep learning'],
          ['Scalable', 'Xử lý batch 5000+ records/phút'],
        ],
        caption: 'Lý do Isolation Forest phù hợp cho Network Anomaly Detection',
      },
    },

    /* ───── 3. Train Isolation Forest ───── */
    {
      id: 'train-if',
      title: '3. Thực hành: Train Isolation Forest',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        code: `import numpy as np
from sklearn.ensemble import IsolationForest

# 950 connections bình thường
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
model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
model.fit(X)

raw_predictions = model.predict(X)
scores = model.score_samples(X)`,
        filename: 'train_isolation_forest.py',
        description: 'Tạo data giả lập + train model',
        output: `Normal:  951
Anomaly: 49

Score range: -0.612 to 0.081
Normal mean score:  0.019
Anomaly mean score: -0.287`,
      },
    },

    /* ───── 4. Hyperparameters ───── */
    {
      id: 'hyperparameters',
      title: '4. Hyperparameters quan trọng',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          '**`n_estimators`** (số cây): Mặc định 100. Nhiều cây hơn → kết quả ổn định nhưng chậm hơn. Production: 100–300 là đủ.',
          '**`contamination`** (tỷ lệ anomaly): Hyperparameter **quan trọng nhất**. Ảnh hưởng trực tiếp đến threshold phân loại.',
          '`contamination=0.01` → ít alarm, có thể bỏ sót. `contamination=0.10` → nhiều alarm, nhiều false positive. **Khuyến nghị PT186S: 0.05**.',
          '**`max_features`**: Mặc định 1.0 (dùng tất cả). Giảm xuống 0.8 nếu có nhiều features không liên quan.',
        ],
        highlights: [
          {
            type: 'warning',
            text: '`contamination` là "đòn bẩy" chính. Chọn sai → model quá nhạy hoặc quá trơ. Bắt đầu 0.05, tune dần theo thực tế.',
          },
        ],
      },
    },

    /* ───── 5. ML Pipeline ───── */
    {
      id: 'pipeline-concept',
      title: '5. Pipeline: Scaler + Model',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          'Trong production, **luôn dùng Pipeline** để đảm bảo preprocessing và prediction nhất quán.',
          'Không dùng Pipeline: phải nhớ scale thủ công khi predict → dễ quên → kết quả sai.',
          'Dùng Pipeline: gọn gàng, `pipeline.fit(X_train)` rồi `pipeline.predict(X_new)` — tự động scale.',
        ],
        highlights: [
          {
            type: 'tip',
            text: 'Pipeline = "lắp ráp dây chuyền". Data vào → Scaler → Model → Prediction. Mỗi bước tự động chạy theo thứ tự.',
          },
        ],
      },
    },

    /* ───── 5b. Interactive: ML Pipeline Visualizer ───── */
    {
      id: 'pipeline-visualizer',
      title: '5b. Interactive: ML Pipeline',
      type: 'interactive',
      content: {
        kind: 'interactive',
        component: 'PipelineVisualizer',
        description:
          'Nhấn "Play Pipeline" để thấy data flow qua từng bước. Click vào bước để xem code.',
      },
    },

    /* ───── 5c. Pipeline Code ───── */
    {
      id: 'pipeline-code',
      title: '5c. Code: Pipeline',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        code: `from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest

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

# Không cần nhớ scale thủ công!`,
        filename: 'sklearn_pipeline.py',
        description: 'Pipeline gộp StandardScaler + IsolationForest',
      },
    },

    /* ───── 6. Threshold Tuning ───── */
    {
      id: 'threshold-tuning',
      title: '6. Threshold Tuning',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        code: `# Lấy anomaly scores
scores = model.score_samples(X)
default_threshold = model.offset_

# === Tìm threshold tối ưu ===
thresholds = np.linspace(scores.min(), scores.max(), 100)
best_threshold, best_f1 = None, 0

for t in thresholds:
    preds = np.where(scores < t, 1, 0)
    cm = confusion_matrix(y_true, preds)
    tn, fp, fn, tp = cm.ravel()
    fpr = fp / (fp + tn)
    recall = tp / (tp + fn)
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    f1 = 2 * precision * recall / (precision + recall) \\
        if (precision + recall) > 0 else 0

    if fpr <= 0.10 and recall >= 0.80 and f1 > best_f1:
        best_f1, best_threshold = f1, t

print(f"Best threshold: {best_threshold:.4f} (F1={best_f1:.1%})")`,
        filename: 'threshold_tuning.py',
        description: 'Tìm threshold thỏa FPR ≤ 10%, Recall ≥ 80%',
        output: `Threshold=-0.1532: FPR=2.1%, Recall=86.0%, F1=83.6%
Best threshold: -0.1532 (F1=83.6%)`,
      },
    },

    /* ───── 7. Model Serialization ───── */
    {
      id: 'model-serialization',
      title: '7. Model Serialization: Lưu và Nạp Model',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          'Sau khi train xong, lưu model bằng `joblib.dump()`. File `.pkl` chứa toàn bộ pipeline (scaler + model).',
          'Luôn lưu kèm **metadata.json**: version, feature names, threshold, metrics. Đây là "hộ chiếu" của model.',
          'Trong production (FastAPI service): `joblib.load()` model → predict real-time. Tách biệt train vs serve.',
        ],
        highlights: [
          {
            type: 'important',
            text: '`pipeline.pkl` + `metadata.json` = deployment-ready model. FastAPI chỉ cần load 2 file này.',
          },
        ],
      },
    },
    {
      id: 'model-serialization-code',
      title: '7b. Code: Save & Load Model',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        code: `import joblib
import json
from datetime import datetime

# === Lưu model ===
MODEL_DIR = "models/isolation_forest/v1.0"
joblib.dump(pipeline, f"{MODEL_DIR}/pipeline.pkl")

metadata = {
    "model_type": "IsolationForest",
    "version": "1.0",
    "trained_at": datetime.now().isoformat(),
    "feature_columns": FEATURE_COLUMNS,
    "contamination": 0.05,
    "threshold": float(best_threshold),
    "metrics": {"recall": 0.86, "fpr": 0.021, "f1": 0.836}
}
with open(f"{MODEL_DIR}/metadata.json", "w") as f:
    json.dump(metadata, f, indent=2)

# === Nạp model ===
loaded = joblib.load(f"{MODEL_DIR}/pipeline.pkl")
predictions = loaded.predict(X_new)`,
        filename: 'model_serialization.py',
        description: 'Lưu pipeline + metadata, nạp lại trong production',
      },
    },

    /* ───── 8. End-to-end Example ───── */
    {
      id: 'end-to-end',
      title: '8. Ví dụ hoàn chỉnh: Network Anomaly Detection',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          'Pipeline hoàn chỉnh từ data thô → prediction, gồm 5 bước:',
          '**Bước 1**: Sinh/nạp dữ liệu mạng (giả lập Zeek conn.log). **Bước 2**: Feature Engineering — chọn 4 cột chính.',
          '**Bước 3**: Tạo Pipeline (StandardScaler + IsolationForest) và train. **Bước 4**: Predict và đánh giá (Confusion Matrix, FPR, Recall).',
          '**Bước 5**: Lưu model (`pipeline.pkl` + `metadata.json`) cho production FastAPI service.',
        ],
        highlights: [
          {
            type: 'info',
            text: 'Xem interactive Pipeline ở mục 5b để hiểu data flow qua từng bước.',
          },
        ],
      },
    },
  ],

  quiz: [
    {
      id: 'q05-1',
      type: 'multiple-choice',
      question: 'Sklearn API Pattern gồm 3 bước theo thứ tự nào?',
      options: [
        'fit → init → predict',
        'init → predict → fit',
        'init → fit → predict',
        'predict → fit → init',
      ],
      correctAnswer: 'init → fit → predict',
      explanation: 'Pattern chuẩn: init (khởi tạo model với hyperparameters) → fit (train trên data) → predict (dự đoán). Áp dụng cho mọi model sklearn.',
    },
    {
      id: 'q05-2',
      type: 'fill-in-blank',
      question: 'Trong Isolation Forest, anomaly có path length _____ hơn normal (ngắn/dài)?',
      correctAnswer: 'ngắn',
      explanation: 'Anomaly bị cô lập nhanh → path length ngắn. Normal giống nhiều điểm khác → cần nhiều bước (path dài) mới cô lập được.',
      hint: 'Nghĩ về trò "20 Questions" — điểm khác biệt cần ít câu hỏi hơn để tìm ra.',
    },
    {
      id: 'q05-3',
      type: 'multiple-choice',
      question: 'Tại sao phải dùng Pipeline (StandardScaler + IsolationForest)?',
      options: [
        'Để model chạy nhanh hơn 10 lần',
        'Đảm bảo preprocessing và prediction nhất quán, không quên scale khi predict',
        'Vì IsolationForest bắt buộc phải có Scaler',
        'Để giảm kích thước file model',
      ],
      correctAnswer: 'Đảm bảo preprocessing và prediction nhất quán, không quên scale khi predict',
      explanation: 'Pipeline gộp scaler + model thành 1 đơn vị. Khi predict, tự động scale rồi predict — không cần nhớ thủ công. Đặc biệt quan trọng trong production.',
    },
    {
      id: 'q05-4',
      type: 'multiple-choice',
      question: 'Hyperparameter `contamination=0.10` so với `contamination=0.01` sẽ như thế nào?',
      options: [
        'Ít alarm hơn, có thể bỏ sót anomaly',
        'Nhiều alarm hơn, nhiều false positive hơn',
        'Model train nhanh hơn',
        'Feature importance thay đổi',
      ],
      correctAnswer: 'Nhiều alarm hơn, nhiều false positive hơn',
      explanation: 'contamination cao → model cho rằng tỷ lệ anomaly lớn → threshold thấp hơn → nhiều điểm bị đánh dấu là anomaly → nhiều alert, nhiều false positive.',
      hint: 'contamination = tỷ lệ anomaly dự kiến. Cao hơn → model "nhậy" hơn.',
    },
  ],
};
