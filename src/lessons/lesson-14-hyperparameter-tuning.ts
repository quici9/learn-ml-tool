import type { Lesson } from '../types/lesson';

export const lesson14: Lesson = {
  id: '14-hyperparameter-tuning',
  number: 14,
  title: 'Hyperparameter Tuning',
  description: 'Grid Search, Random Search, Optuna, Cross-validation đúng cách',
  phase: 'phase-4',
  estimatedTime: '2-3 ngày',
  prerequisites: ['13-data-quality-imbalanced'],

  sections: [
    /* ───── 1. Introduction ───── */
    {
      id: 'hp-intro',
      title: '1. Hyperparameters vs Parameters — Khác nhau thế nào?',
      type: 'comparison-table',
      content: {
        kind: 'comparison-table',
        headers: ['', 'Parameters', 'Hyperparameters'],
        rows: [
          ['Định nghĩa', 'Học được từ training data', 'Cài đặt trước khi train, không học được'],
          ['Ví dụ RF', 'Các splits trong mỗi decision tree', 'n_estimators, max_depth, min_samples_split'],
          ['Ví dụ IF', 'Điểm split isolation tối ưu', 'n_estimators, contamination, max_features'],
          ['Tối ưu bằng', 'Gradient descent/optimization qua training', 'Grid Search, Random Search, Bayesian Opt'],
          ['Thay đổi khi', 'Sau mỗi epoch/iteration khi train', 'Trước khi bắt đầu train'],
          ['Cần validation', 'Không (train set đủ)', 'Cần validation set riêng biệt'],
        ],
        caption: 'Hyperparameters quyết định kiến trúc và hành vi của model — không kém quan trọng hơn algorithm choice',
      },
    },

    /* ───── 2. Cross-Validation First ───── */
    {
      id: 'cv-first',
      title: '2. Cross-Validation — Đánh giá đúng trước khi tune',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          '**Trước khi tune hyperparameters, phải hiểu Cross-Validation (CV).** Nếu chỉ evaluate trên 1 validation split → kết quả may rủi, phụ thuộc vào random split.',
          '**K-Fold CV**: Chia data thành K phần. Train trên K-1 phần, evaluate trên 1 phần còn lại. Lặp K lần. Final score = mean của K scores→ ổn định hơn nhiều.',
          '**Với imbalanced data**: Dùng **StratifiedKFold** để đảm bảo mỗi fold có cùng tỉ lệ class. Random KFold có thể tạo fold không có anomaly nào.',
          '**TimeSeriesSplit**: Nếu data có time dependency (network logs theo thứ tự thời gian) → KHÔNG dùng random KFold (future data leaks into past). Dùng TimeSeriesSplit: train trên quá khứ, validate trên tương lai.',
        ],
        highlights: [
          {
            type: 'important',
            text: 'Với time-series security data: luôn dùng TimeSeriesSplit. Random split có thể train trên traffic ngày mai, validate trên ngày hôm qua → unrealistic high performance.',
          },
        ],
      },
    },

    /* ───── 3. Grid vs Random Search ───── */
    {
      id: 'grid-random',
      title: '3. Grid Search vs Random Search',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'grid_vs_random.py',
        description: 'So sánh Grid Search và Random Search với Stratified CV',
        code: `from sklearn.model_selection import (
    GridSearchCV,
    RandomizedSearchCV,
    StratifiedKFold,
    cross_val_score,
)
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import make_scorer, average_precision_score
import numpy as np

# Scorer custom: PR-AUC (phù hợp với imbalanced)
pr_auc_scorer = make_scorer(
    average_precision_score,
    needs_proba=True,
    pos_label=1,
)

# ─── 1. Grid Search — exhaustive (tốt khi search space nhỏ) ───
param_grid_small = {
    'n_estimators': [100, 200, 300],
    'max_depth': [None, 10, 20],
    'min_samples_split': [2, 5, 10],
    # Total: 3×3×3 = 27 combinations × 5-fold = 135 fits
}

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

grid_search = GridSearchCV(
    RandomForestClassifier(class_weight='balanced', random_state=42),
    param_grid_small,
    scoring=pr_auc_scorer,
    cv=cv,
    n_jobs=-1,          # dùng tất cả CPU cores
    verbose=1,
)
grid_search.fit(X_train, y_train)
print(f"Grid Search best params: {grid_search.best_params_}")
print(f"Grid Search best CV PR-AUC: {grid_search.best_score_:.4f}")

# ─── 2. Random Search — tốt khi search space lớn ───
from scipy.stats import randint, uniform

param_dist_large = {
    'n_estimators': randint(50, 500),           # uniform distribution
    'max_depth': [None] + list(range(5, 50)),
    'min_samples_split': randint(2, 20),
    'min_samples_leaf': randint(1, 10),
    'max_features': ['sqrt', 'log2', None],
    # Grid search không khả thi (quá nhiều combinations)
    # Random search: chỉ test n_iter=50 random combinations
}

random_search = RandomizedSearchCV(
    RandomForestClassifier(class_weight='balanced', random_state=42),
    param_dist_large,
    n_iter=50,           # chỉ test 50 combinations ngẫu nhiên
    scoring=pr_auc_scorer,
    cv=cv,
    n_jobs=-1,
    random_state=42,
    verbose=1,
)
random_search.fit(X_train, y_train)
print(f"\\nRandom Search best params: {random_search.best_params_}")
print(f"Random Search best CV PR-AUC: {random_search.best_score_:.4f}")`,
        output: `Fitting 5 folds for each of 27 candidates...
Grid Search best params: {'max_depth': None, 'min_samples_split': 5, 'n_estimators': 200}
Grid Search best CV PR-AUC: 0.6891

Fitting 5 folds for each of 50 candidates...
Random Search best params: {'max_depth': 23, 'max_features': 'sqrt', 'min_samples_leaf': 2, 'min_samples_split': 7, 'n_estimators': 287}
Random Search best CV PR-AUC: 0.7023`,
      },
    },

    /* ───── 4. Optuna ───── */
    {
      id: 'optuna',
      title: '4. Optuna — Bayesian Optimization (State of the Art)',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          '**Optuna** dùng **Tree-structured Parzen Estimator (TPE)** — thuật toán Bayesian Optimization. Thay vì sample ngẫu nhiên, nó học từ những trials đã chạy để chọn hyperparameters promising hơn cho trial tiếp theo.',
          '**Ưu điểm so với Random Search**: Hiệu quả hơn 5-10x — cùng số trials nhưng tìm được hyperparameters tốt hơn. Đặc biệt quan trọng khi train tốn nhiều thời gian.',
          '**Pruning**: Optuna có thể dừng sớm (prune) các trials mà sau vài epochs đã tỏ ra tệ → tiết kiệm 50-80% thời gian. Không có trong Grid/Random Search.',
          'Optuna cũng hỗ trợ **multi-objective optimization** (tối ưu cả PR-AUC và training time cùng lúc) — rất hữu ích trong production khi cần balance performance với latency.',
        ],
        highlights: [
          {
            type: 'tip',
            text: 'Bắt đầu với Random Search để khám phá search space, sau đó dùng Optuna với best range từ Random Search để fine-tune. Kết hợp 2 phương pháp này thường cho kết quả tốt nhất.',
          },
        ],
      },
    },

    /* ───── 4b. Optuna Code ───── */
    {
      id: 'optuna-code',
      title: 'Code: Optuna với Pruning và Callbacks',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'optuna_tuning.py',
        description: 'Optuna cho Isolation Forest và Random Forest với custom PR-AUC objective',
        code: `import optuna
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.metrics import average_precision_score, make_scorer
import numpy as np

optuna.logging.set_verbosity(optuna.logging.WARNING)  # less verbose

# ─── 1. Define objective function ───
def objective_rf(trial: optuna.Trial) -> float:
    """Objective: maximize PR-AUC."""

    # Define search space
    params = {
        'n_estimators': trial.suggest_int('n_estimators', 50, 500),
        'max_depth': trial.suggest_categorical('max_depth', [None, 10, 20, 30, 50]),
        'min_samples_split': trial.suggest_int('min_samples_split', 2, 20),
        'min_samples_leaf': trial.suggest_int('min_samples_leaf', 1, 10),
        'max_features': trial.suggest_categorical('max_features', ['sqrt', 'log2', None]),
        'class_weight': 'balanced',
        'random_state': 42,
    }

    clf = RandomForestClassifier(**params)
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scorer = make_scorer(average_precision_score, needs_proba=True, pos_label=1)
    scores = cross_val_score(clf, X_train, y_train, cv=cv, scoring=scorer, n_jobs=2)
    return scores.mean()


def objective_isolation_forest(trial: optuna.Trial) -> float:
    """Objective cho unsupervised IF — dùng PR-AUC nếu có labels."""
    params = {
        'n_estimators': trial.suggest_int('n_estimators', 50, 500),
        'max_samples': trial.suggest_categorical('max_samples', ['auto', 128, 256, 512]),
        'contamination': trial.suggest_float('contamination', 0.005, 0.05),
        'max_features': trial.suggest_float('max_features', 0.3, 1.0),
        'random_state': 42,
    }

    iso = IsolationForest(**params)
    iso.fit(X_train_unlabeled)  # unsupervised
    scores = iso.score_samples(X_val_unlabeled)  # anomaly score
    # Evaluate với labeled validation set
    pr_auc = average_precision_score(y_val, -scores)  # lower score = more anomalous
    return pr_auc


# ─── 2. Run optimization ───
study_rf = optuna.create_study(
    direction='maximize',
    study_name='rf_anomaly_detection',
    sampler=optuna.samplers.TPESampler(seed=42),
    pruner=optuna.pruners.MedianPruner(n_startup_trials=10, n_warmup_steps=5),
)

study_rf.optimize(
    objective_rf,
    n_trials=100,
    timeout=3600,       # max 1 hour
    show_progress_bar=True,
)

# ─── 3. Kết quả ───
print(f"Best PR-AUC: {study_rf.best_value:.4f}")
print(f"Best params: {study_rf.best_params}")

# Train final model với best params
best_rf = RandomForestClassifier(
    **study_rf.best_params,
    class_weight='balanced',
    random_state=42,
)
best_rf.fit(X_train, y_train)

# ─── 4. Optuna visualization (export sang DataFrame) ───
import optuna.visualization as vis
df_trials = study_rf.trials_dataframe()
print(f"\\nTrials summary:")
print(df_trials[['number', 'value', 'params_n_estimators']].nlargest(5, 'value'))`,
        output: `[I 2024-01-15 10:23:45] Trial 89 finished with value: 0.7312 and parameters: {'n_estimators': 347, 'max_depth': None, 'min_samples_split': 4, 'min_samples_leaf': 2, 'max_features': 'sqrt'}.

Best PR-AUC: 0.7312
Best params: {'n_estimators': 347, 'max_depth': None, 'min_samples_split': 4, 'min_samples_leaf': 2, 'max_features': 'sqrt'}

Trials summary:
   number   value  params_n_estimators
89   89     0.7312              347
67   67     0.7289              312
91   91     0.7241              398
43   43     0.7198              267
78   78     0.7187              189`,
      },
    },

    /* ───── 5. Time Series CV ───── */
    {
      id: 'timeseries-cv',
      title: '5. TimeSeriesSplit — Cross-Validation cho temporal data',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'timeseries_cv.py',
        description: 'TimeSeriesSplit đúng cho network logs có time dependency',
        code: `from sklearn.model_selection import TimeSeriesSplit
import numpy as np
import pandas as pd

# Giả sử data đã sort theo timestamp
df_sorted = df.sort_values('timestamp')
X = df_sorted.drop(columns=['label', 'timestamp'])
y = df_sorted['label']

# TimeSeriesSplit: luôn train trên past, validate trên future
tscv = TimeSeriesSplit(n_splits=5, gap=0)
# gap=0: validate set bắt đầu ngay sau train set
# gap=1000: skip 1000 samples để avoid leakage từ closely-related events

print("TimeSeriesSplit folds:")
for fold, (train_idx, val_idx) in enumerate(tscv.split(X)):
    print(f"  Fold {fold+1}: train={len(train_idx)}, val={len(val_idx)}")
    print(f"    Train timestamps: {df_sorted.iloc[train_idx]['timestamp'].iloc[[0,-1]].values}")
    print(f"    Val timestamps:   {df_sorted.iloc[val_idx]['timestamp'].iloc[[0,-1]].values}")

# ─── So sánh StratifiedKFold vs TimeSeriesSplit ───
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import average_precision_score

results = {'StratifiedKFold': [], 'TimeSeriesSplit': []}

for cv_name, cv in [('StratifiedKFold', StratifiedKFold(5, shuffle=True, random_state=42)),
                     ('TimeSeriesSplit', TimeSeriesSplit(5))]:
    for train_idx, val_idx in cv.split(X, y):
        clf = RandomForestClassifier(100, class_weight='balanced', random_state=42)
        clf.fit(X.iloc[train_idx], y.iloc[train_idx])
        y_prob = clf.predict_proba(X.iloc[val_idx])[:, 1]
        results[cv_name].append(average_precision_score(y.iloc[val_idx], y_prob))

for cv_name, scores in results.items():
    print(f"\\n{cv_name}:")
    print(f"  PR-AUC per fold: {[f'{s:.3f}' for s in scores]}")
    print(f"  Mean: {np.mean(scores):.4f} ± {np.std(scores):.4f}")`,
        output: `TimeSeriesSplit folds:
  Fold 1: train=8334, val=8334
    Train timestamps: ['2024-01-01T00:00' '2024-01-10T12:34']
    Val timestamps:   ['2024-01-10T12:35' '2024-01-20T08:12']
  Fold 2: train=16668, val=8334
    ...

StratifiedKFold:
  PR-AUC per fold: ['0.743', '0.751', '0.739', '0.762', '0.749']
  Mean: 0.7490 ± 0.0081

TimeSeriesSplit:
  PR-AUC per fold: ['0.721', '0.698', '0.664', '0.643', '0.631']
  Mean: 0.6714 ± 0.0349`,
      },
    },

    /* ───── 6. Summary ───── */
    {
      id: 'hp-summary',
      title: '6. Khi nào dùng phương pháp nào?',
      type: 'comparison-table',
      content: {
        kind: 'comparison-table',
        headers: ['Phương pháp', 'Khi nào dùng', 'Nhược điểm'],
        rows: [
          ['Grid Search', 'Search space nhỏ (<5 params, discrete values), muốn test tất cả', 'Exponential complexity — không scale với search space lớn'],
          ['Random Search', 'Search space lớn, budget trials hạn chế, baseline nhanh', 'Không học từ past trials, có thể bỏ sót regions tốt'],
          ['Optuna (Bayesian)', 'Cần optimal kết quả, train tốn thời gian, production model', 'Setup phức tạp hơn, overhead cho simple problems'],
          ['Manual tuning', 'Có domain expertise để thu hẹp search space', 'Bias, bỏ sót interactions giữa params'],
        ],
        caption: 'Rule of thumb: bắt đầu Random Search → fine-tune bằng Optuna trong khoảng tốt',
      },
    },
  ],

  quiz: [
    {
      id: 'q14-1',
      type: 'multiple-choice',
      question: 'Grid Search với 5 params, mỗi param 4 values, 5-fold CV. Cần bao nhiêu model fits?',
      options: ['100', '400', '4096', '5120'],
      correctAnswer: '5120',
      explanation:
        '4^5 = 1024 parameter combinations × 5 folds = 5120 model fits. Đây là lý do Grid Search không scale khi có nhiều params. Random Search với n_iter=100 chỉ cần 100×5=500 fits.',
    },
    {
      id: 'q14-2',
      type: 'multiple-choice',
      question: 'Tại sao phải dùng TimeSeriesSplit thay vì StratifiedKFold cho network logs?',
      options: [
        'TimeSeriesSplit nhanh hơn',
        'Network logs có time dependency — validate phải trên tương lai so với train',
        'StratifiedKFold không handle được time data',
        'TimeSeriesSplit giữ class balance tốt hơn',
      ],
      correctAnswer: 'Network logs có time dependency — validate phải trên tương lai so với train',
      explanation:
        'Với random split, model có thể train trên logs ngày 15/1, validate trên ngày 10/1. Trong production, không có "future data" lúc train. TimeSeriesSplit đảm bảo train chỉ dùng past data → realistic estimate của production performance.',
    },
    {
      id: 'q14-3',
      type: 'multiple-choice',
      question: 'Optuna tốt hơn Random Search vì?',
      options: [
        'Optuna chạy nhiều trials hơn',
        'Optuna dùng TPE — học từ past trials để chọn promising hyperparameters tiếp theo',
        'Optuna hỗ trợ nhiều algorithms hơn',
        'Optuna không cần cross-validation',
      ],
      correctAnswer: 'Optuna dùng TPE — học từ past trials để chọn promising hyperparameters tiếp theo',
      explanation:
        'Tree-structured Parzen Estimator (TPE) build một probabilistic model của hyperparameter → metric mapping. Dùng model này để propose hyperparameters có probability cao đạt tốt. Random Search sample hoàn toàn ngẫu nhiên, không học gì từ past trials.',
    },
    {
      id: 'q14-4',
      type: 'multiple-choice',
      question: 'Best score từ Cross-Validation = 0.73, nhưng test set score = 0.51. Vấn đề là gì?',
      options: [
        'Model chưa được tune đủ',
        'Data leakage trong CV hoặc overfitting to hyperparameter search',
        'Test set quá nhỏ',
        'Cần thêm features',
      ],
      correctAnswer: 'Data leakage trong CV hoặc overfitting to hyperparameter search',
      explanation:
        'Khoảng cách CV vs test lớn (0.73 vs 0.51) thường chỉ ra: (1) Data leakage — SMOTE trước split, target leakage, (2) Hyperparameter overfitting — test quá nhiều combinations trên cùng validation set, vô tình overfit to validation. Giải pháp: nested CV hoặc holdout set độc lập cho final evaluation.',
    },
    {
      id: 'q14-5',
      type: 'multiple-choice',
      question: 'contamination=0.05 trong Isolation Forest nghĩa là gì khi thực tế anomaly rate là 1%?',
      options: [
        'Không ảnh hưởng vì unsupervised',
        'Model sẽ mark 5% data là anomaly → FPR cao do mark quá nhiều normal là anomaly',
        'Model cần 5% data để train',
        'Model sẽ ignore 5% outliers trong training',
      ],
      correctAnswer: 'Model sẽ mark 5% data là anomaly → FPR cao do mark quá nhiều normal là anomaly',
      explanation:
        'contamination=0.05 nghĩa là IF expect 5% anomalies và sẽ mark 5% samples (có anomaly score thấp nhất) là anomaly. Nếu thực tế chỉ có 1% anomaly, model sẽ over-alert: trong 5% bị mark, 4% thực ra là normal → False Positive Rate cao. Tune contamination = real anomaly rate.',
    },
  ],
};
