import type { Lesson } from '../types/lesson';

export const lesson08: Lesson = {
  id: '08-elasticsearch-python-client',
  number: 8,
  title: 'Elasticsearch Python Client',
  description:
    'Kết nối Elasticsearch từ Python – lấy dữ liệu mạng cho ML pipeline',
  phase: 'phase-2',
  estimatedTime: '3-4 ngày',
  prerequisites: ['02-pandas-data-processing', '07-fastapi-ml-engine'],

  sections: [
    /* ───── 1. Architecture Overview ───── */
    {
      id: 'architecture-overview',
      title: '1. Kiến trúc tổng quan',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          'Trong PT186S, **Elasticsearch** là nơi lưu trữ tất cả log mạng (Zeek, Suricata). ML Engine cần **đọc dữ liệu từ ES**, xử lý bằng Pandas, và chạy prediction.',
          'Luồng dữ liệu: **Elasticsearch → Python ES Client → Pandas DataFrame → Feature Engineering → ML Model → Kết quả → NestJS Backend**.',
          'Python ES client (`elasticsearch-py`) cung cấp API tương tự NestJS `@elastic/elasticsearch` – nhưng Pythonic hơn.',
        ],
        highlights: [
          {
            type: 'important',
            text: 'ML Engine KHÔNG ghi dữ liệu vào ES. Chỉ ĐỌC log → xử lý → trả kết quả cho NestJS backend (backend ghi kết quả vào ES).',
          },
        ],
      },
    },

    /* ───── 2. NestJS vs Python Client ───── */
    {
      id: 'nestjs-vs-python',
      title: 'NestJS ↔ Python ES Client',
      type: 'comparison-table',
      content: {
        kind: 'comparison-table',
        headers: ['Tiêu chí', 'NestJS (@elastic/elasticsearch)', 'Python (elasticsearch-py)'],
        rows: [
          ['Install', 'npm i @elastic/elasticsearch', 'pip install elasticsearch'],
          ['Connection', 'new Client({ node: url })', 'Elasticsearch([url])'],
          ['Search', 'client.search({ index, body })', 'client.search(index=, body=)'],
          ['Scroll', 'client.scroll({ scroll_id })', 'client.scroll(scroll_id=)'],
          ['Bulk', 'client.bulk({ body: [...] })', 'helpers.bulk(client, actions)'],
          ['Response', 'hits.hits.map(h => h._source)', 'hits["hits"]["hits"] → list of dict'],
        ],
        caption: 'API gần giống nhau – khác cú pháp JS ↔ Python',
      },
    },

    /* ───── 3. Connection & Config ───── */
    {
      id: 'connection-config',
      title: '2. Kết nối Elasticsearch',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'app/services/es_service.py',
        description:
          'Tạo ES client với authentication, SSL, và retry. Giống ElasticsearchModule.register() trong NestJS.',
        code: `from elasticsearch import Elasticsearch
from app.config import settings

# === Kết nối cơ bản ===
es = Elasticsearch(
    hosts=[settings.ES_HOST],          # "https://localhost:9200"
    basic_auth=(settings.ES_USER, settings.ES_PASSWORD),
    verify_certs=settings.ES_VERIFY_CERTS,
    request_timeout=30,
    max_retries=3,
    retry_on_timeout=True,
)

# === Kiểm tra kết nối ===
if es.ping():
    print("Connected to Elasticsearch!")
    info = es.info()
    print(f"Cluster: {info['cluster_name']}, Version: {info['version']['number']}")
else:
    raise ConnectionError("Cannot connect to Elasticsearch")

# === Giống NestJS ===
# const client = new Client({
#   node: 'https://localhost:9200',
#   auth: { username, password },
# });`,
        output: `Connected to Elasticsearch!
Cluster: pt186s-cluster, Version: 8.12.0`,
      },
    },

    /* ───── 4. Search API ───── */
    {
      id: 'search-api',
      title: '3. Search API – Truy vấn dữ liệu',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'search_examples.py',
        description:
          'Query DSL trong Python giống hệt NestJS – cùng JSON body, chỉ khác cú pháp dict vs object.',
        code: `import pandas as pd
from datetime import datetime, timedelta

# === Bool query – giống NestJS ===
query = {
    "bool": {
        "must": [
            {"range": {"@timestamp": {
                "gte": (datetime.utcnow() - timedelta(hours=1)).isoformat(),
                "lte": datetime.utcnow().isoformat(),
            }}},
            {"term": {"event.dataset": "zeek.conn"}},
        ],
        "must_not": [
            {"term": {"destination.port": 53}},  # Bỏ DNS
        ],
    }
}

# === Thực hiện search ===
response = es.search(
    index="zeek-conn-*",
    query=query,
    size=1000,
    sort=[{"@timestamp": "desc"}],
    _source=["source.ip", "destination.ip", "destination.port",
             "network.bytes", "event.duration"],
)

# === Chuyển thành DataFrame ===
hits = response["hits"]["hits"]
records = [hit["_source"] for hit in hits]
df = pd.DataFrame(records)
print(f"Fetched {len(df)} records")
print(df.head())

# === Aggregation query ===
agg_response = es.search(
    index="zeek-conn-*",
    size=0,  # Không cần hits, chỉ lấy aggregation
    query=query,
    aggs={
        "by_source_ip": {
            "terms": {"field": "source.ip", "size": 100},
            "aggs": {
                "total_bytes": {"sum": {"field": "network.bytes"}},
                "unique_ports": {"cardinality": {"field": "destination.port"}},
            },
        }
    },
)`,
      },
    },

    /* ───── 5. Scroll API ───── */
    {
      id: 'scroll-api',
      title: '4. Scroll API – Xử lý dữ liệu lớn',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'scroll_large_data.py',
        description:
          'Khi cần lấy >10.000 documents, dùng Scroll API hoặc helpers.scan(). Giống cursor trong database.',
        code: `from elasticsearch.helpers import scan
import pandas as pd

def fetch_all_connections(es, index_pattern, time_range_hours=1):
    """Lấy TẤT CẢ connections trong time range bằng scan()"""

    query = {
        "bool": {
            "must": [
                {"range": {"@timestamp": {
                    "gte": f"now-{time_range_hours}h",
                    "lte": "now",
                }}},
            ]
        }
    }

    # scan() tự động scroll – không cần quản lý scroll_id
    # Giống: while (scrollResponse.hits.hits.length) { ... }
    records = []
    for hit in scan(
        es,
        index=index_pattern,
        query={"query": query},
        size=5000,            # batch size mỗi lần scroll
        scroll="2m",          # giữ scroll context 2 phút
        _source=[
            "source.ip", "destination.ip", "destination.port",
            "network.bytes", "event.duration", "network.transport",
        ],
    ):
        records.append(hit["_source"])

    df = pd.DataFrame(records)
    print(f"Total records fetched: {len(df)}")
    return df

# Sử dụng
df = fetch_all_connections(es, "zeek-conn-*", time_range_hours=24)`,
        output: `Total records fetched: 45230`,
      },
    },

    /* ───── 6. Time-Based Patterns ───── */
    {
      id: 'time-based-patterns',
      title: '5. Time-Based Index Patterns',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'time_patterns.py',
        description:
          'Elasticsearch dùng time-based indices (zeek-conn-2024.01.15). Cần build index pattern đúng để query hiệu quả.',
        code: `from datetime import datetime, timedelta

def build_index_pattern(base: str, days_back: int = 7) -> str:
    """Tạo index pattern cho N ngày gần nhất.

    Thay vì query zeek-conn-* (tất cả indices),
    chỉ query indices cần thiết → nhanh hơn nhiều.
    """
    indices = []
    for i in range(days_back):
        date = datetime.utcnow() - timedelta(days=i)
        indices.append(f"{base}-{date.strftime('%Y.%m.%d')}")

    return ",".join(indices)

# Ví dụ: chỉ query 3 ngày gần nhất
index_pattern = build_index_pattern("zeek-conn", days_back=3)
print(index_pattern)
# "zeek-conn-2024.01.15,zeek-conn-2024.01.14,zeek-conn-2024.01.13"

# Query với index pattern cụ thể
response = es.search(index=index_pattern, query={"match_all": {}}, size=100)`,
        output: `zeek-conn-2024.01.15,zeek-conn-2024.01.14,zeek-conn-2024.01.13`,
      },
    },

    /* ───── 7. ML Pipeline Integration ───── */
    {
      id: 'ml-pipeline-integration',
      title: '6. Tích hợp vào ML Pipeline',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'ml_pipeline.py',
        description:
          'Pipeline hoàn chỉnh: ES → Pandas → Feature Engineering → Predict. Đây là core flow của ML Engine.',
        code: `import pandas as pd
import numpy as np
import joblib
from elasticsearch.helpers import scan

class MLPipeline:
    """Pipeline: ES data → Features → Prediction"""

    def __init__(self, es_client, model_path, scaler_path):
        self.es = es_client
        self.model = joblib.load(model_path)
        self.scaler = joblib.load(scaler_path)

    def fetch_data(self, time_range_hours: int = 1) -> pd.DataFrame:
        """Step 1: Lấy raw data từ Elasticsearch"""
        records = []
        for hit in scan(self.es, index="zeek-conn-*", query={
            "query": {"range": {"@timestamp": {"gte": f"now-{time_range_hours}h"}}}
        }):
            records.append(hit["_source"])
        return pd.DataFrame(records)

    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Step 2: Feature Engineering cấp IP"""
        features = df.groupby("source.ip").agg(
            conn_count=("destination.ip", "count"),
            unique_ports=("destination.port", "nunique"),
            avg_duration=("event.duration", "mean"),
            total_bytes=("network.bytes", "sum"),
        ).reset_index()
        features["bytes_ratio"] = (
            features["total_bytes"] / (features["conn_count"] + 1)
        )
        return features

    def predict(self, features: pd.DataFrame) -> pd.DataFrame:
        """Step 3: Chuẩn hóa + Predict"""
        feature_cols = [
            "conn_count", "unique_ports", "avg_duration",
            "total_bytes", "bytes_ratio",
        ]
        X = features[feature_cols].values
        X_scaled = self.scaler.transform(X)

        features["prediction"] = self.model.predict(X_scaled)
        features["score"] = self.model.score_samples(X_scaled)
        features["is_anomaly"] = features["prediction"] == -1
        return features

    def run(self, time_range_hours: int = 1) -> pd.DataFrame:
        """Full pipeline"""
        df = self.fetch_data(time_range_hours)
        features = self.engineer_features(df)
        results = self.predict(features)

        anomalies = results[results["is_anomaly"]]
        print(f"Processed {len(df)} connections → {len(anomalies)} anomalies")
        return results`,
        output: `Processed 12450 connections → 23 anomalies`,
      },
    },
  ],

  quiz: [
    {
      id: 'q08-1',
      type: 'multiple-choice',
      question:
        'Elasticsearch Python client tương đương gì với @elastic/elasticsearch trong NestJS?',
      options: [
        'Hoàn toàn khác API',
        'Cùng Query DSL, khác cú pháp (dict vs object)',
        'Python client không hỗ trợ aggregation',
        'Python client chỉ hỗ trợ search, không hỗ trợ scroll',
      ],
      correctAnswer: 1,
      explanation:
        'Cả hai dùng cùng Elasticsearch Query DSL (JSON). Chỉ khác: Python dùng dict, JavaScript dùng object. Method names cũng giống nhau: .search(), .scroll(), .bulk().',
    },
    {
      id: 'q08-2',
      type: 'multiple-choice',
      question:
        'Khi cần lấy >10.000 documents, dùng phương pháp nào?',
      options: [
        'Tăng size lên 100.000',
        'Dùng Scroll API hoặc helpers.scan()',
        'Dùng nhiều request song song',
        'Không thể lấy quá 10.000',
      ],
      correctAnswer: 1,
      explanation:
        'ES giới hạn size tối đa 10.000. Scroll API duy trì context và lấy từng batch. helpers.scan() wrap Scroll API thành iterator – sử dụng dễ hơn.',
    },
    {
      id: 'q08-3',
      type: 'multiple-choice',
      question:
        'Tại sao nên dùng time-based index pattern cụ thể thay vì wildcard (*)?',
      options: [
        'Wildcard không hoạt động',
        'Query cụ thể indices → nhanh hơn, ít tài nguyên hơn',
        'Để tránh lỗi authentication',
        'ES không hỗ trợ wildcard',
      ],
      correctAnswer: 1,
      explanation:
        'zeek-conn-* query TẤT CẢ indices (có thể hàng trăm). Chỉ query 3-7 ngày gần nhất giảm đáng kể thời gian search và tải trên cluster.',
    },
    {
      id: 'q08-4',
      type: 'multiple-choice',
      question:
        'Trong ML Pipeline, bước nào chuyển đổi ES response thành format ML model cần?',
      options: [
        'fetch_data() – lấy raw data',
        'engineer_features() – groupby + aggregation',
        'predict() – chạy model',
        'run() – orchestrate tất cả',
      ],
      correctAnswer: 1,
      explanation:
        'engineer_features() chuyển raw connections (nhiều dòng per IP) thành feature table (1 dòng per IP) qua groupby + aggregation. Đây là bước bridge giữa raw data và ML model.',
    },
    {
      id: 'q08-5',
      type: 'multiple-choice',
      question:
        'response["hits"]["hits"] trong Python ES client chứa gì?',
      options: [
        'Aggregation results',
        'List of matched documents (mỗi item có _source)',
        'Total count of matches',
        'Index metadata',
      ],
      correctAnswer: 1,
      explanation:
        'hits.hits là list các documents matched. Mỗi item có _source (document gốc), _id, _score. Tương đương response.hits.hits trong NestJS.',
    },
  ],
};
