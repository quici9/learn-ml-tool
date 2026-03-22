import type { Lesson } from '../types/lesson';

export const lesson02: Lesson = {
  id: '02-pandas-data-processing',
  number: 2,
  title: 'Pandas – Xử lý Dữ liệu',
  description:
    'Làm chủ Pandas để xử lý dữ liệu mạng dạng bảng – kỹ năng cốt lõi trước khi đưa dữ liệu vào ML model',
  phase: 'phase-1',
  estimatedTime: '3-4 ngày',
  prerequisites: ['01-python-fundamentals'],

  sections: [
    /* ───── 1. Pandas là gì ───── */
    {
      id: 'what-is-pandas',
      title: '1. Pandas là gì?',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          '**Pandas** là thư viện xử lý dữ liệu dạng bảng #1 trong Python data science. Nếu bạn đã quen với SQL, Prisma, hoặc Elasticsearch aggregation, Pandas cung cấp API tương đương nhưng linh hoạt hơn nhiều.',
          'Convention: luôn `import pandas as pd`. Pandas xây dựng trên NumPy, cho phép xử lý dữ liệu cực nhanh nhờ vectorized operations.',
          'Trong PT186S, Pandas sẽ được dùng ở ML Engine để **tiền xử lý dữ liệu** từ Elasticsearch trước khi đưa vào model.',
        ],
        highlights: [
          {
            type: 'important',
            text: 'Pandas là bước đầu tiên trong mọi ML pipeline: Raw data → Pandas DataFrame → Feature Engineering → ML Model.',
          },
        ],
      },
    },

    /* ───── 1b. So sánh với các công cụ quen thuộc ───── */
    {
      id: 'pandas-vs-familiar',
      title: 'Pandas ↔ Các công cụ quen thuộc',
      type: 'comparison-table',
      content: {
        kind: 'comparison-table',
        headers: ['Bạn đã biết', 'Pandas tương đương', 'Chức năng'],
        rows: [
          ['SQL: SELECT * FROM table', 'df[["col1", "col2"]]', 'Chọn cột'],
          ['SQL: WHERE condition', 'df[df["col"] > 10]', 'Lọc dòng'],
          ['Prisma: findMany({ where, select })', 'df.query() + column selection', 'Truy vấn'],
          ['ES aggregation', 'df.groupby().agg()', 'Tổng hợp'],
          ['Excel spreadsheet', 'DataFrame', 'Cấu trúc dữ liệu'],
        ],
        caption: 'Pandas mapping với SQL, Prisma, Elasticsearch mà bạn đã quen',
      },
    },

    /* ───── 2. DataFrame & Series ───── */
    {
      id: 'dataframe-series',
      title: '2. DataFrame và Series',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'dataframe_basics.py',
        description:
          'DataFrame = bảng 2 chiều (giống kết quả SQL query), Series = 1 cột dữ liệu. Tạo DataFrame từ list of dicts – giống JSON array từ API.',
        code: `import pandas as pd

# Tạo DataFrame từ list of dicts (giống JSON array từ API)
data = [
    {"source_ip": "10.0.0.1", "dest_ip": "8.8.8.8", "port": 53, "bytes": 120, "protocol": "udp"},
    {"source_ip": "10.0.0.2", "dest_ip": "192.168.1.1", "port": 443, "bytes": 5000, "protocol": "tcp"},
    {"source_ip": "10.0.0.1", "dest_ip": "evil.com", "port": 4444, "bytes": 50000, "protocol": "tcp"},
    {"source_ip": "10.0.0.3", "dest_ip": "8.8.4.4", "port": 53, "bytes": 80, "protocol": "udp"},
    {"source_ip": "10.0.0.1", "dest_ip": "8.8.8.8", "port": 53, "bytes": 150, "protocol": "udp"},
]
df = pd.DataFrame(data)
print(df)

# Series – lấy 1 cột
bytes_col = df["bytes"]
print(f"Mean: {bytes_col.mean()}")   # 11070.0
print(f"Max: {bytes_col.max()}")     # 50000

# Xem nhanh dữ liệu
df.head(3)      # 3 dòng đầu (giống LIMIT 3)
df.shape         # (5, 5) → 5 dòng, 5 cột
df.dtypes        # kiểu dữ liệu mỗi cột
df.describe()    # thống kê: mean, std, min, max, percentiles`,
        output: `   source_ip       dest_ip  port  bytes protocol
0   10.0.0.1       8.8.8.8    53    120      udp
1   10.0.0.2  192.168.1.1   443   5000      tcp
2   10.0.0.1      evil.com  4444  50000      tcp
3   10.0.0.3       8.8.4.4    53     80      udp
4   10.0.0.1       8.8.8.8    53    150      udp
Mean: 11070.0
Max: 50000`,
      },
    },

    /* ───── 3. Đọc dữ liệu ───── */
    {
      id: 'reading-data',
      title: '3. Đọc dữ liệu',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'read_data.py',
        description:
          'Pandas hỗ trợ đọc từ CSV, JSON, Parquet, Excel, SQL, và nhiều format khác. Zeek logs dùng tab separator.',
        code: `import pandas as pd

# === CSV (dùng nhiều nhất với dataset ML) ===
df = pd.read_csv("zeek_conn_log.csv")

# Chỉ đọc một số cột
df = pd.read_csv("zeek_conn_log.csv", usecols=["source_ip", "dest_ip", "bytes"])

# Zeek log dùng tab separator
df = pd.read_csv("conn.log", sep="\\t", comment="#")

# === JSON ===
df = pd.read_json("alerts.json")

# Từ JSON string (giống response API)
json_str = '[{"ip": "10.0.0.1", "score": 0.9}, {"ip": "10.0.0.2", "score": 0.3}]'
df = pd.read_json(json_str)

# === Từ Elasticsearch response ===
es_hits = [
    {"_source": {"source_ip": "10.0.0.1", "bytes": 120}},
    {"_source": {"source_ip": "10.0.0.2", "bytes": 5000}},
]
df = pd.DataFrame([hit["_source"] for hit in es_hits])
print(df)`,
        output: `  source_ip  bytes
0  10.0.0.1    120
1  10.0.0.2   5000`,
      },
    },

    /* ───── 4. Truy vấn & Lọc ───── */
    {
      id: 'querying-filtering',
      title: '4. Truy vấn và lọc dữ liệu',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'query_filter.py',
        description:
          'Lọc dữ liệu trong Pandas giống SQL WHERE. Lưu ý: dùng & (AND) và | (OR) thay vì "and"/"or", và phải bọc điều kiện trong ngoặc ().',
        code: `# Lọc đơn giản (tương đương SQL: WHERE bytes > 1000)
high_traffic = df[df["bytes"] > 1000]

# Nhiều điều kiện (dùng & và |, KHÔNG phải and/or)
suspicious = df[(df["bytes"] > 10000) & (df["port"] == 4444)]
# SQL: WHERE bytes > 10000 AND port = 4444

udp_or_dns = df[(df["protocol"] == "udp") | (df["port"] == 53)]

# isin – giống SQL IN
internal = df[df["source_ip"].isin(["10.0.0.1", "10.0.0.2"])]

# String matching – giống SQL LIKE
evil_connections = df[df["dest_ip"].str.contains("evil")]

# Sắp xếp (ORDER BY)
sorted_df = df.sort_values("bytes", ascending=False)
sorted_df = df.sort_values(["protocol", "bytes"], ascending=[True, False])`,
      },
    },

    /* ───── 4b. So sánh Prisma ↔ Pandas ───── */
    {
      id: 'prisma-vs-pandas',
      title: 'Prisma (NestJS) ↔ Pandas',
      type: 'comparison-table',
      content: {
        kind: 'comparison-table',
        headers: ['Prisma', 'Pandas', 'Chức năng'],
        rows: [
          ['findMany({ where: { bytes: { gt: 1000 } } })', 'df[df["bytes"] > 1000]', 'Lọc WHERE'],
          ['findMany({ select: { sourceIp: true } })', 'df[["source_ip"]]', 'Chọn cột'],
          ['findMany({ orderBy: { bytes: "desc" } })', 'df.sort_values("bytes", ascending=False)', 'Sắp xếp'],
          ['findMany({ take: 10 })', 'df.head(10)', 'Giới hạn dòng'],
        ],
        caption: 'Mapping truy vấn Prisma sang Pandas – cùng logic, khác cú pháp',
      },
    },

    /* ───── 5. Thêm, sửa, xóa cột ───── */
    {
      id: 'column-manipulation',
      title: '5. Thêm, sửa, xóa cột',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'column_ops.py',
        description:
          'Pandas cho phép tạo cột mới từ phép tính, điều kiện logic, hoặc hàm apply. Đây là bước quan trọng trong Feature Engineering.',
        code: `import numpy as np

# Cột tính toán
df["total_bytes"] = df["orig_bytes"] + df["resp_bytes"]

# Cột dựa trên điều kiện (giống ternary)
df["is_large"] = df["bytes"] > 10000

# Cột dựa trên logic phức tạp
df["risk_level"] = df["bytes"].apply(
    lambda b: "high" if b > 10000 else ("medium" if b > 1000 else "low")
)

# Nhiều điều kiện → dùng np.select (gọn hơn nhiều if-else)
conditions = [
    df["bytes"] > 10000,
    df["bytes"] > 1000,
]
choices = ["high", "medium"]
df["risk_level"] = np.select(conditions, choices, default="low")

# Đổi tên cột
df = df.rename(columns={"source_ip": "src_ip", "dest_ip": "dst_ip"})

# Đổi kiểu dữ liệu (int → float cần cho ML)
df["bytes"] = df["bytes"].astype(float)

# Xóa cột
df = df.drop(columns=["unnecessary_column"])`,
      },
    },

    /* ───── 6. GroupBy & Aggregation ───── */
    {
      id: 'groupby-aggregation',
      title: '6. GroupBy và Aggregation',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'groupby_agg.py',
        description:
          'GroupBy + Aggregation là tính năng CỐT LÕI cho Feature Engineering – tính toán thống kê theo nhóm (giống ES aggregation). Kết quả là feature table sẵn sàng cho ML model.',
        code: `# Đếm connections từ mỗi source_ip
# SQL: SELECT source_ip, COUNT(*) FROM df GROUP BY source_ip
connection_counts = df.groupby("source_ip").size()

# Nhiều aggregation cùng lúc (giống ES multi-agg)
stats = df.groupby("source_ip").agg(
    connection_count=("bytes", "count"),         # COUNT(*)
    total_bytes=("bytes", "sum"),                # SUM(bytes)
    avg_bytes=("bytes", "mean"),                 # AVG(bytes)
    max_bytes=("bytes", "max"),                  # MAX(bytes)
    unique_ports=("port", "nunique"),            # COUNT(DISTINCT port)
    unique_destinations=("dest_ip", "nunique"),  # COUNT(DISTINCT dest_ip)
).reset_index()

print(stats)
# Bảng stats chính là FEATURE TABLE
# Mỗi dòng = feature vector của 1 IP → đưa vào Isolation Forest`,
        output: `  source_ip  connection_count  total_bytes    avg_bytes  max_bytes  unique_ports  unique_destinations
0  10.0.0.1                 3        50270  16756.67     50000            2                       2
1  10.0.0.2                 1         5000   5000.00      5000            1                       1
2  10.0.0.3                 1           80     80.00        80            1                       1`,
      },
    },

    /* ───── 6b. So sánh GroupBy ↔ ES Aggregation ───── */
    {
      id: 'groupby-vs-es',
      title: 'GroupBy ↔ Elasticsearch Aggregation',
      type: 'comparison-table',
      content: {
        kind: 'comparison-table',
        headers: ['Elasticsearch (NestJS)', 'Pandas', 'Mô tả'],
        rows: [
          ['terms: { field: "id.orig_h" }', 'df.groupby("source_ip")', 'Nhóm theo field'],
          ['aggs: { sum: { field: "orig_bytes" } }', '.agg(total=("bytes", "sum"))', 'Tổng'],
          ['cardinality: { field: "dest_port" }', '.agg(unique=("port", "nunique"))', 'Count distinct'],
          ['avg: { field: "duration" }', '.agg(avg=("duration", "mean"))', 'Trung bình'],
        ],
        caption: 'Mapping ES aggregation sang Pandas groupby – cùng kết quả, Pandas linh hoạt hơn',
      },
    },

    /* ───── 7. Xử lý dữ liệu thiếu ───── */
    {
      id: 'missing-data',
      title: '7. Xử lý dữ liệu bị thiếu (NaN)',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'handle_missing.py',
        description:
          'Dữ liệu thực tế luôn có giá trị bị thiếu (NaN). ML model KHÔNG chấp nhận NaN → phải xử lý trước khi train.',
        code: `# Kiểm tra dữ liệu thiếu
print(df.isnull().sum())       # đếm NaN mỗi cột

# === Cách 1: Xóa dòng có NaN ===
df_clean = df.dropna()                         # xóa dòng có BẤT KỲ NaN
df_clean = df.dropna(subset=["bytes"])         # chỉ xóa nếu cột "bytes" NaN

# === Cách 2: Điền giá trị thay thế ===
df["duration"] = df["duration"].fillna(0)                    # điền 0
df["service"] = df["service"].fillna("unknown")              # điền string
df["bytes"] = df["bytes"].fillna(df["bytes"].median())       # điền median

# Kiểm tra sạch
assert df.isnull().sum().sum() == 0, "Vẫn còn NaN!"`,
      },
    },

    /* ───── 7b. Quy tắc xử lý NaN ───── */
    {
      id: 'nan-rules',
      title: 'Quy tắc xử lý NaN cho ML',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          'Chọn chiến lược điền NaN phụ thuộc vào **loại cột** và **tỷ lệ missing**:',
        ],
        highlights: [
          {
            type: 'tip',
            text: '**Cột số:** điền `median` (ít bị ảnh hưởng bởi outlier hơn mean).',
          },
          {
            type: 'tip',
            text: '**Cột categorical:** điền `"unknown"` hoặc mode (giá trị phổ biến nhất).',
          },
          {
            type: 'warning',
            text: 'Nếu >50% dữ liệu bị thiếu trong 1 cột → cân nhắc **xóa cả cột** thay vì điền giá trị.',
          },
        ],
      },
    },

    /* ───── 8. Merge & Join ───── */
    {
      id: 'merge-join',
      title: '8. Merge và Join',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'merge_join.py',
        description:
          'Kết hợp dữ liệu từ nhiều nguồn – ví dụ: Zeek conn.log + Suricata alerts. Cú pháp giống SQL JOIN.',
        code: `# Dữ liệu Zeek
zeek_df = pd.DataFrame([
    {"flow_id": "abc1", "source_ip": "10.0.0.1", "bytes": 5000},
    {"flow_id": "abc2", "source_ip": "10.0.0.2", "bytes": 120},
])

# Dữ liệu Suricata alert
suricata_df = pd.DataFrame([
    {"flow_id": "abc1", "alert_signature": "ET MALWARE Command and Control"},
    {"flow_id": "abc3", "alert_signature": "ET SCAN Nmap Scripting Engine"},
])

# INNER JOIN – chỉ lấy dòng match cả 2 bảng
inner = pd.merge(zeek_df, suricata_df, on="flow_id", how="inner")
print(inner)

# LEFT JOIN – lấy tất cả zeek, match suricata nếu có
left = pd.merge(zeek_df, suricata_df, on="flow_id", how="left")
print(left)`,
        output: `# INNER JOIN
  flow_id source_ip  bytes                   alert_signature
0    abc1  10.0.0.1   5000  ET MALWARE Command and Control

# LEFT JOIN
  flow_id source_ip  bytes                   alert_signature
0    abc1  10.0.0.1   5000  ET MALWARE Command and Control
1    abc2  10.0.0.2    120                              NaN`,
      },
    },

    /* ───── 9. Ví dụ thực tế ───── */
    {
      id: 'zeek-analysis',
      title: '9. Ví dụ thực tế: Phân tích Zeek conn.log',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'zeek_analysis_pipeline.py',
        description:
          'Pipeline hoàn chỉnh: tạo dữ liệu giả lập Zeek → khám phá → Feature Engineering theo IP → tạo feature table sẵn sàng cho ML.',
        code: `import pandas as pd
import numpy as np

# === 1. Tạo dữ liệu giả lập Zeek conn.log ===
np.random.seed(42)
NORMAL_COUNT = 950
ANOMALY_COUNT = 50

normal_data = {
    "source_ip": np.random.choice(
        ["10.0.0." + str(i) for i in range(1, 20)], NORMAL_COUNT
    ),
    "dest_ip": np.random.choice(
        ["8.8.8.8", "8.8.4.4", "1.1.1.1", "172.16.0.1"], NORMAL_COUNT
    ),
    "dest_port": np.random.choice([53, 80, 443, 8080], NORMAL_COUNT),
    "protocol": np.random.choice(["tcp", "udp"], NORMAL_COUNT, p=[0.7, 0.3]),
    "duration": np.random.exponential(2.0, NORMAL_COUNT),
    "orig_bytes": np.random.lognormal(6, 1.5, NORMAL_COUNT).astype(int),
    "resp_bytes": np.random.lognormal(7, 1.5, NORMAL_COUNT).astype(int),
    "label": "normal",
}

anomaly_data = {
    "source_ip": np.random.choice(["10.0.0.99", "10.0.0.100"], ANOMALY_COUNT),
    "dest_ip": np.random.choice(["evil-c2.com", "malware-cdn.net"], ANOMALY_COUNT),
    "dest_port": np.random.choice([4444, 5555, 31337, 9999], ANOMALY_COUNT),
    "protocol": ["tcp"] * ANOMALY_COUNT,
    "duration": np.random.exponential(30.0, ANOMALY_COUNT),
    "orig_bytes": np.random.lognormal(10, 2, ANOMALY_COUNT).astype(int),
    "resp_bytes": np.random.lognormal(4, 1, ANOMALY_COUNT).astype(int),
    "label": "anomaly",
}

df = pd.concat(
    [pd.DataFrame(normal_data), pd.DataFrame(anomaly_data)],
    ignore_index=True,
)
df = df.sample(frac=1, random_state=42).reset_index(drop=True)

print(f"Dataset: {df.shape[0]} rows, {df.shape[1]} columns")
print(f"Normal: {(df['label'] == 'normal').sum()}")
print(f"Anomaly: {(df['label'] == 'anomaly').sum()}")

# === 2. Feature Engineering cấp IP ===
features = df.groupby("source_ip").agg(
    connection_count=("dest_ip", "count"),
    unique_dest_ips=("dest_ip", "nunique"),
    unique_dest_ports=("dest_port", "nunique"),
    avg_duration=("duration", "mean"),
    total_orig_bytes=("orig_bytes", "sum"),
    total_resp_bytes=("resp_bytes", "sum"),
    avg_orig_bytes=("orig_bytes", "mean"),
    max_orig_bytes=("orig_bytes", "max"),
).reset_index()

# Tính thêm derived features
features["bytes_ratio"] = features["total_orig_bytes"] / (
    features["total_resp_bytes"] + 1
)
features["port_diversity"] = (
    features["unique_dest_ports"] / features["connection_count"]
)

print("\\n--- Feature Table (sẵn sàng cho ML) ---")
print(features.head(10))

# Lưu ra CSV
features.to_csv("network_features.csv", index=False)`,
        output: `Dataset: 1000 rows, 8 columns
Normal: 950
Anomaly: 50

--- Feature Table (sẵn sàng cho ML) ---
(feature table with 10 columns per IP)`,
      },
    },
  ],

  quiz: [
    {
      id: 'q02-1',
      type: 'multiple-choice',
      question: 'Kiểu dữ liệu nào trong Pandas đại diện cho 1 CỘT dữ liệu?',
      options: ['DataFrame', 'Series', 'Index', 'Array'],
      correctAnswer: 1,
      explanation:
        'Series là cấu trúc 1 chiều (1 cột), còn DataFrame là bảng 2 chiều (nhiều cột). Khi truy cập df["column_name"], kết quả trả về là Series.',
    },
    {
      id: 'q02-2',
      type: 'multiple-choice',
      question:
        'Để lọc DataFrame với nhiều điều kiện, bạn dùng toán tử nào?',
      options: [
        'and / or',
        '&& / ||',
        '& / |',
        'AND / OR',
      ],
      correctAnswer: 2,
      explanation:
        'Pandas dùng & (AND) và | (OR) cho boolean indexing. "and"/"or" của Python không hoạt động với Series. Nhớ bọc mỗi điều kiện trong ngoặc ().',
    },
    {
      id: 'q02-3',
      type: 'multiple-choice',
      question:
        'df.groupby("source_ip")["bytes"].sum() tương đương câu SQL nào?',
      options: [
        'SELECT bytes FROM df WHERE source_ip IS NOT NULL',
        'SELECT source_ip, SUM(bytes) FROM df GROUP BY source_ip',
        'SELECT SUM(bytes) FROM df',
        'SELECT source_ip, COUNT(bytes) FROM df GROUP BY source_ip',
      ],
      correctAnswer: 1,
      explanation:
        'groupby("source_ip") tương đương GROUP BY, ["bytes"].sum() tương đương SUM(bytes). Kết quả là Series với index là source_ip.',
    },
    {
      id: 'q02-4',
      type: 'multiple-choice',
      question:
        'Khi cột số có giá trị NaN, chiến lược điền giá trị nào được KHUYÊN DÙNG cho ML?',
      options: ['Điền 0', 'Điền mean', 'Điền median', 'Xóa cả cột'],
      correctAnswer: 2,
      explanation:
        'Median ít bị ảnh hưởng bởi outlier hơn mean. Ví dụ: bytes = [100, 120, 130, 50000] → mean ≈ 12587 (bị kéo bởi 50000), median = 125 (đại diện hơn).',
    },
    {
      id: 'q02-5',
      type: 'multiple-choice',
      question:
        'pd.merge(df1, df2, on="key", how="left") tương đương loại JOIN nào?',
      options: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'CROSS JOIN'],
      correctAnswer: 1,
      explanation:
        'how="left" giữ TẤT CẢ dòng từ df1 (bảng bên trái) và match với df2. Dòng không match sẽ có NaN ở các cột từ df2.',
    },
  ],
};
