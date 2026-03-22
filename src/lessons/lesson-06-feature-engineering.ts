import type { Lesson } from '../types/lesson';

export const lesson06: Lesson = {
  id: '06-network-feature-engineering',
  number: 6,
  title: 'Feature Engineering',
  description:
    'Zeek conn.log features, encoding, IP aggregation, time-window',
  phase: 'phase-2',
  estimatedTime: '3-4 ngày',
  prerequisites: ['05-sklearn-anomaly-detection'],

  sections: [
    /* ───── 1. Feature Engineering là gì? ───── */
    {
      id: 'what-is-fe',
      title: '1. Feature Engineering là gì?',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          'Feature Engineering là quá trình **chuyển dữ liệu thô thành các con số có ý nghĩa** để ML model học. Đây là bước quan trọng nhất — model tốt nhất cũng vô dụng nếu features tệ.',
          'Ví dụ: Zeek conn.log ghi `source_ip=10.0.0.1, dest_port=53, duration=0.02, bytes=50`. Model không hiểu IP "10.0.0.1" nghĩa gì → phải tính **hành vi** của IP đó: connection_count, unique_ports, avg_duration...',
          '**Quy tắc vàng:** 80% chất lượng model đến từ Feature Engineering. Code ML chỉ chiếm 20% effort.',
        ],
        highlights: [
          {
            type: 'important',
            text: 'Không bao giờ đưa raw IP vào model! Model không hiểu "10.0.0.1" là gì. Thay vào đó, tính hành vi: connection_count, bytes_ratio, port_diversity.',
          },
        ],
      },
    },

    /* ───── 2. Cấu trúc Zeek conn.log ───── */
    {
      id: 'zeek-conn-log',
      title: '2. Cấu trúc Zeek conn.log',
      type: 'comparison-table',
      content: {
        kind: 'comparison-table',
        headers: ['Trường', 'Giải thích', 'Ví dụ', 'Dùng cho ML?'],
        rows: [
          ['ts', 'Timestamp', '1709285400.123', '✅ Time-window'],
          ['uid', 'Connection ID', 'CHhAvVGS1DHFjwGM9', '❌ Identifier'],
          ['id.orig_h', 'Source IP', '10.0.0.1', '✅ Aggregation'],
          ['id.orig_p', 'Source port', '52431', '⚠️ Ít ý nghĩa'],
          ['id.resp_h', 'Destination IP', '8.8.8.8', '✅ Aggregation'],
          ['id.resp_p', 'Destination port', '53', '✅ Trực tiếp + encoding'],
          ['proto', 'Protocol', 'tcp/udp', '✅ Encoding'],
          ['service', 'Dịch vụ', 'dns/http/ssl', '✅ Encoding'],
          ['duration', 'Thời gian (giây)', '0.023', '✅ Trực tiếp'],
          ['orig_bytes', 'Bytes gửi', '1024', '✅ Trực tiếp'],
          ['resp_bytes', 'Bytes nhận', '4096', '✅ Trực tiếp'],
          ['conn_state', 'Trạng thái kết nối', 'SF/S0/REJ', '✅ Encoding'],
        ],
        caption:
          'Zeek conn.log fields — những trường ✅ sẽ được chuyển thành features cho ML',
      },
    },

    /* ───── 2b. conn_state giải thích ───── */
    {
      id: 'conn-state',
      title: 'Connection State — Cực kỳ quan trọng',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          '**SF** = Bình thường (connection established, finished properly).',
          '**S0** = Chỉ có SYN, không reply → **dấu hiệu port scan** (gửi SYN đến hàng trăm port, không đợi response).',
          '**REJ** = Connection bị reject. **S1** = SYN + SYN-ACK (connection established). **RSTR** = Responder gửi RST (reset).',
          'Tỷ lệ S0 cao cho 1 IP = cực kỳ đáng ngờ → đây là feature quan trọng: `s0_ratio`.',
        ],
        highlights: [
          {
            type: 'warning',
            text: 'IP có s0_ratio > 0.5 (hơn 50% connections là S0) = gần như chắc chắn đang scan mạng.',
          },
        ],
      },
    },

    /* ───── 3. Numerical Features ───── */
    {
      id: 'numerical-features',
      title: '3. Numerical Features — Dùng trực tiếp',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'numerical_features.py',
        description:
          'Các trường số dùng trực tiếp — chỉ cần xử lý NaN và tạo features phái sinh',
        code: `import pandas as pd

# Giả lập Zeek conn.log data
df = pd.DataFrame({
    "source_ip": ["10.0.0.1"] * 4 + ["10.0.0.99"] * 3,
    "duration":   [0.02, 1.5, 0.01, 2.3,  120.0, 60.5, 90.2],
    "orig_bytes": [50, 1024, 45, 2048,  500000, 200000, 350000],
    "resp_bytes": [120, 4096, 100, 8192, 500, 200, 100],
})

# Xử lý NaN
df["duration"] = df["duration"].fillna(0)
df["orig_bytes"] = df["orig_bytes"].fillna(0)

# Features phái sinh — RẤT QUAN TRỌNG
df["total_bytes"] = df["orig_bytes"] + df["resp_bytes"]
df["bytes_ratio"] = df["orig_bytes"] / (df["resp_bytes"] + 1)

print(df[["source_ip", "duration", "total_bytes", "bytes_ratio"]])`,
        output: `  source_ip  duration  total_bytes  bytes_ratio
0   10.0.0.1      0.02          170     0.413
1   10.0.0.1      1.50         5120     0.250
2   10.0.0.1      0.01          145     0.446
3   10.0.0.1      2.30        10240     0.250
4  10.0.0.99    120.00       500500   999.002
5  10.0.0.99     60.50       200200   995.025
6  10.0.0.99     90.20       350100  3465.347`,
      },
    },

    /* ───── 3b. Ý nghĩa features ───── */
    {
      id: 'feature-meanings',
      title: 'Ý nghĩa các Numerical Features',
      type: 'comparison-table',
      content: {
        kind: 'comparison-table',
        headers: ['Feature', 'Giá trị bình thường', 'Giá trị bất thường', 'Dấu hiệu'],
        rows: [
          ['duration', '0.01–10s', '> 100s', 'C2 beacon (kết nối duy trì lâu)'],
          ['orig_bytes cao + resp_bytes thấp', 'Cân bằng', 'orig >> resp', 'Data exfiltration'],
          ['bytes_ratio >> 1', '0.1–2.0', '> 10', 'Gửi nhiều hơn nhận → đáng ngờ'],
          ['total_bytes', '< 100KB', '> 1MB', 'Large data transfer'],
        ],
        caption: 'Hướng dẫn đọc feature values để phát hiện anomaly',
      },
    },

    /* ───── 4. Categorical Features ───── */
    {
      id: 'categorical-encoding',
      title: '4. Categorical Features — Encoding',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'encoding.py',
        description:
          'ML model chỉ hiểu số — phải chuyển text thành số bằng encoding',
        code: `import pandas as pd

df = pd.DataFrame({
    "protocol":  ["udp", "tcp", "udp", "tcp", "tcp"],
    "service":   ["dns", "ssl", "dns", "http", "-"],
    "dest_port": [53, 443, 53, 80, 4444],
    "conn_state": ["SF", "SF", "SF", "S0", "S1"],
})

# 1. One-Hot Encoding: tcp/udp → 2 cột binary
proto_encoded = pd.get_dummies(df["protocol"], prefix="proto")
print("One-Hot Encoding protocol:")
print(proto_encoded)

# 2. Port Range: phân loại port thay vì dùng raw number
def encode_port_range(port: int) -> int:
    if port <= 1023: return 0    # Well-known
    elif port <= 49151: return 1  # Registered
    else: return 2               # Dynamic
df["port_cat"] = df["dest_port"].apply(encode_port_range)

# 3. Service: known vs unknown
KNOWN = ["dns", "http", "ssl", "ftp", "ssh", "smtp"]
df["has_known_svc"] = df["service"].isin(KNOWN).astype(int)

print(f"\\nPort categories: {df['port_cat'].tolist()}")
print(f"Known service:   {df['has_known_svc'].tolist()}")`,
        output: `One-Hot Encoding protocol:
   proto_tcp  proto_udp
0      False       True
1       True      False
2      False       True
3       True      False
4       True      False

Port categories: [0, 0, 0, 0, 1]
Known service:   [1, 1, 1, 1, 0]`,
      },
    },

    /* ───── 5. IP Aggregation Features ───── */
    {
      id: 'ip-aggregation',
      title: '5. IP Aggregation Features — Hành vi của IP',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'ip_aggregation.py',
        description:
          'KHÔNG đưa raw IP vào model. Tính hành vi mỗi IP bằng groupby + agg',
        code: `import pandas as pd

df = pd.DataFrame({
    "source_ip": ["10.0.0.1"]*5 + ["10.0.0.99"]*3,
    "dest_ip":   ["8.8.8.8","8.8.8.8","1.1.1.1","8.8.4.4","172.16.0.1",
                  "evil.com","c2.bad","malware.net"],
    "dest_port": [53, 443, 53, 80, 8080, 4444, 5555, 31337],
    "duration":  [0.02, 1.5, 0.01, 2.3, 0.8, 120.0, 60.5, 90.2],
    "orig_bytes":[50, 1024, 45, 2048, 512, 500000, 200000, 350000],
})

# Tính features per IP
ip_features = df.groupby("source_ip").agg(
    conn_count=("dest_ip", "count"),
    unique_dests=("dest_ip", "nunique"),
    unique_ports=("dest_port", "nunique"),
    avg_duration=("duration", "mean"),
    max_duration=("duration", "max"),
    total_bytes=("orig_bytes", "sum"),
).reset_index()

# Features phái sinh
ip_features["port_diversity"] = (
    ip_features["unique_ports"] / ip_features["conn_count"]
)

print(ip_features.to_string(index=False))`,
        output: ` source_ip  conn_count  unique_dests  unique_ports  avg_duration  max_duration  total_bytes  port_diversity
  10.0.0.1           5             4             4         0.926          2.30         3679            0.80
 10.0.0.99           3             3             3        90.233        120.00      1050000            1.00`,
      },
    },

    /* ───── 5b. Feature importance chart (interactive) ───── */
    {
      id: 'feature-importance-chart',
      title: 'Feature Importance — Ảnh hưởng đến model',
      type: 'interactive',
      content: {
        kind: 'interactive',
        component: 'FeatureImportanceChart',
        description:
          'Biểu đồ hiển thị độ quan trọng của từng feature trong việc phát hiện anomaly.',
        props: {
          features: [
            { name: 'bytes_ratio', importance: 0.25, category: 'derived' },
            { name: 'connection_count', importance: 0.18, category: 'aggregation' },
            { name: 'port_diversity', importance: 0.15, category: 'derived' },
            { name: 'avg_duration', importance: 0.12, category: 'aggregation' },
            { name: 's0_ratio', importance: 0.10, category: 'encoding' },
            { name: 'unique_dest_ports', importance: 0.08, category: 'aggregation' },
            { name: 'total_orig_bytes', importance: 0.05, category: 'numerical' },
            { name: 'has_unknown_svc', importance: 0.04, category: 'encoding' },
            { name: 'max_duration', importance: 0.03, category: 'aggregation' },
          ],
        },
      },
    },

    /* ───── 6. Time-window Features ───── */
    {
      id: 'time-window',
      title: '6. Time-window Features',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          'Chia dữ liệu theo **cửa sổ thời gian** (5 phút) để phát hiện spike traffic:',
          '**Window 5 phút:** Đếm connections, unique sources, total bytes. So sánh với baseline (trung bình ± 2σ) → nếu vượt = bất thường.',
          '**Sliding window (PT186S):** Mỗi 5 phút, phân tích 15 phút gần nhất. Overlap giúp phát hiện anomaly liên tục mà không bỏ sót.',
          'Trong production: dùng Elasticsearch time range query thay vì pandas.',
        ],
        highlights: [
          {
            type: 'info',
            text: 'connections_per_window > mean + 2σ → spike traffic → có thể DDoS. PT186S sẽ dùng sliding window 15 phút, slide mỗi 5 phút.',
          },
        ],
      },
    },

    /* ───── 7. Dấu hiệu từng loại tấn công ───── */
    {
      id: 'attack-signatures',
      title: '7. Dấu hiệu từng loại tấn công',
      type: 'comparison-table',
      content: {
        kind: 'comparison-table',
        headers: ['Loại tấn công', 'Feature đặc trưng', 'Giá trị bất thường', 'Mức độ'],
        rows: [
          ['🔍 Port Scan', 'unique_dest_ports, port_diversity', '> 50 ports, diversity > 0.8', '🟡 Medium'],
          ['💥 DDoS / DoS', 'connection_count, unique_dest_ips', '> 500 conns, dest_ips thấp', '🔴 Critical'],
          ['📡 C2 Beacon', 'std_duration, avg_duration', 'std thấp (interval đều), avg > 100s', '🔴 Critical'],
          ['📤 Data Exfiltration', 'bytes_ratio, total_orig_bytes', 'ratio > 10, orig > 1MB', '🔴 Critical'],
          ['🕵️ DNS Tunneling', 'DNS queries count, orig_bytes/query', '> 200 bytes/query, port 53', '🟠 High'],
        ],
        caption:
          'Bảng tra nhanh: feature values nào dẫn đến loại tấn công nào',
      },
    },

    /* ───── 8. Pipeline hoàn chỉnh ───── */
    {
      id: 'full-pipeline',
      title: '8. Feature Engineering Pipeline hoàn chỉnh',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'feature_pipeline.py',
        description:
          'Pipeline hoàn chỉnh: Raw Zeek records → Feature matrix sẵn sàng cho Isolation Forest',
        code: `import pandas as pd
import numpy as np

FEATURE_COLUMNS = [
    "connection_count", "unique_dest_ips", "unique_dest_ports",
    "avg_duration", "max_duration", "std_duration",
    "total_orig_bytes", "total_resp_bytes", "avg_orig_bytes",
    "bytes_ratio", "port_diversity",
    "has_unknown_service_ratio", "s0_ratio",
]

def extract_features(raw_records: list[dict]) -> pd.DataFrame:
    """Raw Zeek records → feature table per source_ip."""
    df = pd.DataFrame(raw_records)

    # Handle missing values
    df["duration"] = df["duration"].fillna(0)
    df["orig_bytes"] = df["orig_bytes"].fillna(0)
    df["resp_bytes"] = df["resp_bytes"].fillna(0)

    # Helper columns
    df["is_unknown"] = (df["service"] == "-").astype(int)
    df["is_s0"] = (df["conn_state"] == "S0").astype(int)

    # Aggregate per IP
    features = df.groupby("source_ip").agg(
        connection_count=("dest_ip", "count"),
        unique_dest_ips=("dest_ip", "nunique"),
        unique_dest_ports=("dest_port", "nunique"),
        avg_duration=("duration", "mean"),
        max_duration=("duration", "max"),
        std_duration=("duration", "std"),
        total_orig_bytes=("orig_bytes", "sum"),
        total_resp_bytes=("resp_bytes", "sum"),
        avg_orig_bytes=("orig_bytes", "mean"),
        has_unknown_service_ratio=("is_unknown", "mean"),
        s0_ratio=("is_s0", "mean"),
    ).reset_index()

    # Derived features
    features["bytes_ratio"] = (
        features["total_orig_bytes"] / (features["total_resp_bytes"] + 1)
    )
    features["port_diversity"] = (
        features["unique_dest_ports"] / features["connection_count"]
    )
    return features.fillna(0)

# Usage
features = extract_features([
    {"source_ip":"10.0.0.1", "dest_ip":"8.8.8.8", "dest_port":53,
     "service":"dns", "duration":0.02, "orig_bytes":50,
     "resp_bytes":120, "conn_state":"SF"},
])
print(f"Feature columns: {len(FEATURE_COLUMNS)}")
print(f"Shape: {features.shape}")`,
        output: 'Feature columns: 13\nShape: (1, 15)',
        isPlayground: true,
        parameters: [
          {
            name: 'n_records',
            label: 'Number of Raw Records',
            type: 'slider',
            min: 1,
            max: 10,
            step: 1,
            defaultValue: 1,
          },
        ],
      },
    },

    /* ───── 9. Tổng kết ───── */
    {
      id: 'summary',
      title: '9. Tổng kết: Feature Engineering Checklist',
      type: 'comparison-table',
      content: {
        kind: 'comparison-table',
        headers: ['Bước', 'Hành động', 'Ví dụ PT186S'],
        rows: [
          ['1. Numerical', 'Dùng trực tiếp + xử lý NaN', 'duration, orig_bytes, resp_bytes'],
          ['2. Derived', 'Tạo features phái sinh', 'bytes_ratio, total_bytes'],
          ['3. Encoding', 'Chuyển categorical → số', 'protocol, conn_state, service'],
          ['4. Aggregation', 'Group by IP → hành vi', 'conn_count, unique_ports'],
          ['5. Time-window', 'Chia theo thời gian', 'connections_per_5min'],
          ['6. Attack-specific', 'Features riêng cho loại attack', 'scan_score, s0_ratio'],
        ],
        caption:
          '6 bước Feature Engineering — áp dụng cho bất kỳ dữ liệu mạng nào',
      },
    },
  ],

  quiz: [
    {
      id: 'q06-1',
      type: 'multiple-choice',
      question:
        'Tại sao KHÔNG nên đưa trực tiếp raw IP (ví dụ: "10.0.0.1") vào ML model?',
      options: [
        'IP quá dài, model không xử lý được',
        'Model không hiểu ý nghĩa của IP — phải tính hành vi (connection_count, bytes_ratio)',
        'IP là dữ liệu nhạy cảm, vi phạm bảo mật',
        'Model chỉ chấp nhận kiểu float',
      ],
      correctAnswer:
        'Model không hiểu ý nghĩa của IP — phải tính hành vi (connection_count, bytes_ratio)',
      explanation:
        'ML model chỉ hiểu con số. IP "10.0.0.1" không có ý nghĩa toán học. Phải chuyển thành hành vi: bao nhiêu connections, sử dụng bao nhiêu ports, transfer bao nhiêu bytes.',
    },
    {
      id: 'q06-2',
      type: 'multiple-choice',
      question: 'conn_state "S0" trong Zeek log nghĩa là gì?',
      options: [
        'Connection hoàn thành bình thường',
        'Chỉ có SYN, không reply — dấu hiệu port scan',
        'Connection bị reject bởi firewall',
        'SSL handshake thành công',
      ],
      correctAnswer:
        'Chỉ có SYN, không reply — dấu hiệu port scan',
      explanation:
        'S0 = chỉ gửi SYN (request kết nối) mà không nhận response. Khi 1 IP gửi hàng trăm SYN đến các port khác nhau → port scan.',
      hint: 'S0 = chỉ bước đầu tiên (SYN) của TCP 3-way handshake.',
    },
    {
      id: 'q06-3',
      type: 'multiple-choice',
      question:
        'bytes_ratio = orig_bytes / resp_bytes rất cao (> 10) gợi ý loại tấn công nào?',
      options: [
        'Port Scan',
        'DDoS/DoS',
        'Data Exfiltration',
        'DNS Tunneling',
      ],
      correctAnswer: 'Data Exfiltration',
      explanation:
        'bytes_ratio >> 1 = gửi nhiều hơn nhận rất nhiều → máy tính đang truyền lượng lớn dữ liệu ra ngoài (data exfiltration). Bình thường, ratio cân bằng (0.1 – 2.0).',
    },
    {
      id: 'q06-4',
      type: 'multiple-choice',
      question: 'One-Hot Encoding dùng cho loại feature nào?',
      options: [
        'Numerical (duration, bytes)',
        'Categorical (protocol, conn_state)',
        'Timestamp',
        'Raw IP address',
      ],
      correctAnswer: 'Categorical (protocol, conn_state)',
      explanation:
        'One-Hot Encoding chuyển categorical values (tcp/udp, SF/S0/REJ) thành binary columns. Mỗi giá trị trở thành 1 cột riêng với giá trị 0/1.',
    },
    {
      id: 'q06-5',
      type: 'compute',
      question:
        'Một IP có connection_count = 100 và unique_dest_ports = 80. Tính port_diversity (làm tròn 1 chữ số)?',
      correctAnswer: 0.8,
      tolerance: 0.05,
      explanation:
        'port_diversity = unique_dest_ports / connection_count = 80 / 100 = 0.8. Giá trị > 0.8 là dấu hiệu port scan (hầu hết connection đến port khác nhau).',
      hint: 'port_diversity = unique_dest_ports / connection_count',
    },
  ],
};
