import type { Lesson } from '../types/lesson';

export const lesson04: Lesson = {
  id: '04-ml-fundamentals',
  number: 4,
  title: 'ML Fundamentals',
  description:
    'Supervised/Unsupervised, workflow, train/test, metrics, overfitting',
  phase: 'phase-1',
  estimatedTime: '3-4 ngày',
  prerequisites: ['03-numpy-statistics'],

  sections: [
    /* ───── Section 1: ML là gì? ───── */
    {
      id: 'what-is-ml',
      title: '1. ML là gì? Rule-based vs ML-based',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          'Machine Learning (ML) là phương pháp để máy tính **học từ dữ liệu** thay vì dựa vào rule viết sẵn. Trong PT186S, bạn đã quen với Suricata – viết rule cụ thể để phát hiện tấn công đã biết.',
          'Hạn chế của rule-based: chỉ phát hiện known attacks, attacker đổi port thì rule vô dụng, và cần cập nhật liên tục.',
          'ML-based detection học pattern từ dữ liệu mạng bình thường, và khi có kết nối khác biệt → cảnh báo anomaly. Ưu điểm: phát hiện zero-day, tự thích ứng. Nhược điểm: cần baseline data, có false positive.',
        ],
        highlights: [
          {
            type: 'tip',
            text: 'Chiến lược PT186S: Suricata Rules (known attacks) + ML Model (unknown threats) = Bảo vệ toàn diện.',
          },
        ],
      },
    },

    /* ───── Section 1b: Rule-based vs ML bảng so sánh ───── */
    {
      id: 'rule-vs-ml',
      title: 'So sánh Rule-based vs ML-based',
      type: 'comparison-table',
      content: {
        kind: 'comparison-table',
        headers: ['Tiêu chí', 'Rule-based (Suricata)', 'ML-based'],
        rows: [
          ['Phát hiện', 'Known attacks', 'Unknown anomalies'],
          ['Cập nhật', 'Thủ công (viết rules)', 'Tự động học từ data'],
          ['False Positive', 'Thấp', 'Có thể cao ban đầu'],
          ['Zero-day', '❌ Không phát hiện', '✅ Phát hiện qua anomaly'],
          ['Giải thích', '✅ Rule rõ ràng', '⚠️ Black box'],
          ['Triển khai', 'Nhanh', 'Cần dữ liệu huấn luyện'],
        ],
        caption: 'Bảng so sánh hai phương pháp phát hiện xâm nhập',
      },
    },

    /* ───── Section 2: Ba loại ML ───── */
    {
      id: 'three-types',
      title: '2. Ba loại Machine Learning',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          '**Supervised Learning (có giám sát):** Dạy model bằng dữ liệu đã có đáp án (labeled data). Giống việc dạy nhân viên mới: "Đây là DDoS, đây là port scan, đây là bình thường." Dùng khi CÓ dữ liệu đã gán nhãn.',
          '**Unsupervised Learning (không giám sát) ⭐:** Model tự tìm pattern từ dữ liệu KHÔNG có đáp án. Giống việc thả nhân viên mới vào phòng server 2 tuần – tự quan sát traffic "bình thường" → khi thấy khác biệt → cảnh báo. Đây chính là Isolation Forest – thuật toán chính của PT186S.',
          '**Reinforcement Learning:** Agent thử-sai trong môi trường, nhận thưởng/phạt. Dùng cho game, robotics – không liên quan đến PT186S.',
        ],
        highlights: [
          {
            type: 'important',
            text: 'PT186S Giai đoạn 1: Unsupervised (Isolation Forest) → không cần labeled data, triển khai ngay. Giai đoạn 2: Supervised (Random Forest) → phân loại chính xác loại tấn công.',
          },
        ],
      },
    },

    /* ───── Section 2b: Bảng so sánh 3 loại ML ───── */
    {
      id: 'ml-types-comparison',
      title: 'So sánh 3 loại Machine Learning',
      type: 'comparison-table',
      content: {
        kind: 'comparison-table',
        headers: ['Tiêu chí', 'Supervised', 'Unsupervised', 'Reinforcement'],
        rows: [
          ['Dữ liệu', 'Có nhãn (labeled)', 'Không có nhãn', 'Reward/Penalty'],
          ['Ví dụ', 'Random Forest, SVM', 'Isolation Forest, DBSCAN', 'Q-Learning, PPO'],
          ['Use-case PT186S', 'Phân loại tấn công', 'Phát hiện anomaly ⭐', 'Không áp dụng'],
          ['Khi nào dùng', 'Có labeled data', 'Không có labeled data', 'Game, Robotics'],
        ],
        caption: 'So sánh ba loại Machine Learning trong bối cảnh network security',
      },
    },

    /* ───── Section 3: Quy trình ML ───── */
    {
      id: 'ml-workflow',
      title: '3. Quy trình ML từ A đến Z',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          'Một dự án ML thực tế luôn đi qua 8 bước chuẩn. Hãy hiểu từng bước trước khi viết code:',
          '**1. Thu thập dữ liệu:** Zeek conn.log, Suricata alerts → Elasticsearch.',
          '**2. Tiền xử lý:** Xử lý NaN, chuẩn hóa, loại bỏ cột không cần.',
          '**3. Feature Engineering:** Raw logs → Feature vectors (conn_count, bytes_ratio).',
          '**4. Train/Test Split:** 80% train, 20% test.',
          '**5. Huấn luyện model:** model.fit(X_train).',
          '**6. Đánh giá:** Accuracy, Recall, FPR trên test set.',
          '**7. Triển khai:** Save model → Load trong FastAPI → NestJS gọi API.',
          '**8. Giám sát & Huấn luyện lại:** Model drift detection, scheduled retraining.',
        ],
      },
    },

    /* ───── Section 3b: ML Workflow (interactive placeholder) ───── */
    {
      id: 'ml-pipeline-visual',
      title: 'ML Pipeline Visualization',
      type: 'interactive',
      content: {
        kind: 'interactive',
        component: 'PipelineVisualizer',
        description: 'Sơ đồ 8 bước của quy trình ML — sẽ có animation trong Slice 6.',
      },
    },

    /* ───── Section 4: Train/Test Split ───── */
    {
      id: 'train-test-split',
      title: '4. Train/Test Split – Tại sao phải tách dữ liệu?',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          'Hãy tưởng tượng: cho học sinh làm bài kiểm tra bằng **chính đề cương** → ai cũng 10 điểm, nhưng **không chứng minh được hiểu bài**.',
          'ML cũng vậy – phải test trên dữ liệu model **chưa từng thấy**. Vì vậy luôn chia dữ liệu thành train set và test set.',
        ],
        highlights: [
          {
            type: 'info',
            text: 'random_state=42: giống seed – cho kết quả giống nhau mỗi lần chạy. stratify=y: đảm bảo tỷ lệ anomaly trong train và test giống nhau.',
          },
        ],
      },
    },

    /* ───── Section 4b: Train/Test Split code ───── */
    {
      id: 'train-test-code',
      title: 'Code: Train/Test Split',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'train_test_split.py',
        description: 'Chia 1000 kết nối mạng thành 80% train, 20% test',
        code: `from sklearn.model_selection import train_test_split
import numpy as np

# 1000 kết nối mạng, mỗi kết nối có 5 features
X = np.random.rand(1000, 5)
y = np.random.choice([0, 1], 1000, p=[0.95, 0.05])

# Chia 80% train, 20% test
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,        # 20% cho test
    random_state=42,      # seed cho reproducibility
    stratify=y            # giữ tỷ lệ normal/anomaly
)

print(f"Train: {X_train.shape[0]} samples")  # 800
print(f"Test:  {X_test.shape[0]} samples")   # 200`,
        output: 'Train: 800 samples\nTest:  200 samples',
      },
    },

    /* ───── Section 5: Overfitting/Underfitting ───── */
    {
      id: 'overfitting-underfitting',
      title: '5. Overfitting và Underfitting',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          '**Overfitting ("Học vẹt"):** Model ghi nhớ dữ liệu train thay vì học pattern. Train accuracy 99% nhưng test accuracy 60%. Ví dụ: model nhớ IP + port + time cụ thể → không tổng quát hóa được.',
          '**Underfitting ("Học chưa đủ"):** Model quá đơn giản, không nắm được pattern. Cả train và test đều thấp. Ví dụ: chỉ dùng 1 feature (bytes) → bỏ sót port scan.',
          'Mục tiêu là tìm **Sweet Spot** – model vừa đủ phức tạp để học pattern mà không ghi nhớ dữ liệu.',
        ],
        highlights: [
          {
            type: 'warning',
            text: 'Dấu hiệu Overfitting: Train score rất cao, Test score thấp hơn nhiều. Khắc phục: tăng dữ liệu, giảm model complexity, dùng Cross-Validation.',
          },
        ],
      },
    },

    /* ───── Section 5b: Overfitting table ───── */
    {
      id: 'fitting-comparison',
      title: 'Underfitting ↔ Sweet Spot ↔ Overfitting',
      type: 'comparison-table',
      content: {
        kind: 'comparison-table',
        headers: ['', 'Underfitting', 'Sweet Spot ✅', 'Overfitting'],
        rows: [
          ['Mô tả', 'Quá đơn giản', 'Vừa đủ', 'Quá phức tạp'],
          ['Train score', '~60%', '~90%', '~99%'],
          ['Test score', '~55%', '~87%', '~60%'],
          ['Khắc phục', 'Thêm features / model', '—', 'Giảm complexity / thêm data'],
        ],
      },
    },

    /* ───── Section 6: Metrics ───── */
    {
      id: 'metrics',
      title: '6. Metrics đánh giá – Accuracy, Precision, Recall, F1',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          '**Accuracy** = Số dự đoán đúng / Tổng. Ví dụ: model đoán đúng 900/1000 → 90%.',
          '⚠️ **Bẫy Accuracy:** 950/1000 connections normal → model đoán TẤT CẢ là normal đạt 95% accuracy nhưng bỏ sót mọi tấn công! → Cần Precision và Recall.',
          '**Precision** = TP / (TP + FP) → "Khi model nói anomaly, đúng bao nhiêu?" Precision cao = ít cảnh báo sai → SOC analyst không bị alert fatigue.',
          '**Recall** = TP / (TP + FN) → "Bỏ sót bao nhiêu tấn công?" Recall cao = ít bỏ sót tấn công → an toàn hơn.',
          '**FPR** = FP / (FP + TN) → Tỷ lệ cảnh báo sai trên tổng connections bình thường. PT186S yêu cầu: FPR ≤ 10%.',
          '**F1-Score** = 2 × (Precision × Recall) / (Precision + Recall) → Cân bằng Precision và Recall.',
        ],
        highlights: [
          {
            type: 'important',
            text: 'Trade-off: Ngưỡng thấp → Recall CAO (ít bỏ sót) nhưng Precision THẤP (nhiều false alarm). Ngưỡng cao → Precision CAO nhưng Recall THẤP.',
          },
        ],
      },
    },

    /* ───── Section 7: Confusion Matrix ───── */
    {
      id: 'confusion-matrix',
      title: '7. Confusion Matrix',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          'Confusion Matrix là bảng 2×2 tổng hợp TẤT CẢ metrics ở trên.',
          '**TN (True Negative):** Normal → model đoán Normal ✅',
          '**FP (False Positive):** Normal → model đoán Anomaly ❌ (cảnh báo sai)',
          '**FN (False Negative):** Anomaly → model đoán Normal ❌ (BỎ SÓT!)',
          '**TP (True Positive):** Anomaly → model đoán Anomaly ✅',
        ],
      },
    },

    /* ───── Section 7b: Confusion Matrix interactive ───── */
    {
      id: 'confusion-matrix-explorer',
      title: 'Interactive Confusion Matrix',
      type: 'interactive',
      content: {
        kind: 'interactive',
        component: 'ConfusionMatrixExplorer',
        props: { tn: 930, fp: 20, fn: 10, tp: 40 },
        description: 'Chỉnh giá trị TP/TN/FP/FN → xem metrics thay đổi real-time. Sẽ có trong Slice 4.',
      },
    },

    /* ───── Section 7c: Confusion Matrix code ───── */
    {
      id: 'confusion-matrix-code',
      title: 'Code: Tính Confusion Matrix',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'confusion_matrix.py',
        description: 'Tính confusion matrix và classification report',
        code: `from sklearn.metrics import confusion_matrix, classification_report
import numpy as np

# y_true: nhãn thật, y_pred: dự đoán của model
y_true = np.array([0]*950 + [1]*50)
y_pred = np.array([0]*930 + [1]*20 + [0]*10 + [1]*40)

# Confusion Matrix
cm = confusion_matrix(y_true, y_pred)
print("Confusion Matrix:")
print(cm)
# [[930  20]
#  [ 10  40]]

# Báo cáo chi tiết
print(classification_report(
    y_true, y_pred,
    target_names=["normal", "anomaly"]
))`,
        output: `Confusion Matrix:
[[930  20]
 [ 10  40]]

              precision    recall  f1-score   support
      normal       0.99      0.98      0.98       950
     anomaly       0.67      0.80      0.73        50
    accuracy                           0.97      1000`,
      },
    },

    /* ───── Section 7d: Threshold concept ───── */
    {
      id: 'threshold-concept',
      title: '7d. Threshold – Ngưỡng phát hiện',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          'Model trả về một **anomaly score** cho mỗi kết nối. Ta cần chọn **threshold** (ngưỡng) để quyết định: score ≥ threshold → Anomaly.',
          'Threshold thấp → phát hiện nhiều hơn (Recall ↑) nhưng cũng báo sai nhiều (FPR ↑). Threshold cao → ít báo sai nhưng bỏ sót tấn công (Recall ↓).',
          '**Mục tiêu PT186S:** FPR ≤ 10% VÀ Recall ≥ 80%. Kéo slider bên dưới để tìm vùng threshold phù hợp!',
        ],
      },
    },

    /* ───── Section 7e: Interactive Threshold Explorer ───── */
    {
      id: 'threshold-explorer',
      title: 'Interactive: Threshold vs Metrics',
      type: 'interactive',
      content: {
        kind: 'interactive',
        component: 'ThresholdExplorer',
        description: 'Kéo slider để thay đổi threshold và quan sát Precision, Recall, F1, FPR thay đổi theo thời gian thực.',
        props: {
          defaultThreshold: 0.5,
        },
      },
    },

    /* ───── Section 8: Cross-Validation ───── */
    {
      id: 'cross-validation',
      title: '8. Cross-Validation',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          'Nếu chỉ chia 1 lần train/test, kết quả phụ thuộc "may mắn" – test set có thể dễ hoặc khó.',
          '**K-Fold Cross-Validation:** Chia dữ liệu thành K phần (thường K=5), lần lượt dùng mỗi phần làm test. Kết quả: trung bình ± độ lệch chuẩn → đáng tin cậy hơn 1 con số duy nhất.',
        ],
      },
    },

    /* ───── Section 8b: Cross-Validation code ───── */
    {
      id: 'cross-validation-code',
      title: 'Code: K-Fold Cross-Validation',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'cross_validation.py',
        description: 'Minh hoạ K-Fold CV với Random Forest',
        code: `from sklearn.model_selection import cross_val_score
from sklearn.ensemble import RandomForestClassifier

model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)
scores = cross_val_score(
    model, X, y, cv=5, scoring="accuracy"
)

print(f"Scores per fold: {scores}")
print(f"Mean: {scores.mean():.2f} ± {scores.std():.2f}")`,
        output: 'Scores per fold: [0.85, 0.88, 0.82, 0.86, 0.84]\nMean: 0.85 ± 0.02',
      },
    },

    /* ───── Section 9: Ví dụ tổng hợp ───── */
    {
      id: 'end-to-end-example',
      title: '9. Ví dụ tổng hợp: Đánh giá 1000 kết nối mạng',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'full_example.py',
        description: 'End-to-end: tạo dữ liệu → chuẩn hóa → Isolation Forest → đánh giá',
        code: `import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest
from sklearn.metrics import confusion_matrix, classification_report

# === 1. Tạo dữ liệu giả lập ===
np.random.seed(42)

# 950 connections bình thường
normal = np.column_stack([
    np.random.exponential(2.0, 950),        # duration
    np.random.lognormal(6, 1.5, 950),       # orig_bytes
    np.random.lognormal(7, 1.5, 950),       # resp_bytes
    np.random.choice([53, 80, 443], 950),   # dest_port
    np.random.randint(1, 5, 950),           # unique_dests
])

# 50 connections bất thường
anomaly = np.column_stack([
    np.random.exponential(0.05, 50),        # duration rất ngắn
    np.random.lognormal(10, 2, 50),         # bytes rất cao
    np.random.lognormal(3, 1, 50),          # response ít
    np.random.choice([4444, 5555, 31337], 50),
    np.random.randint(50, 200, 50),         # nhiều dest (scan)
])

X = np.vstack([normal, anomaly])
y_true = np.array([0]*950 + [1]*50)

# === 2. Chuẩn hóa ===
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# === 3. Train Isolation Forest ===
model = IsolationForest(
    n_estimators=100,
    contamination=0.05,
    random_state=42
)
model.fit(X_scaled)

# === 4. Predict ===
predictions = model.predict(X_scaled)
y_pred = np.where(predictions == -1, 1, 0)

# === 5. Đánh giá ===
cm = confusion_matrix(y_true, y_pred)
tn, fp, fn, tp = cm.ravel()
fpr = fp / (fp + tn)
recall = tp / (tp + fn)

print(f"FPR: {fpr:.1%} | Recall: {recall:.1%}")
print(f"Yêu cầu: FPR ≤ 10%, Recall ≥ 80%")`,
        output: 'FPR: 2.1% | Recall: 80.0%\nYêu cầu: FPR ≤ 10%, Recall ≥ 80%',
        isPlayground: true,
        parameters: [
          {
            name: 'contamination',
            label: 'Contamination Rate',
            type: 'slider',
            min: 0.01,
            max: 0.2,
            step: 0.01,
            defaultValue: 0.05,
          },
        ],
      },
    },
  ],

  quiz: [
    {
      id: 'q04-1',
      type: 'multiple-choice',
      question: 'Ưu điểm chính của ML-based detection so với Rule-based (Suricata) là gì?',
      options: [
        'Chạy nhanh hơn trên hardware cũ',
        'Phát hiện được zero-day attacks và anomaly chưa biết trước',
        'Không cần dữ liệu training',
        'Không bao giờ có false positive',
      ],
      correctAnswer: 'Phát hiện được zero-day attacks và anomaly chưa biết trước',
      explanation: 'ML-based detection học pattern từ dữ liệu bình thường, nên có thể phát hiện anomaly chưa từng thấy trước đó (zero-day). Rule-based chỉ phát hiện được các pattern đã biết.',
    },
    {
      id: 'q04-2',
      type: 'multiple-choice',
      question: 'Isolation Forest thuộc loại ML nào?',
      options: [
        'Supervised Learning',
        'Unsupervised Learning',
        'Reinforcement Learning',
        'Semi-supervised Learning',
      ],
      correctAnswer: 'Unsupervised Learning',
      explanation: 'Isolation Forest là unsupervised — nó chỉ cần dữ liệu bình thường (normal), không cần label (nhãn attack/not-attack) cho mỗi mẫu.',
      hint: 'Nghĩ xem: Isolation Forest có cần biết trước đâu là attack, đâu là normal không?',
    },
    {
      id: 'q04-3',
      type: 'compute',
      question: 'Với Confusion Matrix: TP=40, TN=930, FP=20, FN=10. Tính Precision (làm tròn 2 chữ số thập phân)?',
      correctAnswer: 0.67,
      tolerance: 0.01,
      explanation: 'Precision = TP / (TP + FP) = 40 / (40 + 20) = 40/60 ≈ 0.67. Precision cho biết tỉ lệ alert đúng trong tổng số alert.',
      hint: 'Precision = TP / (TP + FP). Đáp án dạng 0.xx',
    },
    {
      id: 'q04-4',
      type: 'multiple-choice',
      question: 'Overfitting xảy ra khi nào?',
      options: [
        'Model quá đơn giản, không học được pattern nào',
        'Model học "thuộc lòng" training data, không generalize được',
        'Training data quá nhiều',
        'Model có Recall = 100%',
      ],
      correctAnswer: 'Model học "thuộc lòng" training data, không generalize được',
      explanation: 'Overfitting = model quá phức tạp, "nhớ" cả noise trong training data. Kết quả: train accuracy rất cao nhưng test accuracy thấp.',
    },
    {
      id: 'q04-5',
      type: 'compute',
      question: 'Với Precision = 0.67 và Recall = 0.80, tính F1-Score (làm tròn 2 chữ số)?',
      correctAnswer: 0.73,
      tolerance: 0.01,
      explanation: 'F1 = 2 × (P × R) / (P + R) = 2 × (0.67 × 0.80) / (0.67 + 0.80) = 2 × 0.536 / 1.47 ≈ 0.73. F1 là harmonic mean của Precision và Recall.',
      hint: 'F1 = 2 × (Precision × Recall) / (Precision + Recall)',
    },
  ],
};
