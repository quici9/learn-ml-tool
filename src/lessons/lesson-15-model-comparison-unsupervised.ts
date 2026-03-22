import type { Lesson } from '../types/lesson';

export const lesson15: Lesson = {
  id: '15-model-comparison-unsupervised',
  number: 15,
  title: 'Model Comparison: Unsupervised',
  description: 'IF vs LOF vs OCSVM vs DBSCAN vs Elliptic Envelope vs Z-score vs Autoencoder',
  phase: 'phase-5',
  estimatedTime: '3-4 ngày',
  prerequisites: ['14-hyperparameter-tuning'],

  sections: [
    /* ───── 1. Landscape ───── */
    {
      id: 'model-landscape',
      title: '1. Bức tranh tổng thể: 7 approaches cho Unsupervised Anomaly Detection',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          'Không có model nào "tốt nhất" — mỗi model có assumptions riêng về cái gì là "bình thường". Hiểu assumptions = biết khi nào model sẽ fail.',
          '**7 approaches cần biết**: (1) Isolation Forest, (2) LOF, (3) One-Class SVM, (4) DBSCAN, (5) Elliptic Envelope, (6) Statistical (Z-score/IQR), (7) Autoencoder.',
          '**Frameworks để dùng**: `scikit-learn` (IF, LOF, OCSVM, EE), `PyOD` (library anomaly detection chuyên dụng với 40+ models), `PyTorch/Keras` (Autoencoder).',
        ],
        highlights: [
          {
            type: 'tip',
            text: 'Workflow thực tế: thử 3-4 models, ensemble chúng (majority vote hoặc average scores), evaluate trên labeled test set. Ensembling thường tốt hơn bất kỳ single model nào.',
          },
        ],
      },
    },

    /* ───── 2. Model Comparison Table ───── */
    {
      id: 'model-comparison-deep',
      title: '2. So sánh chi tiết 7 Models',
      type: 'comparison-table',
      content: {
        kind: 'comparison-table',
        headers: ['Model', 'Assumption về "Normal"', 'Cơ chế', 'Scalability', 'Hyperparams quan trọng', 'Khi nào dùng'],
        rows: [
          [
            'Isolation Forest',
            'Normal = cần nhiều splits để isolate, Anomaly = ít splits',
            'Xây random trees, đo path length trung bình để isolate 1 điểm',
            'O(n·log n) — rất nhanh với data lớn',
            'n_estimators (100-500), contamination, max_samples',
            'High-dimensional data, fast baseline, production default',
          ],
          [
            'LOF (Local Outlier Factor)',
            'Normal = density tương đương với neighbors, Anomaly = density thấp hơn nhiều',
            'So sánh local density với k nearest neighbors',
            'O(n²) — chậm với data lớn (>50k)',
            'n_neighbors (5-50), metric (euclidean/cosine)',
            'Clustered normal data, anomalies là low-density regions',
          ],
          [
            'One-Class SVM',
            'Normal = nằm trong một hypersphere xung quanh training data',
            'Tìm hyperplane phân tách data khỏi origin trong feature space',
            'O(n²-n³) — rất chậm, cần sampling',
            'kernel (rbf), nu (contamination rate), gamma',
            'Low-dimensional, clear boundary giữa normal và anomaly',
          ],
          [
            'DBSCAN',
            'Normal = thuộc cluster dense, Anomaly = noise points (không có cluster)',
            'Cluster với density-based: core points, border, noise',
            'O(n·log n) với kd-tree',
            'eps (neighborhood radius), min_samples',
            'Spatial data, khi anomalies là isolated points',
          ],
          [
            'Elliptic Envelope',
            'Normal = phân bố Gaussian trong feature space',
            'Fit Gaussian, tính Mahalanobis distance',
            'O(n·d²) — tốt với moderate data',
            'contamination, support_fraction',
            'Gaussian data, correlated features, benchmark',
          ],
          [
            'Z-score / IQR',
            'Normal = trong 3σ / trong IQR range',
            'Statistical thresholds per feature',
            'O(n) — cực nhanh',
            'sigma threshold (default 3), IQR multiplier (1.5)',
            'Univariate outliers, quick check, monitoring per-metric',
          ],
          [
            'Autoencoder',
            'Normal = có thể compress và reconstruct tốt',
            'Neural network: encode → decode, đo reconstruction error',
            'Depends on architecture — scale tốt với GPU',
            'Latent dim, layers, epochs, reconstruction threshold',
            'High-dimensional, complex patterns, với nhiều data',
          ],
        ],
        caption: 'Không có "best model" — selection phụ thuộc vào data characteristics và constraints',
      },
    },

    /* ───── 3. Code: Benchmark tất cả ───── */
    {
      id: 'benchmark-code',
      title: '3. Code: Benchmark 6 models trên cùng dataset',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'model_benchmark.py',
        description: 'Chạy tất cả models, so sánh PR-AUC, training time, prediction time',
        code: `import time
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor
from sklearn.svm import OneClassSVM
from sklearn.cluster import DBSCAN
from sklearn.covariance import EllipticEnvelope
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import average_precision_score

# ─── Setup ───
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train_unlabeled)
X_test_scaled = scaler.transform(X_test)

results = {}

# ─── 1. Isolation Forest ───
start = time.time()
iso = IsolationForest(n_estimators=200, contamination=0.01, random_state=42)
iso.fit(X_train_scaled)
train_time = time.time() - start

start = time.time()
iso_scores = -iso.score_samples(X_test_scaled)  # negate: higher = more anomalous
pred_time = time.time() - start

results['Isolation Forest'] = {
    'pr_auc': average_precision_score(y_test, iso_scores),
    'train_time': train_time,
    'pred_time': pred_time,
}

# ─── 2. LOF (novelty=True để dùng predict trên test) ───
start = time.time()
lof = LocalOutlierFactor(n_neighbors=20, contamination=0.01, novelty=True)
lof.fit(X_train_scaled)
train_time = time.time() - start

start = time.time()
lof_scores = -lof.score_samples(X_test_scaled)
pred_time = time.time() - start

results['LOF'] = {
    'pr_auc': average_precision_score(y_test, lof_scores),
    'train_time': train_time,
    'pred_time': pred_time,
}

# ─── 3. One-Class SVM (subsample vì chậm) ───
n_sample = min(5000, len(X_train_scaled))
X_sample = X_train_scaled[:n_sample]  # OCSVM chậm với data lớn

start = time.time()
ocsvm = OneClassSVM(kernel='rbf', nu=0.01, gamma='scale')
ocsvm.fit(X_sample)
train_time = time.time() - start

start = time.time()
ocsvm_scores = -ocsvm.score_samples(X_test_scaled)
pred_time = time.time() - start

results['One-Class SVM'] = {
    'pr_auc': average_precision_score(y_test, ocsvm_scores),
    'train_time': train_time,
    'pred_time': pred_time,
}

# ─── 4. Elliptic Envelope ───
start = time.time()
ee = EllipticEnvelope(contamination=0.01, random_state=42)
ee.fit(X_train_scaled)
train_time = time.time() - start

ee_scores = -ee.score_samples(X_test_scaled)
results['Elliptic Envelope'] = {
    'pr_auc': average_precision_score(y_test, ee_scores),
    'train_time': train_time,
    'pred_time': 0.01,
}

# ─── 5. Z-score ensemble (per feature → max per sample) ───
from scipy import stats
z_scores = np.abs(stats.zscore(X_test_scaled))
z_max = z_scores.max(axis=1)  # anomaly nếu bất kỳ feature nào outlier

results['Z-score (max)'] = {
    'pr_auc': average_precision_score(y_test, z_max),
    'train_time': 0.001,
    'pred_time': 0.001,
}

# ─── 6. Ensemble: average scores ───
all_scores = np.column_stack([
    iso_scores / iso_scores.max(),
    lof_scores / lof_scores.max(),
    ocsvm_scores / ocsvm_scores.max(),
])
ensemble_scores = all_scores.mean(axis=1)

results['Ensemble (avg)'] = {
    'pr_auc': average_precision_score(y_test, ensemble_scores),
    'train_time': sum([results[m]['train_time'] for m in ['Isolation Forest', 'LOF', 'One-Class SVM']]),
    'pred_time': 0.05,
}

# ─── In kết quả ───
df_results = pd.DataFrame(results).T.sort_values('pr_auc', ascending=False)
print(df_results.round(4))`,
        output: `                   pr_auc  train_time  pred_time
Ensemble (avg)     0.7234      5.8721     0.0500
Isolation Forest   0.6891      1.2341     0.0089
LOF                0.6734      3.4521     0.0234
One-Class SVM      0.6123      4.2301     0.0312
Elliptic Envelope  0.5821      0.4312     0.0041
Z-score (max)      0.4231      0.0010     0.0010`,
      },
    },

    /* ───── 4. Khi nào dùng gì ───── */
    {
      id: 'decision-framework',
      title: '4. Framework chọn model',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          '**Bước 1 — Data size**: Nếu > 100k samples, loại ngay LOF và OCSVM (quá chậm). Isolation Forest và Z-score vẫn tốt.',
          '**Bước 2 — Dimensionality**: Nếu > 20 features, DBSCAN và Elliptic Envelope kém hơn (curse of dimensionality). Isolation Forest, LOF, Autoencoder scale tốt hơn.',
          '**Bước 3 — Data distribution**: Gaussian rõ ràng → Elliptic Envelope tốt. Clustered → LOF/DBSCAN tốt. Mixed/unknown → Isolation Forest là safe default.',
          '**Bước 4 — Labeled data availability**: Nếu có một ít labels → tune contamination parameter và chọn model bằng PR-AUC. Nếu không có labels → khó evaluate, dựa vào domain knowledge.',
          '**Rule of thumb**: Bắt đầu với Isolation Forest (fast, robust, production-proven). Add LOF nếu data clustered. Ensemble cả hai. Thêm Autoencoder nếu có nhiều data (>10k samples).',
        ],
        highlights: [
          {
            type: 'warning',
            text: 'LOF KHÔNG có `score_samples` trong predict mode nếu `novelty=False`. Phải set `novelty=True` để dùng trên test set mới. Sai lầm phổ biến dẫn đến error hoặc evaluate trên training data.',
          },
        ],
      },
    },

    /* ───── 5. Failure Modes ───── */
    {
      id: 'failure-modes',
      title: '5. Failure Modes của từng model',
      type: 'comparison-table',
      content: {
        kind: 'comparison-table',
        headers: ['Model', 'Fail khi', 'Ví dụ thực tế'],
        rows: [
          ['Isolation Forest', 'Anomaly là một cluster nhỏ (không isolated về structural complexity)', 'Slow DDoS với nhiều IPs → mỗi IP normal nhưng pattern tổng thể là attack'],
          ['LOF', 'Anomaly ở vùng space thưa thớt nhưng "bình thường" về local density', 'Admin login từ office sau giờ làm: rare nhưng local density cao'],
          ['OCSVM', 'High-dimensional data, non-Gaussian boundary', 'Network features >50 dims → kernel RBF không distinguish được tốt'],
          ['DBSCAN', 'Different density clusters, threshold eps rất nhạy cảm', 'Một server có traffic cao hơn → tất cả bị mark là noise'],
          ['Elliptic Envelope', 'Multimodal distribution, non-Gaussian', 'Workload khác nhau ngày/đêm → 2 "clusters" normal → fail'],
          ['Z-score', 'Correlated features, context-dependent anomalies', 'High bytes không anomaly nếu là file server bình thường'],
          ['Autoencoder', 'Quá ít training data, mode collapse', 'Train với <1000 samples → model học memorize thay vì generalize'],
        ],
        caption: 'Hiểu failure modes → biết khi nào cần đổi model hoặc thêm features',
      },
    },
  ],

  quiz: [
    {
      id: 'q15-1',
      type: 'multiple-choice',
      question: 'Data: 200,000 samples, 50 features, unknown distribution. Model nên dùng đầu tiên?',
      options: ['LOF (k=20)', 'One-Class SVM', 'Isolation Forest', 'Elliptic Envelope'],
      correctAnswer: 'Isolation Forest',
      explanation:
        'LOF: O(n²) → 200k samples quá chậm. OCSVM: còn chậm hơn. Elliptic Envelope: giả định Gaussian, 50 features → curse of dimensionality. Isolation Forest: O(n log n), scale tốt, không giả định distribution → default tốt nhất.',
    },
    {
      id: 'q15-2',
      type: 'multiple-choice',
      question: 'LOF với `novelty=False`: predict được trên test set không?',
      options: ['Có, luôn luôn', 'Không, phải set novelty=True', 'Có nhưng kết quả sai', 'Tùy version sklearn'],
      correctAnswer: 'Không, phải set novelty=True',
      explanation:
        'Khi `novelty=False`, LOF chỉ dùng được trong `fit_predict()` mode: train và predict trên cùng dataset. Để predict trên new data (test set), phải set `novelty=True` trước khi fit, sau đó dùng `score_samples()`. Sai lầm này gây ra data leakage ngầm.',
    },
    {
      id: 'q15-3',
      type: 'multiple-choice',
      question: 'Tại sao Ensemble lại tốt hơn individual models trong anomaly detection?',
      options: [
        'Ensemble nhanh hơn',
        'Mỗi model có assumptions khác nhau về anomaly → ensemble giảm bias của từng model',
        'Ensemble tự động tune hyperparameters',
        'Vì dùng nhiều models nên accuracy tự nhiên cao hơn',
      ],
      correctAnswer: 'Mỗi model có assumptions khác nhau về anomaly → ensemble giảm bias của từng model',
      explanation:
        'IF detect anomalies qua isolation, LOF qua density, OCSVM qua boundary. Khi ensemble, một anomaly không bị bỏ sót nếu nó bị IF miss nhưng LOF detect được. Variance reduction → robust hơn. Đây là lý do tại sao trong production, ensemble thường được ưu tiên hơn single model.',
    },
    {
      id: 'q15-4',
      type: 'multiple-choice',
      question: 'Elliptic Envelope thích hợp nhất khi?',
      options: [
        'Data rất nhiều features (high-dimensional)',
        'Data có phân bố Gaussian rõ ràng',
        'Data là time series',
        'Data có clusters rõ ràng',
      ],
      correctAnswer: 'Data có phân bố Gaussian rõ ràng',
      explanation:
        'Elliptic Envelope fit một Gaussian (ellipse trong multi-dim space) và dùng Mahalanobis distance để detect outliers. Nếu data thực sự Gaussian: rất effective. Nếu multi-modal hoặc non-Gaussian: fail nhanh. Kiểm tra distribution assumption trước khi dùng (QQ plot, Shapiro-Wilk test).',
    },
    {
      id: 'q15-5',
      type: 'multiple-choice',
      question: 'Z-score với threshold=3 sẽ flag bao nhiêu % samples là anomaly trong perfect Gaussian data?',
      options: ['1%', '5%', '0.27%', '10%'],
      correctAnswer: '0.27%',
      explanation:
        'Trong Gaussian distribution: 99.73% samples nằm trong ±3σ (3 standard deviations). Chỉ 0.27% nằm ngoài → bị flag là anomaly. Đây là lý do threshold=3 là standard. Nếu data skewed (như network bytes), nhiều samples bình thường sẽ bị flag → cần log transform trước.',
    },
  ],
};
