# ML Learning Documentation – Lộ trình học Machine Learning cho PT186S

> Bộ tài liệu self-study cho team phát triển – từ Python cơ bản đến triển khai ML Engine production.
> Tất cả ví dụ đều liên quan đến network anomaly detection trong hệ thống PT186S.

---

## Lộ trình tổng quan

```
Phase 1 (2-3 tuần)          Phase 2 (2-3 tuần)          Phase 3 (theo nhu cầu)
Python & Data Science  →  Applied ML for Security  →  Advanced ML & MLOps
```

---

## Phase 1: Python & Data Science Fundamentals

| # | Tài liệu | Thời gian | Nội dung chính |
|---|---|---|---|
| 01 | [Python Fundamentals](./01-python-fundamentals.md) | 2-3 ngày | So sánh Python ↔ TypeScript, cú pháp, functions, classes, type hints |
| 02 | [Pandas Data Processing](./02-pandas-data-processing.md) | 2-3 ngày | DataFrame, đọc/ghi dữ liệu, lọc, groupby, xử lý Zeek conn.log |
| 03 | [NumPy & Statistics](./03-numpy-statistics.md) | 2-3 ngày | Array operations, thống kê, normalization, broadcasting |
| 04 | [ML Fundamentals](./04-ml-fundamentals.md) | 3-4 ngày | Supervised/Unsupervised, workflow, train/test, metrics, overfitting |

---

## Phase 2: Applied ML for Network Security

| # | Tài liệu | Thời gian | Nội dung chính |
|---|---|---|---|
| 05 | [Scikit-learn Anomaly Detection](./05-sklearn-anomaly-detection.md) | 3-4 ngày | Isolation Forest, Pipeline, threshold tuning, model serialization |
| 06 | [Feature Engineering](./06-network-feature-engineering.md) | 3-4 ngày | Zeek conn.log features, encoding, IP aggregation, time-window |
| 07 | [FastAPI ML Engine](./07-fastapi-ml-engine.md) | 3-4 ngày | REST API, Pydantic schemas, model serving, Docker deployment |
| 08 | [Elasticsearch Python Client](./08-elasticsearch-python-client.md) | 2-3 ngày | Search/Scroll API, aggregation, tích hợp ML pipeline |

---

## Phase 3: Advanced ML & MLOps

| # | Tài liệu | Thời gian | Nội dung chính |
|---|---|---|---|
| 09 | [Supervised Learning](./09-supervised-learning.md) | 3-4 ngày | Random Forest multi-class, feature importance, cross-validation |
| 10 | [Autoencoder](./10-autoencoder-anomaly-detection.md) | 4-5 ngày | PyTorch basics, reconstruction error, so sánh IF/RF/AE |
| 11 | [MLOps Practices](./11-mlops-practices.md) | 2-3 ngày | Model versioning, retraining, monitoring, data drift |

---

## Hướng dẫn sử dụng

1. **Học tuần tự** – mỗi tài liệu dựa trên kiến thức tài liệu trước
2. **Chạy code** – tất cả ví dụ có thể copy-paste chạy được
3. **Làm bài tập** – cuối mỗi tài liệu có bài tập thực hành
4. **So sánh NestJS** – các khái niệm được so sánh với TypeScript/NestJS bạn đã biết
