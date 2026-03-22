# Tài liệu 08: Elasticsearch Python Client – Đọc dữ liệu mạng

> **Mục tiêu:** Kết nối Python (ML Engine) với Elasticsearch để lấy Zeek/Suricata logs – nguồn dữ liệu cho ML model.
> **Thời gian học:** 2-3 ngày | **Yêu cầu:** Đã hoàn thành Tài liệu 01-07

---

## Mục lục

1. [Kiến trúc tổng thể](#1-kiến-trúc-tổng-thể)
2. [Cài đặt và Kết nối](#2-cài-đặt-và-kết-nối)
3. [So sánh với NestJS ElasticsearchService](#3-so-sánh-với-nestjs-elasticsearchservice)
4. [Search API](#4-search-api)
5. [Scroll API – Đọc lượng lớn dữ liệu](#5-scroll-api--đọc-lượng-lớn-dữ-liệu)
6. [Time-based Index Patterns](#6-time-based-index-patterns)
7. [Aggregation Queries](#7-aggregation-queries)
8. [Tích hợp vào ML Pipeline](#8-tích-hợp-vào-ml-pipeline)
9. [Bài tập thực hành](#9-bài-tập-thực-hành)

---

## 1. Kiến trúc tổng thể

```
┌─────────────────────────────────────────────┐
│  NestJS Backend                              │
│  ├── ZeekService (TypeScript)                │
│  │   └── truy vấn Elasticsearch cho frontend │
│  └── MlService → gọi ML Engine API          │
└─────────────────────┬───────────────────────┘
                      │ HTTP (REST)
┌─────────────────────▼───────────────────────┐
│  ML Engine (Python FastAPI)                  │
│  ├── ElasticsearchClient (Python)            │
│  │   └── đọc raw data cho feature engineering│
│  ├── FeatureEngineer → trích xuất features   │
│  └── Detector → Isolation Forest predict     │
└─────────────────────┬───────────────────────┘
                      │ Client API
┌─────────────────────▼───────────────────────┐
│  Elasticsearch                               │
│  ├── zeek-YYYY.MM.DD (conn.log, dns.log)     │
│  └── suricata-YYYY.MM.DD (alerts)            │
└─────────────────────────────────────────────┘
```

ML Engine sử dụng **elasticsearch-py** (official Python client) để đọc trực tiếp từ Elasticsearch.

---

## 2. Cài đặt và Kết nối

```bash
pip install elasticsearch
```

```python
from elasticsearch import Elasticsearch

# === Kết nối cơ bản ===
es = Elasticsearch(
    hosts=["http://localhost:9200"],
    # Nếu có authentication:
    # basic_auth=("elastic", "password"),
    # Timeout cho large queries
    request_timeout=30,
)

# Kiểm tra kết nối
if es.ping():
    print("Connected to Elasticsearch!")
    info = es.info()
    print(f"Cluster: {info['cluster_name']}, Version: {info['version']['number']}")
else:
    print("Cannot connect to Elasticsearch")
```

### Configuration cho PT186S

```python
# app/config.py
import os

class Settings:
    ES_HOST: str = os.getenv("ELASTICSEARCH_HOST", "http://elasticsearch:9200")
    ES_USER: str = os.getenv("ELASTICSEARCH_USER", "")
    ES_PASSWORD: str = os.getenv("ELASTICSEARCH_PASSWORD", "")
    ES_TIMEOUT: int = int(os.getenv("ELASTICSEARCH_TIMEOUT", "30"))
    ZEEK_INDEX_PATTERN: str = os.getenv("ZEEK_INDEX_PATTERN", "zeek-*")
    SURICATA_INDEX_PATTERN: str = os.getenv("SURICATA_INDEX_PATTERN", "suricata-*")

settings = Settings()

def create_es_client() -> Elasticsearch:
    """Tạo Elasticsearch client (singleton trong FastAPI)."""
    kwargs = {
        "hosts": [settings.ES_HOST],
        "request_timeout": settings.ES_TIMEOUT,
    }
    if settings.ES_USER:
        kwargs["basic_auth"] = (settings.ES_USER, settings.ES_PASSWORD)

    return Elasticsearch(**kwargs)
```

---

## 3. So sánh với NestJS ElasticsearchService

PT186S NestJS backend đã có code truy vấn Elasticsearch. Python client dùng syntax tương tự:

### Search query

```typescript
// NestJS (zeek.service.ts hiện tại)
const result = await this.elasticsearchService.search({
  index: 'zeek-*',
  body: {
    query: {
      bool: {
        must: [
          { range: { '@timestamp': { gte: startTime, lte: endTime } } },
          { term: { 'id.orig_h': sourceIp } },
        ],
      },
    },
    size: 1000,
  },
});
```

```python
# Python (elasticsearch-py)
result = es.search(
    index="zeek-*",
    body={
        "query": {
            "bool": {
                "must": [
                    {"range": {"@timestamp": {"gte": start_time, "lte": end_time}}},
                    {"term": {"id.orig_h": source_ip}},
                ]
            }
        },
        "size": 1000,
    }
)
```

**Nhận xét:** Syntax gần như giống nhau – JSON query body giống hệt. Chỉ khác cách gọi method.

---

## 4. Search API

### Truy vấn cơ bản

```python
from datetime import datetime, timedelta

def search_zeek_connections(
    es: Elasticsearch,
    organization_id: str,
    start_time: datetime,
    end_time: datetime,
    size: int = 1000,
) -> list[dict]:
    """Lấy Zeek conn.log records từ Elasticsearch."""

    body = {
        "query": {
            "bool": {
                "must": [
                    {
                        "range": {
                            "@timestamp": {
                                "gte": start_time.isoformat(),
                                "lte": end_time.isoformat(),
                            }
                        }
                    },
                ],
                "filter": [
                    {"term": {"organization_id": organization_id}},
                    {"exists": {"field": "id.orig_h"}},  # Có source IP
                ]
            }
        },
        "_source": [
            "@timestamp", "id.orig_h", "id.resp_h", "id.resp_p",
            "proto", "service", "duration", "orig_bytes", "resp_bytes",
            "conn_state",
        ],
        "size": size,
        "sort": [{"@timestamp": "desc"}],
    }

    result = es.search(index="zeek-*", body=body)

    # Chuyển Elasticsearch hits thành list of dicts
    records = []
    for hit in result["hits"]["hits"]:
        src = hit["_source"]
        records.append({
            "timestamp": src.get("@timestamp"),
            "source_ip": src.get("id.orig_h"),
            "dest_ip": src.get("id.resp_h"),
            "dest_port": src.get("id.resp_p", 0),
            "protocol": src.get("proto", "tcp"),
            "service": src.get("service", "-"),
            "duration": src.get("duration", 0),
            "orig_bytes": src.get("orig_bytes", 0),
            "resp_bytes": src.get("resp_bytes", 0),
            "conn_state": src.get("conn_state", "OTH"),
        })

    return records


# === Sử dụng ===
end = datetime.now()
start = end - timedelta(hours=1)

records = search_zeek_connections(es, "org-001", start, end)
print(f"Found {len(records)} records")
```

---

## 5. Scroll API – Đọc lượng lớn dữ liệu

`search()` giới hạn 10,000 results. Để đọc nhiều hơn, dùng Scroll API:

```python
def scroll_zeek_connections(
    es: Elasticsearch,
    organization_id: str,
    start_time: datetime,
    end_time: datetime,
    batch_size: int = 5000,
) -> list[dict]:
    """Đọc toàn bộ Zeek records với scroll (không giới hạn số lượng)."""

    body = {
        "query": {
            "bool": {
                "must": [
                    {"range": {"@timestamp": {"gte": start_time.isoformat(), "lte": end_time.isoformat()}}},
                ],
                "filter": [
                    {"term": {"organization_id": organization_id}},
                ]
            }
        },
        "_source": [
            "@timestamp", "id.orig_h", "id.resp_h", "id.resp_p",
            "proto", "service", "duration", "orig_bytes", "resp_bytes", "conn_state",
        ],
        "size": batch_size,
    }

    # Bắt đầu scroll
    result = es.search(index="zeek-*", body=body, scroll="2m")
    scroll_id = result["_scroll_id"]
    total_hits = result["hits"]["total"]["value"]
    all_records: list[dict] = []

    # Đọc batch đầu tiên
    hits = result["hits"]["hits"]
    all_records.extend(parse_hits(hits))
    print(f"Scroll: {len(all_records)}/{total_hits} records")

    # Tiếp tục scroll cho đến khi hết
    while len(hits) > 0:
        result = es.scroll(scroll_id=scroll_id, scroll="2m")
        scroll_id = result["_scroll_id"]
        hits = result["hits"]["hits"]
        all_records.extend(parse_hits(hits))
        print(f"Scroll: {len(all_records)}/{total_hits} records")

    # Xóa scroll context (giải phóng tài nguyên)
    es.clear_scroll(scroll_id=scroll_id)

    return all_records


def parse_hits(hits: list[dict]) -> list[dict]:
    """Chuyển Elasticsearch hits thành list of dicts."""
    records = []
    for hit in hits:
        src = hit["_source"]
        records.append({
            "timestamp": src.get("@timestamp"),
            "source_ip": src.get("id.orig_h"),
            "dest_ip": src.get("id.resp_h"),
            "dest_port": src.get("id.resp_p", 0),
            "protocol": src.get("proto", "tcp"),
            "service": src.get("service", "-"),
            "duration": src.get("duration", 0),
            "orig_bytes": src.get("orig_bytes", 0),
            "resp_bytes": src.get("resp_bytes", 0),
            "conn_state": src.get("conn_state", "OTH"),
        })
    return records
```

---

## 6. Time-based Index Patterns

PT186S dùng index theo ngày: `zeek-2026.03.13`, `zeek-2026.03.14`, ...

```python
from datetime import datetime, timedelta

def get_index_names(
    prefix: str,
    start_time: datetime,
    end_time: datetime,
) -> str:
    """Tạo danh sách index names để query hiệu quả hơn."""
    indices = []
    current = start_time.date()
    end_date = end_time.date()

    while current <= end_date:
        indices.append(f"{prefix}-{current.strftime('%Y.%m.%d')}")
        current += timedelta(days=1)

    return ",".join(indices)


# Thay vì query zeek-* (tất cả indices), chỉ query các ngày cần thiết
end = datetime.now()
start = end - timedelta(hours=6)

index_names = get_index_names("zeek", start, end)
# "zeek-2026.03.13" hoặc "zeek-2026.03.12,zeek-2026.03.13"

result = es.search(index=index_names, body=body)
```

---

## 7. Aggregation Queries

Dùng aggregation thay vì đọc tất cả raw records – **nhanh hơn rất nhiều:**

```python
def get_ip_statistics(
    es: Elasticsearch,
    organization_id: str,
    start_time: datetime,
    end_time: datetime,
) -> list[dict]:
    """Tính thống kê per-IP trực tiếp trong Elasticsearch."""

    body = {
        "query": {
            "bool": {
                "must": [
                    {"range": {"@timestamp": {"gte": start_time.isoformat(), "lte": end_time.isoformat()}}},
                ],
                "filter": [
                    {"term": {"organization_id": organization_id}},
                ]
            }
        },
        "size": 0,  # Không cần raw hits, chỉ cần aggregation
        "aggs": {
            "per_source_ip": {
                "terms": {
                    "field": "id.orig_h",
                    "size": 10000,  # Top 10K IPs
                },
                "aggs": {
                    "unique_dest_ips": {"cardinality": {"field": "id.resp_h"}},
                    "unique_dest_ports": {"cardinality": {"field": "id.resp_p"}},
                    "avg_duration": {"avg": {"field": "duration"}},
                    "max_duration": {"max": {"field": "duration"}},
                    "total_orig_bytes": {"sum": {"field": "orig_bytes"}},
                    "total_resp_bytes": {"sum": {"field": "resp_bytes"}},
                    "avg_orig_bytes": {"avg": {"field": "orig_bytes"}},
                }
            }
        }
    }

    result = es.search(index="zeek-*", body=body)

    # Parse aggregation results thành feature table
    ip_stats = []
    for bucket in result["aggregations"]["per_source_ip"]["buckets"]:
        ip_stats.append({
            "source_ip": bucket["key"],
            "connection_count": bucket["doc_count"],
            "unique_dest_ips": bucket["unique_dest_ips"]["value"],
            "unique_dest_ports": bucket["unique_dest_ports"]["value"],
            "avg_duration": bucket["avg_duration"]["value"] or 0,
            "max_duration": bucket["max_duration"]["value"] or 0,
            "total_orig_bytes": bucket["total_orig_bytes"]["value"] or 0,
            "total_resp_bytes": bucket["total_resp_bytes"]["value"] or 0,
            "avg_orig_bytes": bucket["avg_orig_bytes"]["value"] or 0,
        })

    return ip_stats
```

**Ưu điểm aggregation:**
- Elasticsearch tính toán trên cluster → nhanh hơn fetch raw + tính Python
- Ít dữ liệu transfer qua network
- Phù hợp khi chỉ cần tổng hợp, không cần raw records

---

## 8. Tích hợp vào ML Pipeline

```python
# app/services/data_service.py
"""Service lấy dữ liệu từ Elasticsearch cho ML Pipeline."""

import pandas as pd
from datetime import datetime, timedelta
from elasticsearch import Elasticsearch
from app.config import settings, create_es_client


class DataService:
    """Lấy và chuẩn bị dữ liệu từ Elasticsearch."""

    def __init__(self):
        self.es = create_es_client()

    def fetch_training_data(
        self,
        organization_id: str,
        days: int = 7,
    ) -> pd.DataFrame:
        """Lấy dữ liệu training từ N ngày gần nhất."""
        end_time = datetime.now()
        start_time = end_time - timedelta(days=days)

        # Dùng aggregation cho features
        ip_stats = get_ip_statistics(
            self.es, organization_id, start_time, end_time
        )

        df = pd.DataFrame(ip_stats)

        # Thêm derived features
        df["bytes_ratio"] = df["total_orig_bytes"] / (df["total_resp_bytes"] + 1)
        df["port_diversity"] = df["unique_dest_ports"] / df["connection_count"]

        # Fill NaN
        df = df.fillna(0)

        print(f"Training data: {len(df)} IPs from {days} days")
        return df

    def fetch_recent_data(
        self,
        organization_id: str,
        minutes: int = 15,
    ) -> pd.DataFrame:
        """Lấy dữ liệu gần nhất cho real-time detection."""
        end_time = datetime.now()
        start_time = end_time - timedelta(minutes=minutes)

        ip_stats = get_ip_statistics(
            self.es, organization_id, start_time, end_time
        )

        df = pd.DataFrame(ip_stats)
        df["bytes_ratio"] = df["total_orig_bytes"] / (df["total_resp_bytes"] + 1)
        df["port_diversity"] = df["unique_dest_ports"] / df["connection_count"]
        df = df.fillna(0)

        return df
```

---

## 9. Bài tập thực hành

### Bài 1: Kết nối thử

Kết nối Python với Elasticsearch dev (docker-compose PT186S). List tất cả indices có prefix `zeek-`.

### Bài 2: Query Suricata alerts

Viết hàm `search_suricata_alerts()` tương tự `search_zeek_connections()` nhưng cho Suricata alerts. Lấy các trường: `alert.signature`, `alert.severity`, `src_ip`, `dest_ip`.

### Bài 3: Top talkers

Dùng aggregation để tìm top 10 source IPs có `total_orig_bytes` lớn nhất trong 24h gần nhất. Output DataFrame với columns: `source_ip`, `total_bytes`, `connection_count`.

---

> **Tài liệu tiếp theo:** [09 – Supervised Learning: Random Forest cho Network Security](./09-supervised-learning.md)
