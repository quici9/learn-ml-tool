import type { Lesson } from '../types/lesson';

export const lesson16: Lesson = {
  id: '16-gradient-boosting',
  number: 16,
  title: 'XGBoost & Gradient Boosting',
  description: 'Gradient boosting vs RF, XGBoost vs LightGBM, multi-class classification',
  phase: 'phase-5',
  estimatedTime: '3-4 ngày',
  prerequisites: ['15-model-comparison-unsupervised'],

  sections: [
    /* ───── 1. Boosting vs Bagging ───── */
    {
      id: 'boosting-vs-bagging',
      title: '1. Boosting vs Bagging — Hai triết lý khác nhau',
      type: 'comparison-table',
      content: {
        kind: 'comparison-table',
        headers: ['', 'Bagging (Random Forest)', 'Boosting (XGBoost/GBM)'],
        rows: [
          ['Cơ chế', 'Train N trees độc lập song song, vote kết quả', 'Train trees tuần tự, mỗi tree sửa lỗi của tree trước'],
          ['Trees phụ thuộc nhau?', 'Không — độc lập hoàn toàn', 'Có — tree tiếp theo tập trung vào errors của tree trước'],
          ['Training speed', 'Nhanh — parallel', 'Chậm hơn — sequential'],
          ['Overfitting risk', 'Thấp — variance reduction qua averaging', 'Cao hơn nếu không tune — bias reduction qua boosting'],
          ['Khi data có noise?', 'Tốt — robust với outliers', 'Nhạy cảm — overfits noise'],
          ['Khi data sạch?', 'Tốt', 'Thường tốt hơn RF — higher accuracy'],
          ['Hypertuning cần?', 'Ít (n_estimators lớn, các param khác default OK)', 'Nhiều — lr, n_estimators, max_depth, subsample, colsample'],
        ],
        caption: 'RF: tốt mặc định. XGBoost: potential cao hơn nhưng cần tune nhiều hơn',
      },
    },

    /* ───── 2. Gradient Boosting Intuition ───── */
    {
      id: 'gbm-intuition',
      title: '2. Gradient Boosting — Trực giác toán học',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          '**Ý tưởng cốt lõi**: Mỗi tree mới học để predict **residuals** (lỗi) của ensemble hiện tại, không phải predict target trực tiếp.',
          '**Iteration 1**: Predict mean của y = 0. Residuals = y - 0 = y. Tree 1 học predict residuals này.',
          '**Iteration 2**: Ensemble = tree1 predictions × lr. Tính residuals mới. Tree 2 học predict residuals mới.',
          '**Tiếp tục...**: Mỗi iteration, residuals nhỏ dần → model convergence. Learning rate (lr) nhỏ → convergence chậm hơn nhưng stable hơn.',
          '**Tại sao "Gradient" boosting?**: Residual = âm gradient của loss function (MSE). Nên tổng quát: boosting là gradient descent trong function space, không phải parameter space.',
          '**XGBoost innovations**: (1) Regularization (L1, L2) để tránh overfitting, (2) Second-order derivatives để tính tree splits tốt hơn, (3) Column/row subsampling như RF, (4) Sparse-aware splitting, (5) GPU support.',
        ],
        highlights: [
          {
            type: 'tip',
            text: 'Rule: learning_rate × n_estimators ≈ constant. Lr nhanh (0.1) → ít trees (100). Lr chậm (0.01) → nhiều trees (1000). Thường lr thấp + nhiều trees + early stopping = better generalization.',
          },
        ],
      },
    },

    /* ───── 3. XGBoost vs LightGBM ───── */
    {
      id: 'xgb-vs-lgbm',
      title: '3. XGBoost vs LightGBM vs CatBoost',
      type: 'comparison-table',
      content: {
        kind: 'comparison-table',
        headers: ['', 'XGBoost', 'LightGBM', 'CatBoost'],
        rows: [
          ['Tree growing', 'Level-wise (BFS) — balanced trees', 'Leaf-wise (greedy) — sâu, không balanced', 'Ordered boosting — khác cơ bản'],
          ['Speed', 'Nhanh (với GPU)', 'Nhanh nhất thường — histogram-based', 'Chậm hơn 2 kia trên tabular'],
          ['Memory', 'Moderate', 'Thấp — histogram optimization', 'Moderate-High'],
          ['Categorical features', 'Manual encode', 'Hỗ trợ native với LightGBM', 'Handle native tốt nhất'],
          ['Small/medium data', 'Tốt', 'Có thể overfit', 'Tốt'],
          ['Large data (>1M)', 'Tốt', 'Tốt nhất — fastest', 'OK'],
          ['Community/ecosystem', 'Lớn nhất, mature', 'Active, nhiều benchmarks', 'Microsoft, growing'],
        ],
        caption: 'Security ML: XGBoost là safe default. LightGBM khi data lớn. CatBoost khi nhiều categorical features',
      },
    },

    /* ───── 4. XGBoost với Security Data ───── */
    {
      id: 'xgboost-code',
      title: '4. Code: XGBoost cho Security Anomaly Detection (Supervised)',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'xgboost_security.py',
        description: 'XGBoost pipeline với early stopping, class weights, và proper evaluation',
        code: `import xgboost as xgb
import numpy as np
import pandas as pd
from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import average_precision_score, classification_report

# ─── 1. Chuẩn bị data ───
# Giả sử y: 0=normal, 1=anomaly (có labels từ threat intel)
X_train, X_val, y_train, y_val = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)

# Tính scale_pos_weight — quan trọng cho imbalanced!
# scale_pos_weight = count(negative) / count(positive)
neg_count = (y_train == 0).sum()
pos_count = (y_train == 1).sum()
scale_pos_weight = neg_count / pos_count
print(f"scale_pos_weight: {scale_pos_weight:.1f} (anomaly 1/{scale_pos_weight:.0f})")

# ─── 2. XGBoost Classifier ───
xgb_clf = xgb.XGBClassifier(
    # Core params
    n_estimators=1000,          # nhiều trees với early stopping
    learning_rate=0.05,         # lr thấp → cần nhiều trees
    max_depth=6,                # tree depth — cẩn thận overfitting nếu quá sâu
    min_child_weight=3,         # minimum samples trong leaf — regularization

    # Subsample — như RF
    subsample=0.8,              # 80% samples mỗi tree
    colsample_bytree=0.8,       # 80% features mỗi tree
    colsample_bylevel=0.8,      # 80% features mỗi split level

    # Regularization
    reg_alpha=0.1,              # L1 (Lasso) — sparse features
    reg_lambda=1.0,             # L2 (Ridge) — weight magnitude

    # Imbalanced handling
    scale_pos_weight=scale_pos_weight,  # weight cho positive class

    # Technical
    tree_method='hist',         # histogram-based, nhanh hơn 'exact'
    use_label_encoder=False,
    eval_metric='aucpr',        # PR-AUC là metric evaluate trong training
    random_state=42,
    n_jobs=-1,
)

# ─── 3. Train với Early Stopping ───
xgb_clf.fit(
    X_train, y_train,
    eval_set=[(X_val, y_val)],  # theo dõi validation set
    early_stopping_rounds=50,   # dừng nếu không improve sau 50 rounds
    verbose=100,                # print mỗi 100 rounds
)

print(f"Best iteration: {xgb_clf.best_iteration}")
print(f"Best val PR-AUC: {xgb_clf.best_score:.4f}")

# ─── 4. Evaluate ───
y_prob = xgb_clf.predict_proba(X_test)[:, 1]
pr_auc = average_precision_score(y_test, y_prob)
print(f"\\nTest PR-AUC: {pr_auc:.4f}")

# Threshold tuning để maximize F2
from sklearn.metrics import precision_recall_curve, fbeta_score
precisions, recalls, thresholds = precision_recall_curve(y_test, y_prob)
f2_scores = (5 * precisions * recalls) / (4 * precisions + recalls + 1e-8)
best_threshold = thresholds[f2_scores.argmax()]
print(f"Optimal threshold (F2): {best_threshold:.4f}")

y_pred = (y_prob >= best_threshold).astype(int)
print(classification_report(y_test, y_pred, target_names=['Normal', 'Anomaly']))`,
        output: `scale_pos_weight: 75.8 (anomaly 1/76)

[0]     validation_0-aucpr: 0.4321
[100]   validation_0-aucpr: 0.6891
[200]   validation_0-aucpr: 0.7234
[247]   validation_0-aucpr: 0.7291
[250]   validation_0-aucpr: 0.7289  ← early stopped

Best iteration: 247
Best val PR-AUC: 0.7291

Test PR-AUC: 0.7156
Optimal threshold (F2): 0.3241

              precision    recall  f1-score
Normal          0.998       0.976     0.987
Anomaly         0.632       0.923     0.751`,
      },
    },

    /* ───── 5. Feature Importance ───── */
    {
      id: 'feature-importance',
      title: '5. Feature Importance trong Gradient Boosting',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'xgboost_feature_importance.py',
        description: 'So sánh 3 loại feature importance và khi nào dùng cái nào',
        code: `import xgboost as xgb
import pandas as pd
import numpy as np

feature_names = X_train.columns.tolist()

# ─── 3 types of XGBoost feature importance ───

# 1. Weight: số lần feature được dùng để split
weight_imp = xgb_clf.get_booster().get_score(importance_type='weight')

# 2. Gain: improvement trung bình trong loss khi feature được dùng
gain_imp = xgb_clf.get_booster().get_score(importance_type='gain')

# 3. Cover: số samples bị ảnh hưởng bởi splits của feature
cover_imp = xgb_clf.get_booster().get_score(importance_type='cover')

# So sánh
imp_df = pd.DataFrame({
    'weight': pd.Series(weight_imp),
    'gain': pd.Series(gain_imp),
    'cover': pd.Series(cover_imp),
}).fillna(0)

imp_df['gain_norm'] = imp_df['gain'] / imp_df['gain'].sum()
print("Top 10 Feature Importance by GAIN (most informative):")
print(imp_df.nlargest(10, 'gain_norm')[['gain_norm']].round(4))

# ─── Note ───
# weight: dễ bị biased — low-cardinality features xuất hiện nhiều lần
# gain: thường reliable nhất — measure actual information gain
# cover: tốt cho high-cardinality features

# ─── Alternatively: use permutation importance (most honest) ───
from sklearn.inspection import permutation_importance

perm_imp = permutation_importance(
    xgb_clf, X_test, y_test,
    n_repeats=10, random_state=42,
    scoring='average_precision',  # PR-AUC
    n_jobs=-1,
)

perm_df = pd.DataFrame({
    'feature': feature_names,
    'importance_mean': perm_imp.importances_mean,
    'importance_std': perm_imp.importances_std,
}).sort_values('importance_mean', ascending=False)

print("\\nPermutation Importance (most reliable — measure actual prediction impact):")
print(perm_df.head(10).round(4))`,
        output: `Top 10 Feature Importance by GAIN:
port_diversity         0.2341
unique_dest_ports      0.1876
connection_count       0.1432
bytes_ratio            0.1021
avg_duration           0.0834
total_orig_bytes_log   0.0712
failed_connections     0.0543
...

Permutation Importance:
                feature  importance_mean  importance_std
0     port_diversity          0.0847          0.0023
1  unique_dest_ports          0.0712          0.0019
2   connection_count          0.0634          0.0021
...`,
      },
    },

    /* ───── 6. RF vs XGB khi nào ───── */
    {
      id: 'rf-vs-xgb',
      title: '6. Random Forest vs XGBoost — Khi nào dùng cái nào?',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          '**Random Forest tốt hơn khi**: Data nhỏ (<5k samples), noisy labels, cần train nhanh, không có thời gian tune, hoặc cần model ổn định khi data drift nhẹ.',
          '**XGBoost tốt hơn khi**: Data sạch, có đủ time tuning (Optuna), cần accuracy cao nhất có thể, data medium-large, có GPU.',
          '**Trong anomaly detection thực tế**: Thường dùng cả hai — RF cho unsupervised/semi-supervised contamination estimate, XGBoost cho supervised classification khi có labeled data.',
          '**LightGBM thay thế XGBoost khi**: Data >100k samples, cần train nhanh hơn, có nhiều categorical features.',
        ],
        highlights: [
          {
            type: 'important',
            text: 'XGBoost với labeled security data (threat intel labels) thường đạt PR-AUC cao hơn 10-20% so với unsupervised. Nếu có labels — supervised > unsupervised. Labels có thể đến từ: SIEM rules confirmed, threat intel feeds, analyst verdicts.',
          },
        ],
      },
    },
  ],

  quiz: [
    {
      id: 'q16-1',
      type: 'multiple-choice',
      question: 'XGBoost sequential boosting có gì khác với Random Forest parallel bagging?',
      options: [
        'XGBoost dùng nhiều trees hơn',
        'Mỗi tree trong XGBoost học sửa residuals của trees trước; RF trees độc lập',
        'XGBoost không cần hyperparameter tuning',
        'RF không thể handle categorical features',
      ],
      correctAnswer: 'Mỗi tree trong XGBoost học sửa residuals của trees trước; RF trees độc lập',
      explanation:
        'Boosting: additive model, mỗi weak learner (tree nhỏ) tập trung vào lỗi của ensemble trước → bias reduction. Bagging: average của nhiều independent models → variance reduction. Boosting potential accuracy cao hơn nhưng dễ overfit hơn nếu không dùng early stopping và regularization.',
    },
    {
      id: 'q16-2',
      type: 'multiple-choice',
      question: 'scale_pos_weight trong XGBoost dùng để làm gì với imbalanced data?',
      options: [
        'Scale tất cả features về [0,1]',
        'Tăng cân của positive class (anomaly) để compensate imbalaze',
        'Giảm learning rate',
        'Tự động tạo synthetic samples',
      ],
      correctAnswer: 'Tăng cân của positive class (anomaly) để compensate imbalaze',
      explanation:
        'scale_pos_weight = n_negative / n_positive. Với 100 anomaly và 7600 normal: scale_pos_weight = 76. Mỗi anomaly sample được weight 76x trong loss computation → model buộc phải care về anomaly nhiều hơn. Tương đương với class_weight="balanced" trong sklearn.',
    },
    {
      id: 'q16-3',
      type: 'multiple-choice',
      question: 'Early stopping trong XGBoost với early_stopping_rounds=50 có nghĩa là?',
      options: [
        'Dừng sau 50 rounds',
        'Dừng nếu validation metric không improve trong 50 rounds liên tiếp',
        'Dừng nếu training loss < 0.05',
        'Chỉ train 50 rounds',
      ],
      correctAnswer: 'Dừng nếu validation metric không improve trong 50 rounds liên tiếp',
      explanation:
        'Early stopping theo dõi validation metric (eval_set). Nếu sau 50 rounds không có improvement → model bắt đầu overfit → stop. Restore model tại round tốt nhất. Giúp tránh overfitting mà không cần biết số trees tối ưu trước. Kết hợp n_estimators lớn + early stopping là best practice.',
    },
    {
      id: 'q16-4',
      type: 'multiple-choice',
      question: 'Feature importance type nào đáng tin cậy nhất để hiểu model?',
      options: [
        'Weight (số lần split)',
        'Gain (improvement trong loss)',
        'Permutation importance',
        'Cover (samples affected)',
      ],
      correctAnswer: 'Permutation importance',
      explanation:
        'Permutation importance: randomly permute một feature, đo sự giảm performance. Nếu feature quan trọng → permute → performance giảm nhiều. Honest nhất vì measure actual impact on prediction, không bị biased bởi cardinality hay number of splits. Nhược điểm: chậm hơn (cần nhiều predictions).',
    },
    {
      id: 'q16-5',
      type: 'multiple-choice',
      question: 'Khi nào nên chọn LightGBM thay vì XGBoost?',
      options: [
        'Khi data nhỏ (<1000 samples)',
        'Khi data lớn (>100k samples) và cần train nhanh',
        'Khi không có GPU',
        'Khi muốn model đơn giản hơn',
      ],
      correctAnswer: 'Khi data lớn (>100k samples) và cần train nhanh',
      explanation:
        'LightGBM dùng histogram-based algorithm và leaf-wise tree growth → faster training, lower memory. Với data lớn, LightGBM thường 5-10x nhanh hơn XGBoost. Nhược điểm: leaf-wise growth có thể overfit với data nhỏ → cần tune max_depth và num_leaves cẩn thận hơn.',
    },
  ],
};
