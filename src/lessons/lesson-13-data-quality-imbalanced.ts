import type { Lesson } from '../types/lesson';

export const lesson13: Lesson = {
  id: '13-data-quality-imbalanced',
  number: 13,
  title: 'Data Quality & Imbalanced Data',
  description: 'SMOTE, class weights, PR-AUC — xử lý 99% normal / 1% anomaly',
  phase: 'phase-4',
  estimatedTime: '2-3 ngày',
  prerequisites: ['12-eda-data-analysis'],

  sections: [
    /* ───── 1. Imbalanced Problem ───── */
    {
      id: 'imbalanced-intro',
      title: '1. Tại sao 1% anomaly là vấn đề lớn?',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          'Anomaly detection trong security có đặc điểm cực đoan: **99-99.9% normal**, chỉ **0.1-1% anomaly**. Đây là class imbalance nghiêm trọng nhất trong ML.',
          '**Mẹo của ML ngây thơ**: Để đạt accuracy 99.5%, model chỉ cần predict "normal" cho tất cả 50,000 samples. Model không học được gì, nhưng metrics đẹp. Đây là tên là "**accuracy paradox**".',
          '**Hậu quả thực tế**: Model overfit tới class majority (normal) → bỏ sót hầu hết attacks. Chính xác những gì attacker muốn.',
          'Bài này giải quyết 3 vấn đề: (1) **Chọn đúng metrics**, (2) **Resampling techniques** (SMOTE), (3) **Algorithm-level solutions** (class weights, threshold tuning).',
        ],
        highlights: [
          {
            type: 'warning',
            text: 'Accuracy là metric SAI khi data imbalanced. Một model predict "normal" 100% đạt accuracy 99.3% nhưng Recall=0. Hãy dùng Precision, Recall, F1, PR-AUC.',
          },
        ],
      },
    },

    /* ───── 2. Metrics ───── */
    {
      id: 'better-metrics',
      title: '2. Metrics đúng cho Imbalanced Data',
      type: 'comparison-table',
      content: {
        kind: 'comparison-table',
        headers: ['Metric', 'Công thức', 'Ý nghĩa', 'Dùng khi'],
        rows: [
          ['Precision', 'TP / (TP + FP)', 'Trong số alerts, bao nhiêu là thật?', 'Muốn giảm False Positives (SOC alert fatigue)'],
          ['Recall (TPR)', 'TP / (TP + FN)', 'Trong số attacks, bắt được bao nhiêu?', 'Muốn không bỏ sót attacks'],
          ['F1 Score', '2·P·R / (P+R)', 'Harmonic mean của P và R', 'Balance giữa P và R'],
          ['F2 Score', '(1+4)·P·R / (4P+R)', 'Recall quan trọng hơn Precision 2x', 'Security context (miss attack >> false alert)'],
          ['PR-AUC', 'Area under P-R curve', 'Tổng thể performance qua mọi threshold', 'Best metric cho imbalanced problems'],
          ['ROC-AUC', 'Area under ROC curve', 'Tổng thể P vs FPR', 'Có thể misleading khi imbalanced'],
        ],
        caption: 'PR-AUC > ROC-AUC cho imbalanced datasets vì PR-AUC không bị ảnh hưởng bởi class majority',
      },
    },

    /* ───── 3. Metrics Code ───── */
    {
      id: 'metrics-code',
      title: 'Code: Đánh giá đúng cách',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'proper_evaluation.py',
        description: 'Tính đầy đủ các metrics quan trọng cho imbalanced data',
        code: `from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    precision_recall_curve,
    average_precision_score,
    roc_auc_score,
    f1_score,
    fbeta_score,
)
import numpy as np

# y_true: nhãn thật (0=normal, 1=anomaly)
# y_pred: dự đoán label
# y_prob: probability của class anomaly

def evaluate_imbalanced(y_true, y_pred, y_prob=None, threshold=0.5):
    """Đánh giá toàn diện cho imbalanced classification."""

    print("=" * 50)
    print("CONFUSION MATRIX:")
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel()
    print(f"  True Negatives  (correct normal): {tn}")
    print(f"  False Positives (false alert):     {fp}  ← cost: analyst time")
    print(f"  False Negatives (missed attack):   {fn}  ← cost: BREACH!")
    print(f"  True Positives  (caught attack):   {tp}")

    print("\\nCLASSIFICATION REPORT:")
    print(classification_report(y_true, y_pred, target_names=['Normal', 'Anomaly']))

    # F2 — penalizes FN (missed attacks) 2x more than FP
    f2 = fbeta_score(y_true, y_pred, beta=2)
    print(f"F2 Score (focus on Recall): {f2:.4f}")

    if y_prob is not None:
        # PR-AUC
        pr_auc = average_precision_score(y_true, y_prob)
        print(f"\\nPR-AUC: {pr_auc:.4f}  ← best metric for imbalanced")
        roc_auc = roc_auc_score(y_true, y_prob)
        print(f"ROC-AUC: {roc_auc:.4f}  ← can be misleadingly high")

        # Threshold tuning — tìm threshold tối ưu cho F2
        precisions, recalls, thresholds = precision_recall_curve(y_true, y_prob)
        f2_scores = (5 * precisions * recalls) / (4 * precisions + recalls + 1e-8)
        best_idx = f2_scores.argmax()
        best_thresh = thresholds[best_idx] if best_idx < len(thresholds) else 1.0
        print(f"\\nOptimal threshold for F2: {best_thresh:.4f}")
        print(f"  At this threshold → P={precisions[best_idx]:.3f}, R={recalls[best_idx]:.3f}")

    return f2`,
        output: `==================================================
CONFUSION MATRIX:
  True Negatives  (correct normal): 48941
  False Positives (false alert):      409  ← cost: analyst time
  False Negatives (missed attack):     87  ← cost: BREACH!
  True Positives  (caught attack):    563

CLASSIFICATION REPORT:
              precision    recall  f1-score
Normal          0.998       0.992     0.995
Anomaly         0.579       0.866     0.694

F2 Score (focus on Recall): 0.8121

PR-AUC: 0.6734  ← best metric for imbalanced
ROC-AUC: 0.9812  ← can be misleadingly high

Optimal threshold for F2: 0.3247
  At this threshold → P=0.521, R=0.912`,
      },
    },

    /* ───── 4. SMOTE ───── */
    {
      id: 'smote',
      title: '3. SMOTE — Tạo thêm anomaly samples',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          '**SMOTE (Synthetic Minority Oversampling TEchnique)** tạo synthetic samples cho class minority bằng cách nội suy giữa các mẫu thật. Không đơn giản là copy-paste (oversampling đơn giản) — SMOTE tạo điểm mới trên đường thẳng nối 2 điểm anomaly gần nhau.',
          '**Khi nào dùng SMOTE?** Chỉ áp dụng trên **training set**. KHÔNG áp dụng trên validation/test set — vì trong production, data thật sẽ vẫn imbalanced như cũ. Test set phải reflect reality.',
          '**SMOTE variants**: `ADASYN` tạo nhiều samples hơn ở vùng khó classify. `BorderlineSMOTE` focus vào samples gần decision boundary. `SMOTETomek` kết hợp SMOTE + Tomek Links (undersampling).',
        ],
        highlights: [
          {
            type: 'important',
            text: 'SMOTE → CHỈ trên training data sau khi split. Nếu SMOTE trước split → data leakage → đánh giá sai (test set chứa synthetic samples đã được model "thấy").',
          },
        ],
      },
    },

    /* ───── 4b. SMOTE Code ───── */
    {
      id: 'smote-code',
      title: 'Code: SMOTE đúng cách',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'smote_correct.py',
        description: 'SMOTE đúng cách trong pipeline — tránh data leakage',
        code: `from imblearn.over_sampling import SMOTE, ADASYN, BorderlineSMOTE
from imblearn.combine import SMOTETomek
from imblearn.pipeline import Pipeline as ImbPipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import numpy as np

# 1. Split TRƯỚC khi SMOTE (tránh leakage)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42,
    stratify=y  # Đảm bảo tỉ lệ class giống nhau ở train và test
)

print(f"Train class distribution: {np.bincount(y_train)}")
print(f"Test class distribution:  {np.bincount(y_test)}")

# 2. SMOTE chỉ áp dụng trên X_train, y_train
smote = SMOTE(
    sampling_strategy=0.1,   # target: anomaly = 10% of majority
    k_neighbors=5,            # số nearest neighbors
    random_state=42,
)
X_train_resampled, y_train_resampled = smote.fit_resample(X_train, y_train)

print(f"\\nAfter SMOTE: {np.bincount(y_train_resampled)}")
# Normal: 39478, Anomaly: 3948 (tăng từ 520 lên 3948)

# 3. HOẶC dùng Pipeline để tự động hóa (best practice)
pipeline = ImbPipeline([
    ('scaler', StandardScaler()),
    ('smote', SMOTE(sampling_strategy=0.1, random_state=42)),
    ('clf', RandomForestClassifier(n_estimators=100, random_state=42)),
])

pipeline.fit(X_train, y_train)
y_pred = pipeline.predict(X_test)  # Test set KHÔNG bị SMOTE

# 4. So sánh các sampling strategies
strategies = {
    'No resampling': None,
    'SMOTE 10%': SMOTE(sampling_strategy=0.1, random_state=42),
    'SMOTE 50%': SMOTE(sampling_strategy=0.5, random_state=42),
    'ADASYN': ADASYN(sampling_strategy=0.1, random_state=42),
    'SMOTETomek': SMOTETomek(random_state=42),
}

from sklearn.metrics import f1_score, average_precision_score
from sklearn.linear_model import LogisticRegression

results = {}
for name, sampler in strategies.items():
    if sampler:
        X_res, y_res = sampler.fit_resample(X_train, y_train)
    else:
        X_res, y_res = X_train, y_train

    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_res, y_res)
    y_prob = clf.predict_proba(X_test)[:, 1]
    pr_auc = average_precision_score(y_test, y_prob)
    results[name] = pr_auc
    print(f"{name:20s}: PR-AUC = {pr_auc:.4f}")`,
        output: `Train class distribution: [39478   520]
Test class distribution:  [9870    130]

After SMOTE: [39478  3948]

No resampling   : PR-AUC = 0.4821
SMOTE 10%       : PR-AUC = 0.6734
SMOTE 50%       : PR-AUC = 0.6312
ADASYN          : PR-AUC = 0.6891
SMOTETomek      : PR-AUC = 0.7023`,
      },
    },

    /* ───── 5. Class Weights ───── */
    {
      id: 'class-weights',
      title: '4. Class Weights — Phương án đơn giản hơn SMOTE',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'class_weights.py',
        description: 'class_weight="balanced" — solution đơn giản nhưng hiệu quả, không cần resampling',
        code: `from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.svm import OneClassSVM
import numpy as np

# ─── Class weights cho supervised models ───
# "balanced" tự động tính weight = n_samples / (n_classes * n_class_samples)
# Anomaly 1%: normal weight=1, anomaly weight=~100 → misclassifying anomaly = 100x costly

clf_balanced = RandomForestClassifier(
    n_estimators=100,
    class_weight='balanced',      # ← đây là thay đổi duy nhất cần làm
    random_state=42,
)
clf_balanced.fit(X_train, y_train)

# Hoặc tự định nghĩa weights
custom_weights = {0: 1, 1: 50}   # anomaly = 50x quan trọng hơn
clf_custom = RandomForestClassifier(
    class_weight=custom_weights,
    random_state=42,
)

# ─── So sánh với không có class_weight ───
clf_no_weight = RandomForestClassifier(n_estimators=100, random_state=42)

from sklearn.metrics import recall_score, precision_score

for name, clf in [('No weight', clf_no_weight),
                  ('Balanced', clf_balanced),
                  ('Custom 50x', clf_custom)]:
    clf.fit(X_train, y_train)
    y_pred = clf.predict(X_test)
    recall = recall_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred)
    print(f"{name:15s}: Recall={recall:.3f}, Precision={precision:.3f}")

# ─── Cho unsupervised models: contamination parameter ───
# Isolation Forest
iso = IsolationForest(
    contamination=0.013,  # ← tỉ lệ anomaly trong data (từ EDA!)
    random_state=42,
)
iso.fit(X_train_unlabeled)  # Unsupervised — không cần y_train

preds = iso.predict(X_test_unlabeled)
# 1 = normal, -1 = anomaly`,
        output: `No weight      : Recall=0.492, Precision=0.871
Balanced       : Recall=0.869, Precision=0.582
Custom 50x     : Recall=0.923, Precision=0.341`,
      },
    },

    /* ───── 6. Data Quality Issues ───── */
    {
      id: 'data-quality',
      title: '5. Data Quality Issues phổ biến trong Network Data',
      type: 'comparison-table',
      content: {
        kind: 'comparison-table',
        headers: ['Vấn đề', 'Biểu hiện', 'Giải pháp'],
        rows: [
          ['Label noise', 'Một số "normal" là attack chưa được phát hiện', 'Semi-supervised learning, nhiều nguồn label'],
          ['Duplicate logs', 'Cùng connection bị log 2 lần', 'Dedup dựa trên (src_ip, dst_ip, timestamp, proto)'],
          ['Time zone mismatch', 'Zeek UTC, user activity logs GMT+7', 'Chuẩn hóa về UTC trước khi join'],
          ['Feature leakage', 'Features tương quan trực tiếp với label', 'Kiểm tra MI score, domain knowledge'],
          ['Stale data', 'Train trên data 2022 nhưng malware thay đổi', 'Concept drift monitoring, retrain schedule'],
          ['Sensor gaps', 'Không capture được traffic mạng nội bộ', 'Coverage map, blind spot analysis'],
        ],
        caption: 'Data quality ảnh hưởng nhiều hơn algorithm choice trong ~80% trường hợp thực tế',
      },
    },

    /* ───── 7. Summary ───── */
    {
      id: 'imbalanced-summary',
      title: '6. Decision Tree: Xử lý Imbalanced Data',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          '**Bước 1 — Metrics**: Thay accuracy bằng PR-AUC + F2. Nếu stakeholder yêu cầu accuracy → giải thích tại sao accuracy misleading.',
          '**Bước 2 — Quick win**: Thử `class_weight="balanced"` trước. Đơn giản, không cần thư viện mới, thường đủ tốt.',
          '**Bước 3 — Sampling** (nếu class_weight chưa đủ): SMOTE hoặc ADASYN trên training set. Compare PR-AUC với và không có SMOTE.',
          '**Bước 4 — Threshold tuning**: Sau khi train, tune prediction threshold để balance Precision vs Recall theo business requirement.',
          '**Bước 5 — Validate trên real distribution**: Final evaluation phải trên test set với distribution như production (không oversample).',
        ],
        highlights: [
          {
            type: 'tip',
            text: 'Với unsupervised anomaly detection: cài đúng `contamination` parameter = tỉ lệ anomaly trong data (từ EDA). Default contamination=0.1 (10%) sai hoàn toàn nếu thực tế chỉ có 1%.',
          },
        ],
      },
    },
  ],

  quiz: [
    {
      id: 'q13-1',
      type: 'multiple-choice',
      question: 'Dataset: 10,000 normal, 100 anomaly. Model predict "normal" 100%. PR-AUC là bao nhiêu?',
      options: ['99%', '50%', '~0 (gần 0)', '1%'],
      correctAnswer: '~0 (gần 0)',
      explanation:
        'PR-AUC tính dựa trên Precision và Recall. Nếu model không bao giờ predict anomaly, Recall = 0 cho mọi threshold → PR curve gần như là đường nằm ngang ở y≈0. PR-AUC ≈ 0.01 (tỉ lệ anomaly). Đây là lý do PR-AUC tốt cho imbalanced.',
    },
    {
      id: 'q13-2',
      type: 'multiple-choice',
      question: 'Tại sao SMOTE phải áp dụng SAU khi split train/test?',
      options: [
        'SMOTE chỉ hoạt động trên training data',
        'Nếu SMOTE trước split → test set chứa synthetic samples → đánh giá bị inflate (data leakage)',
        'Vì SMOTE chậm, chỉ cần làm 1 lần',
        'Không quan trọng, kết quả vẫn giống nhau',
      ],
      correctAnswer: 'Nếu SMOTE trước split → test set chứa synthetic samples → đánh giá bị inflate (data leakage)',
      explanation:
        'Data leakage: nếu SMOTE trước, một số synthetic anomalies từ training anomalies sẽ end up trong test set. Model đã "thấy" các samples tương tự khi train → metrics trên test set cao giả tạo. Real-world performance sẽ tệ hơn nhiều.',
    },
    {
      id: 'q13-3',
      type: 'multiple-choice',
      question: 'Khi nào nên ưu tiên Recall cao hơn Precision trong security ML?',
      options: [
        'Khi SOC team nhỏ, không xử lý được nhiều alerts',
        'Khi mỗi missed attack có hậu quả nghiêm trọng (ransoware, data breach)',
        'Khi muốn giảm chi phí compute',
        'Khi data có nhiều label noise',
      ],
      correctAnswer: 'Khi mỗi missed attack có hậu quả nghiêm trọng (ransoware, data breach)',
      explanation:
        'Recall cao = bắt nhiều attack hơn. Trade-off: Precision thấp = nhiều false positives hơn. Ưu tiên Recall khi cost of missed attack >> cost of false alert (ví dụ: ransomware deployment, APT). Ưu tiên Precision khi SOC capacity hạn chế, không thể xử lý quá nhiều alerts.',
    },
    {
      id: 'q13-4',
      type: 'multiple-choice',
      question: 'Isolation Forest: contamination parameter nên được set theo giá trị nào?',
      options: [
        'Luôn để default (0.1)',
        'Tỉ lệ anomaly thực tế trong data, từ EDA',
        '0.5 để balance',
        'Không quan trọng vì unsupervised',
      ],
      correctAnswer: 'Tỉ lệ anomaly thực tế trong data, từ EDA',
      explanation:
        'contamination là tỉ lệ outliers trong data mà model dự kiến. IF dùng nó để set threshold: samples có anomaly score thấp nhất (bất thường nhất) trong top `contamination * n` sẽ được mark là anomaly. Nếu cài sai → precision/recall hoàn toàn lệch.',
    },
    {
      id: 'q13-5',
      type: 'multiple-choice',
      question: '`class_weight="balanced"` trong RandomForestClassifier làm gì?',
      options: [
        'Tạo thêm samples anomaly',
        'Tự động tính weight = n_samples / (n_classes × class_count) cho mỗi class',
        'Resample dataset để 50/50',
        'Tăng n_estimators cho class minority',
      ],
      correctAnswer: 'Tự động tính weight = n_samples / (n_classes × class_count) cho mỗi class',
      explanation:
        'Với 10,000 normal và 100 anomaly: normal_weight = 10100/(2×10000) ≈ 0.505, anomaly_weight = 10100/(2×100) ≈ 50.5. Model treat mỗi anomaly sample như 50+ normal samples khi tính loss → buộc phải học anomaly tốt hơn.',
    },
  ],
};
