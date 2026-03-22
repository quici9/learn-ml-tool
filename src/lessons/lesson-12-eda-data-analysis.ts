import type { Lesson } from '../types/lesson';

export const lesson12: Lesson = {
  id: '12-eda-data-analysis',
  number: 12,
  title: 'EDA & Data Analysis',
  description: 'Khám phá dữ liệu: distribution, correlation, missing values trước khi train',
  phase: 'phase-4',
  estimatedTime: '2-3 ngày',
  prerequisites: ['11-mlops-practices'],

  sections: [
    /* ───── 1. EDA là gì? ───── */
    {
      id: 'eda-intro',
      title: '1. EDA là gì và tại sao quan trọng?',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          '**EDA (Exploratory Data Analysis)** là bước khám phá dữ liệu trước khi train model. Đây là bước thường bị bỏ qua nhất — và cũng là nguyên nhân số 1 gây ra model kém.',
          'Nguyên tắc vàng: **"Garbage in, garbage out"**. Dữ liệu xấu → model xấu, dù dùng algorithm nào. EDA giúp phát hiện vấn đề sớm khi còn rẻ để sửa.',
          'Trong security ML: EDA trả lời các câu hỏi quan trọng — Features nào thực sự discriminative? Data có imbalanced không? Có outliers do lỗi logging hay anomaly thật? Distribution có bị drift so với production không?',
        ],
        highlights: [
          {
            type: 'warning',
            text: 'Không EDA → chọn sai features → model học "noise" thay vì "signal" → False Positive cao, False Negative cao.',
          },
        ],
      },
    },

    /* ───── 2. EDA Workflow ───── */
    {
      id: 'eda-workflow',
      title: 'EDA Workflow',
      type: 'comparison-table',
      content: {
        kind: 'comparison-table',
        headers: ['Bước', 'Câu hỏi cần trả lời', 'Tool'],
        rows: [
          ['1. Shape & Types', 'Có bao nhiêu rows/columns? Kiểu dữ liệu mỗi cột?', 'df.info(), df.shape'],
          ['2. Missing Values', 'Cột nào thiếu dữ liệu? Bao nhiêu %?', 'df.isnull().sum()'],
          ['3. Distribution', 'Feature có phân bố bình thường không? Có skewed?', 'df.describe(), histogram'],
          ['4. Outliers', 'Giá trị cực đoan từ lỗi hay anomaly thật?', 'Boxplot, IQR'],
          ['5. Correlation', 'Features nào có liên quan với nhau? Multicollinearity?', 'df.corr(), heatmap'],
          ['6. Class Balance', 'Bao nhiêu % anomaly vs normal?', 'value_counts()'],
          ['7. Feature Importance', 'Feature nào nhiều thông tin nhất?', 'Mutual info, variance'],
        ],
        caption: 'EDA không cần theo thứ tự cứng nhắc — thường là vòng lặp lặp lại',
      },
    },

    /* ───── 3. Shape & Basic Stats ───── */
    {
      id: 'basic-stats',
      title: '2. Basic Statistics — Bức tranh tổng quan',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'eda_basic.py',
        description: 'Bước đầu tiên của EDA — hiểu shape, types, và basic statistics',
        code: `import pandas as pd
import numpy as np

# Load Zeek conn.log (đã parse thành DataFrame)
df = pd.read_parquet("zeek_conn_features.parquet")

# 1. Shape và kiểu dữ liệu
print(f"Shape: {df.shape}")       # (rows, cols)
print(df.info())                   # dtypes + non-null counts
print(df.dtypes.value_counts())    # summary kiểu dữ liệu

# 2. Basic statistics — numeric features
print(df.describe())
# >> count: bao nhiêu giá trị non-null
# >> mean/std: trung bình và độ lệch chuẩn
# >> min/max: phát hiện outliers ngay
# >> 25%/50%/75%: phân vị

# 3. Nếu có cột label
if 'label' in df.columns:
    print("\\nClass distribution:")
    print(df['label'].value_counts())
    print(df['label'].value_counts(normalize=True).round(3))
    # >> normal     0.987   → 98.7% bình thường
    # >> anomaly    0.013   → 1.3% anomaly — IMBALANCED!`,
        output: `Shape: (50000, 15)
<class 'pandas.core.frame.DataFrame'>
 #   Column              Non-Null Count  Dtype  
 0   connection_count    50000 non-null  int64  
 1   unique_dest_ips     50000 non-null  int64  
 ...

Class distribution:
normal     49350
anomaly      650
normal     0.987
anomaly    0.013`,
      },
    },

    /* ───── 4. Missing Values ───── */
    {
      id: 'missing-values',
      title: '3. Missing Values — Phát hiện và xử lý',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'eda_missing.py',
        description: 'Missing values trong network data thường do logs bị truncate hoặc connection timeout',
        code: `import pandas as pd
import numpy as np

# Phát hiện missing values
missing = df.isnull().sum()
missing_pct = (missing / len(df) * 100).round(2)

missing_report = pd.DataFrame({
    'count': missing,
    'percentage': missing_pct,
}).sort_values('percentage', ascending=False)

print(missing_report[missing_report['count'] > 0])

# Chiến lược xử lý theo ngữ cảnh
# 1. Drop column nếu > 50% missing
cols_to_drop = missing_report[missing_report['percentage'] > 50].index
df = df.drop(columns=cols_to_drop)
print(f"Dropped {len(cols_to_drop)} columns: {list(cols_to_drop)}")

# 2. Fill với median thay vì mean — robust hơn với outliers
numeric_cols = df.select_dtypes(include=[np.number]).columns
df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())

# 3. Fill categorical với mode (giá trị phổ biến nhất)
cat_cols = df.select_dtypes(include=['object']).columns
for col in cat_cols:
    df[col] = df[col].fillna(df[col].mode()[0])

# 4. Trong Zeek: missing bytes thường = 0 (connection bị drop)
df['resp_bytes'] = df['resp_bytes'].fillna(0)
df['orig_bytes'] = df['orig_bytes'].fillna(0)

print(f"Missing values sau xử lý: {df.isnull().sum().sum()}")`,
        output: `                  count  percentage
avg_duration       2341        4.68
resp_bytes          891        1.78
bytes_ratio         891        1.78

Dropped 0 columns: []
Missing values sau xử lý: 0`,
      },
    },

    /* ───── 5. Distribution Analysis ───── */
    {
      id: 'distribution',
      title: '4. Distribution Analysis — Hình dạng dữ liệu',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          '**Tại sao distribution quan trọng?** Nhiều ML models (như One-Class SVM, Elliptic Envelope) giả định dữ liệu phân bố Gaussian (chuẩn). Nếu data skewed nặng → model sẽ mắc lỗi hệ thống.',
          '**Skewness** đo mức độ lệch: `0` = cân đối, `>1` hoặc `<-1` = skewed nặng → cân nhắc log transform (`np.log1p()`).',
          '**Kurtosis** đo "đuôi" của phân bố: kurtosis cao → có nhiều outliers cực đoan — quan trọng cho anomaly detection vì anomalies thường nằm ở đuôi.',
          'Trong network data: `total_bytes`, `connection_count`, `duration` thường có **right-skewed** rất nặng — một vài connections chiếm phần lớn traffic. Log transform giúp model học tốt hơn nhiều.',
        ],
        highlights: [
          {
            type: 'tip',
            text: 'Rule of thumb: nếu max/median > 100 → highly skewed → thử log1p transform. Ví dụ: bytes=10MB bình thường nhưng bytes=10GB là rất bất thường.',
          },
        ],
      },
    },

    /* ───── 5b. Distribution Code ───── */
    {
      id: 'distribution-code',
      title: 'Code: Phân tích và xử lý skewed features',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'eda_distribution.py',
        description: 'Phát hiện skewed features và áp dụng log transform',
        code: `import pandas as pd
import numpy as np
from scipy import stats

# Tính skewness cho tất cả numeric features
numeric_df = df.select_dtypes(include=[np.number])
skewness = numeric_df.skew().sort_values(ascending=False)

print("Feature Skewness:")
print(skewness.round(2))

# Highly skewed features (|skew| > 1)
highly_skewed = skewness[abs(skewness) > 1].index.tolist()
print(f"\\nHighly skewed ({len(highly_skewed)}): {highly_skewed}")

# Log transform — thêm 1 tránh log(0)
log_suffix = '_log'
for col in highly_skewed:
    if df[col].min() >= 0:   # chỉ áp dụng cho non-negative
        df[f"{col}{log_suffix}"] = np.log1p(df[col])

# Kiểm tra kết quả
print("\\nBefore vs After log transform:")
example_col = 'total_orig_bytes'
print(f"  {example_col} skew: {df[example_col].skew():.2f}")
print(f"  {example_col}_log skew: {df[f'{example_col}_log'].skew():.2f}")

# Outlier detection bằng IQR
def detect_outliers_iqr(series: pd.Series, k: float = 1.5) -> pd.Series:
    """Trả về boolean mask: True = outlier."""
    q1 = series.quantile(0.25)
    q3 = series.quantile(0.75)
    iqr = q3 - q1
    lower = q1 - k * iqr
    upper = q3 + k * iqr
    return (series < lower) | (series > upper)

outlier_counts = {
    col: detect_outliers_iqr(df[col]).sum()
    for col in numeric_df.columns
}
print("\\nOutlier counts per feature:")
for col, cnt in sorted(outlier_counts.items(), key=lambda x: -x[1])[:5]:
    print(f"  {col}: {cnt} ({cnt/len(df)*100:.1f}%)")`,
        output: `Feature Skewness:
total_orig_bytes     8.92
total_resp_bytes     7.34
connection_count     4.11
avg_duration         2.87
unique_dest_ports    1.23
port_diversity       0.34

Highly skewed (4): ['total_orig_bytes', 'total_resp_bytes', 'connection_count', 'avg_duration']

Before vs After log transform:
  total_orig_bytes skew: 8.92
  total_orig_bytes_log skew: 0.43

Outlier counts per feature:
  total_orig_bytes: 1247 (2.5%)
  total_resp_bytes: 1089 (2.2%)
  connection_count: 823 (1.6%)`,
      },
    },

    /* ───── 6. Correlation Analysis ───── */
    {
      id: 'correlation',
      title: '5. Correlation Analysis — Features liên quan nhau thế nào?',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'eda_correlation.py',
        description: 'Phát hiện multicollinearity và chọn features có ý nghĩa nhất',
        code: `import pandas as pd
import numpy as np

# Pearson correlation matrix
numeric_df = df.select_dtypes(include=[np.number])
corr_matrix = numeric_df.corr()

# Tìm các cặp có correlation cao (> 0.85) — multicollinearity
high_corr_pairs = []
for i in range(len(corr_matrix.columns)):
    for j in range(i + 1, len(corr_matrix.columns)):
        col_i = corr_matrix.columns[i]
        col_j = corr_matrix.columns[j]
        corr_val = corr_matrix.iloc[i, j]
        if abs(corr_val) > 0.85:
            high_corr_pairs.append((col_i, col_j, round(corr_val, 3)))

print("Highly correlated pairs (|r| > 0.85):")
for col1, col2, r in sorted(high_corr_pairs, key=lambda x: -abs(x[2])):
    print(f"  {col1} ↔ {col2}: r={r}")

# Vấn đề: total_orig_bytes và avg_orig_bytes thường tương quan cao
# Giải pháp: giữ 1, bỏ 1
# Ưu tiên feature có variance cao hơn hoặc interpretable hơn

# Mutual Information (không giả định linear relationship)
from sklearn.feature_selection import mutual_info_classif

if 'label' in df.columns:
    y = (df['label'] == 'anomaly').astype(int)
    X = numeric_df.drop(columns=['label'], errors='ignore')

    mi_scores = mutual_info_classif(X, y, random_state=42)
    mi_df = pd.Series(mi_scores, index=X.columns).sort_values(ascending=False)

    print("\\nMutual Information scores (top 8):")
    print(mi_df.head(8).round(4))`,
        output: `Highly correlated pairs (|r| > 0.85):
  total_orig_bytes ↔ avg_orig_bytes: r=0.934
  connection_count ↔ unique_dest_ips: r=0.891

Mutual Information scores (top 8):
port_diversity         0.2341
unique_dest_ports      0.1987
connection_count       0.1654
bytes_ratio            0.1432
avg_duration           0.0987
total_orig_bytes       0.0621
unique_dest_ips        0.0432
std_duration           0.0298`,
      },
    },

    /* ───── 7. EDA Insights Summary ───── */
    {
      id: 'eda-insights',
      title: '6. EDA → Quyết định thiết kế',
      type: 'comparison-table',
      content: {
        kind: 'comparison-table',
        headers: ['Insight từ EDA', 'Hành động', 'Tại sao'],
        rows: [
          ['1.3% anomaly (imbalanced)', 'Dùng recall thay accuracy, SMOTE/class_weight', 'Accuracy 98.7% đạt được chỉ bằng cách predict "normal" hết'],
          ['4 features highly skewed', 'Log1p transform trước khi train', 'Linear models và SVM nhạy cảm với scale'],
          ['total_orig_bytes ↔ avg_orig_bytes r=0.93', 'Bỏ avg_orig_bytes', 'Multicollinearity → model mất ổn định'],
          ['port_diversity MI=0.23 (cao nhất)', 'Ưu tiên feature này, xem xét thêm variants', 'Feature có nhiều thông tin nhất cho task này'],
          ['avg_duration có >4% missing', 'Fillna với median & thêm indicator column', 'Missing không phải ngẫu nhiên — có thể connection bị drop'],
        ],
        caption: 'EDA không chỉ mô tả data — nó ra quyết định cho toàn bộ pipeline phía sau',
      },
    },

    /* ───── 8. Summary ───── */
    {
      id: 'eda-summary',
      title: '7. EDA Checklist trước khi train',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          '✅ **Shape check**: Số rows đủ để train không? (<100 rows là quá ít cho ML)',
          '✅ **Missing values**: Đã xử lý toàn bộ, có documented strategy cho mỗi cột',
          '✅ **Distribution**: Biết features nào skewed, đã transform nếu cần',
          '✅ **Outliers**: Phân biệt được outlier từ lỗi data vs anomaly thật',
          '✅ **Correlation**: Đã remove hoặc ghi chú multicollinear features',
          '✅ **Class balance**: Biết rõ tỉ lệ các classes → chọn đúng metrics',
          '✅ **Feature importance**: Có danh sách top features trước khi train',
        ],
        highlights: [
          {
            type: 'important',
            text: 'EDA không phải optional — đây là điều kiện tiên quyết. Không có EDA → không biết model mình train có ý nghĩa gì.',
          },
        ],
      },
    },
  ],

  quiz: [
    {
      id: 'q12-1',
      type: 'multiple-choice',
      question: 'Dataset anomaly detection có 98.7% "normal" và 1.3% "anomaly". Nếu model predict "normal" cho tất cả, accuracy là bao nhiêu?',
      options: ['1.3%', '50%', '98.7%', '87%'],
      correctAnswer: '98.7%',
      explanation:
        'Đây là cái bẫy của imbalanced data. Accuracy 98.7% nghe có vẻ tốt nhưng model không học được gì — nó bỏ sót 100% anomalies. Vì vậy phải dùng Recall, Precision, F1, PR-AUC thay vì Accuracy.',
    },
    {
      id: 'q12-2',
      type: 'multiple-choice',
      question: 'Tại sao dùng median thay vì mean để fill missing values?',
      options: [
        'Median luôn chính xác hơn mean',
        'Median robust với outliers — outliers ảnh hưởng ít đến median',
        'Mean không thể tính với missing values',
        'Median nhanh hơn mean',
      ],
      correctAnswer: 'Median robust với outliers — outliers ảnh hưởng ít đến median',
      explanation:
        'Network data thường có outliers (connection với bytes rất lớn). Mean sẽ bị kéo lệch bởi outliers. Median (giá trị giữa) ổn định hơn — đây là lý do Isolation Forest cũng dùng median-based splits.',
    },
    {
      id: 'q12-3',
      type: 'multiple-choice',
      question: 'Mutual Information ưu điểm gì so với Pearson Correlation để chọn features?',
      options: [
        'Mutual Information nhanh hơn',
        'Mutual Information capture non-linear relationships, Pearson chỉ linear',
        'Mutual Information không cần train model',
        'Pearson không dùng được với classification',
      ],
      correctAnswer: 'Mutual Information capture non-linear relationships, Pearson chỉ linear',
      explanation:
        'Pearson correlation chỉ đo linear relationship. Nếu feature và label có quan hệ phi tuyến (rất phổ biến trong ML), Pearson sẽ bỏ sót. Mutual Information measure thông tin chung giữa 2 biến bất kể dạng quan hệ.',
    },
    {
      id: 'q12-4',
      type: 'multiple-choice',
      question: 'Feature "total_orig_bytes" có skewness = 8.92. Nên xử lý thế nào?',
      options: [
        'Bỏ feature này vì skewed quá',
        'Áp dụng np.log1p() transform',
        'Chia cho max value (normalize 0-1)',
        'Không cần xử lý, model tự handle',
      ],
      correctAnswer: 'Áp dụng np.log1p() transform',
      explanation:
        'Log transform compressed khoảng giá trị rất rộng (0 → billions) thành khoảng hẹp hơn, giảm skewness. np.log1p() (log(1+x)) an toàn vì tránh log(0). Sau transform skewness giảm từ 8.92 xuống ~0.43.',
    },
    {
      id: 'q12-5',
      type: 'multiple-choice',
      question: 'Hai features có correlation r=0.93. Nên làm gì?',
      options: [
        'Giữ cả hai vì nhiều feature tốt hơn',
        'Bỏ feature có variance thấp hơn để tránh multicollinearity',
        'Cộng hai features lại thành một',
        'Chỉ là vấn đề nếu dùng logistic regression',
      ],
      correctAnswer: 'Bỏ feature có variance thấp hơn để tránh multicollinearity',
      explanation:
        'Multicollinearity (2 features tương quan cao) khiến model mất ổn định và khó interpret. Giữ feature có MORE information (variance cao hơn hoặc MI cao hơn), bỏ còn lại. Exception: tree-based models (IF, RF) ít bị ảnh hưởng hơn linear models.',
    },
  ],
};
