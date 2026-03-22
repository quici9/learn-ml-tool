# Tài liệu 11: MLOps – Model Versioning, Retraining & Monitoring

> **Mục tiêu:** Quản lý ML model trong production – versioning, retrain tự động, giám sát hiệu suất.
> **Thời gian học:** 2-3 ngày | **Yêu cầu:** Đã hoàn thành Tài liệu 01-10

---

## Mục lục

1. [MLOps là gì?](#1-mlops-là-gì)
2. [Model Versioning](#2-model-versioning)
3. [Model Registry](#3-model-registry)
4. [Retraining Pipeline](#4-retraining-pipeline)
5. [Model Monitoring](#5-model-monitoring)
6. [A/B Testing Models](#6-ab-testing-models)
7. [Data Drift Detection](#7-data-drift-detection)
8. [Tích hợp vào PT186S Architecture](#8-tích-hợp-vào-pt186s-architecture)
9. [Bài tập thực hành](#9-bài-tập-thực-hành)

---

## 1. MLOps là gì?

MLOps = DevOps nhưng cho Machine Learning. Giải quyết câu hỏi: **"Model chạy tốt trên laptop, làm sao chạy ổn trên production?"**

```
DevOps (bạn đã biết):
  Code → Build → Test → Deploy → Monitor
  └── CI/CD, Docker, Git

MLOps (tương tự + ML specifics):
  Data → Train → Evaluate → Deploy → Monitor → Retrain
  └── Model versioning, data drift, retraining schedule
```

**So sánh với NestJS workflow:**

| NestJS DevOps | ML Engine MLOps |
|---|---|
| Git version code | Version model artifacts (.pkl) |
| npm test | Evaluate metrics (Recall, FPR) |
| Docker build | Package model + scaler + metadata |
| Health check | Model performance monitoring |
| Hotfix deploy | Emergency model rollback |

---

## 2. Model Versioning

### Cấu trúc thư mục

```
trained_models/
├── isolation_forest/
│   ├── v1.0/                    # Phiên bản đầu tiên
│   │   ├── pipeline.pkl         # Model + scaler
│   │   └── metadata.json        # Metrics, training info
│   ├── v1.1/                    # Tune contamination
│   │   ├── pipeline.pkl
│   │   └── metadata.json
│   └── v2.0/                    # Thêm features mới
│       ├── pipeline.pkl
│       └── metadata.json
├── random_forest/
│   └── v1.0/
│       ├── pipeline.pkl
│       ├── label_encoder.pkl
│       └── metadata.json
└── active_model.json            # Pointer đến model đang dùng
```

### active_model.json

```json
{
  "primary": {
    "type": "isolation_forest",
    "version": "v1.1",
    "path": "trained_models/isolation_forest/v1.1",
    "activated_at": "2026-03-13T10:00:00",
    "activated_by": "retrain_pipeline"
  },
  "fallback": {
    "type": "isolation_forest",
    "version": "v1.0",
    "path": "trained_models/isolation_forest/v1.0"
  }
}
```

### Metadata Schema

```python
# metadata.json cho mỗi model version
import json
from datetime import datetime

metadata = {
    # Identity
    "model_type": "IsolationForest",
    "version": "1.1",

    # Training info
    "trained_at": datetime.now().isoformat(),
    "training_data": {
        "source": "elasticsearch",
        "index_pattern": "zeek-*",
        "date_range": {"start": "2026-03-06", "end": "2026-03-13"},
        "n_samples": 15000,
        "n_features": 13,
        "organizations": ["org-001", "org-002"],
    },

    # Hyperparameters
    "hyperparameters": {
        "n_estimators": 100,
        "contamination": 0.05,
        "max_features": 1.0,
    },

    # Evaluation metrics
    "metrics": {
        "accuracy": 0.971,
        "precision": 0.723,
        "recall": 0.840,
        "f1": 0.777,
        "fpr": 0.021,
    },

    # Feature info
    "feature_columns": [
        "connection_count", "unique_dest_ips", "unique_dest_ports",
        "avg_duration", "max_duration", "std_duration",
        "total_orig_bytes", "total_resp_bytes", "avg_orig_bytes",
        "bytes_ratio", "port_diversity", "has_unknown_service_ratio",
        "s0_ratio",
    ],

    # Deployment info
    "status": "active",  # active | staging | archived
    "previous_version": "1.0",
}
```

---

## 3. Model Registry

Quản lý model versions – service load/switch model:

```python
# app/services/model_registry.py
import json
import joblib
from pathlib import Path
from dataclasses import dataclass

@dataclass
class ModelInfo:
    model_type: str
    version: str
    path: Path
    pipeline: object
    metadata: dict

class ModelRegistry:
    """Quản lý lifecycle các ML models."""

    def __init__(self, base_dir: str = "trained_models"):
        self.base_dir = Path(base_dir)
        self.models: dict[str, ModelInfo] = {}
        self.active_model: ModelInfo | None = None

    def load_active_model(self) -> None:
        """Load model đang active từ active_model.json."""
        config_path = self.base_dir / "active_model.json"
        if not config_path.exists():
            raise FileNotFoundError("No active model configured")

        with open(config_path, "r") as f:
            config = json.load(f)

        primary = config["primary"]
        model_path = Path(primary["path"])
        self.active_model = self._load_model(
            model_type=primary["type"],
            version=primary["version"],
            model_dir=model_path,
        )
        print(f"Active model: {primary['type']} v{primary['version']}")

    def _load_model(self, model_type: str, version: str, model_dir: Path) -> ModelInfo:
        """Load model từ directory."""
        pipeline = joblib.load(model_dir / "pipeline.pkl")
        with open(model_dir / "metadata.json", "r") as f:
            metadata = json.load(f)

        return ModelInfo(
            model_type=model_type,
            version=version,
            path=model_dir,
            pipeline=pipeline,
            metadata=metadata,
        )

    def switch_model(self, model_type: str, version: str) -> None:
        """Chuyển sang model khác (hot swap, không restart)."""
        model_dir = self.base_dir / model_type / version
        if not model_dir.exists():
            raise FileNotFoundError(f"Model not found: {model_dir}")

        old_version = self.active_model.version if self.active_model else "none"
        self.active_model = self._load_model(model_type, version, model_dir)

        # Update active_model.json
        config = {
            "primary": {
                "type": model_type,
                "version": version,
                "path": str(model_dir),
                "activated_at": datetime.now().isoformat(),
            }
        }
        with open(self.base_dir / "active_model.json", "w") as f:
            json.dump(config, f, indent=2)

        print(f"Model switched: v{old_version} → v{version}")

    def rollback(self) -> None:
        """Rollback về model trước đó."""
        config_path = self.base_dir / "active_model.json"
        with open(config_path, "r") as f:
            config = json.load(f)

        if "fallback" not in config:
            raise RuntimeError("No fallback model configured")

        fallback = config["fallback"]
        self.switch_model(fallback["type"], fallback["version"])
        print("Rollback complete!")
```

---

## 4. Retraining Pipeline

```python
# app/services/retraining_service.py
"""Automated retraining pipeline."""
import numpy as np
from datetime import datetime, timedelta
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest
from app.services.data_service import DataService
from app.services.model_registry import ModelRegistry

FEATURE_COLUMNS = [
    "connection_count", "unique_dest_ips", "unique_dest_ports",
    "avg_duration", "max_duration", "std_duration",
    "total_orig_bytes", "total_resp_bytes", "avg_orig_bytes",
    "bytes_ratio", "port_diversity",
]

class RetrainingService:
    """Tự động retrain model."""

    def __init__(self, data_service: DataService, registry: ModelRegistry):
        self.data_service = data_service
        self.registry = registry

    def retrain(
        self,
        organization_id: str,
        days: int = 14,
    ) -> dict:
        """
        Retrain model với dữ liệu mới nhất.

        Steps:
        1. Fetch dữ liệu training
        2. Train model mới
        3. Evaluate so với model cũ
        4. Nếu tốt hơn → deploy, ngược lại → giữ nguyên
        """
        # 1. Fetch data
        df = self.data_service.fetch_training_data(organization_id, days)
        X = df[FEATURE_COLUMNS].values.astype(float)

        if len(X) < 100:
            return {"status": "skipped", "reason": f"Insufficient data ({len(X)} samples)"}

        # 2. Train new model
        new_pipeline = Pipeline([
            ("scaler", StandardScaler()),
            ("detector", IsolationForest(
                n_estimators=100,
                contamination=0.05,
                random_state=42,
            ))
        ])
        new_pipeline.fit(X)

        # 3. Evaluate (compare with current model)
        current_scores = self.registry.active_model.pipeline.score_samples(X)
        new_scores = new_pipeline.score_samples(X)

        # Simple evaluation: check score distribution
        current_anomaly_rate = (current_scores < np.percentile(current_scores, 5)).mean()
        new_anomaly_rate = (new_scores < np.percentile(new_scores, 5)).mean()

        # 4. Deploy if metrics improve or stay stable
        improvement = abs(new_anomaly_rate - 0.05) < abs(current_anomaly_rate - 0.05)

        if improvement:
            new_version = self._get_next_version()
            self._save_and_deploy(new_pipeline, new_version, len(X))
            return {
                "status": "deployed",
                "version": new_version,
                "anomaly_rate": float(new_anomaly_rate),
            }
        else:
            return {
                "status": "skipped",
                "reason": "New model not better than current",
                "current_rate": float(current_anomaly_rate),
                "new_rate": float(new_anomaly_rate),
            }

    def _get_next_version(self) -> str:
        """Tính version tiếp theo."""
        current = self.registry.active_model.version
        major, minor = current.split(".")
        return f"{major}.{int(minor) + 1}"

    def _save_and_deploy(self, pipeline, version: str, n_samples: int) -> None:
        """Lưu model mới và activate."""
        import joblib, json, os

        model_dir = f"trained_models/isolation_forest/v{version}"
        os.makedirs(model_dir, exist_ok=True)

        joblib.dump(pipeline, f"{model_dir}/pipeline.pkl")

        metadata = {
            "model_type": "IsolationForest",
            "version": version,
            "trained_at": datetime.now().isoformat(),
            "n_samples": n_samples,
            "status": "active",
        }
        with open(f"{model_dir}/metadata.json", "w") as f:
            json.dump(metadata, f, indent=2)

        self.registry.switch_model("isolation_forest", f"v{version}")
```

### Scheduled Retraining

```python
# Thêm endpoint trigger retrain (gọi từ cron job hoặc NestJS scheduler)
from fastapi import APIRouter, BackgroundTasks

router = APIRouter(prefix="/api/v1/model", tags=["Model Management"])

@router.post("/retrain")
async def trigger_retrain(
    organization_id: str,
    days: int = 14,
    background_tasks: BackgroundTasks = None,
):
    """Trigger retrain (chạy background)."""
    background_tasks.add_task(retraining_service.retrain, organization_id, days)
    return {"message": "Retraining started", "organization_id": organization_id}

@router.post("/rollback")
async def rollback_model():
    """Rollback về model trước đó."""
    registry.rollback()
    return {"message": "Model rolled back", "version": registry.active_model.version}
```

---

## 5. Model Monitoring

### Metrics cần theo dõi

```python
# app/services/monitoring_service.py
from datetime import datetime
from dataclasses import dataclass, field

@dataclass
class PredictionMetrics:
    """Metrics cho mỗi batch prediction."""
    timestamp: datetime
    organization_id: str
    model_version: str
    total_analyzed: int
    anomalies_detected: int
    anomaly_rate: float
    avg_score: float
    min_score: float
    p95_latency_ms: float


class MonitoringService:
    """Theo dõi hiệu suất model trong production."""

    def __init__(self):
        self.metrics_history: list[PredictionMetrics] = []
        self.alert_thresholds = {
            "anomaly_rate_high": 0.20,    # >20% anomalies → có thể model drift
            "anomaly_rate_low": 0.001,    # <0.1% → model có thể bỏ sót
            "latency_high_ms": 5000,      # >5s → chậm
        }

    def record_prediction(self, metrics: PredictionMetrics) -> list[str]:
        """Ghi nhận metrics và kiểm tra alerts."""
        self.metrics_history.append(metrics)
        alerts = self._check_alerts(metrics)
        return alerts

    def _check_alerts(self, metrics: PredictionMetrics) -> list[str]:
        """Kiểm tra ngưỡng và tạo cảnh báo."""
        alerts = []

        if metrics.anomaly_rate > self.alert_thresholds["anomaly_rate_high"]:
            alerts.append(
                f"HIGH anomaly rate: {metrics.anomaly_rate:.1%} "
                f"(threshold: {self.alert_thresholds['anomaly_rate_high']:.1%})"
            )

        if metrics.anomaly_rate < self.alert_thresholds["anomaly_rate_low"]:
            alerts.append(
                f"LOW anomaly rate: {metrics.anomaly_rate:.1%} "
                f"- Model might be missing anomalies"
            )

        if metrics.p95_latency_ms > self.alert_thresholds["latency_high_ms"]:
            alerts.append(
                f"HIGH latency: {metrics.p95_latency_ms:.0f}ms "
                f"(threshold: {self.alert_thresholds['latency_high_ms']}ms)"
            )

        return alerts

    def get_summary(self, last_n: int = 100) -> dict:
        """Tóm tắt metrics gần nhất."""
        recent = self.metrics_history[-last_n:]
        if not recent:
            return {"message": "No metrics recorded yet"}

        return {
            "total_predictions": len(recent),
            "avg_anomaly_rate": sum(m.anomaly_rate for m in recent) / len(recent),
            "avg_latency_ms": sum(m.p95_latency_ms for m in recent) / len(recent),
            "total_anomalies": sum(m.anomalies_detected for m in recent),
        }
```

---

## 6. A/B Testing Models

```python
# So sánh 2 models song song trên cùng dữ liệu
class ABTestService:
    """Chạy 2 models song song, so sánh kết quả."""

    def __init__(self, model_a, model_b):
        self.model_a = model_a  # Current production
        self.model_b = model_b  # Candidate

    def compare(self, X: np.ndarray) -> dict:
        """So sánh predictions của 2 models."""
        preds_a = self.model_a.predict(X)
        preds_b = self.model_b.predict(X)

        agreement = (preds_a == preds_b).mean()
        anomalies_a = (preds_a == -1).sum()
        anomalies_b = (preds_b == -1).sum()

        return {
            "agreement_rate": float(agreement),
            "model_a_anomalies": int(anomalies_a),
            "model_b_anomalies": int(anomalies_b),
            "recommendation": "promote_b" if agreement > 0.85 else "keep_a",
        }
```

---

## 7. Data Drift Detection

Model performance suy giảm khi **dữ liệu thay đổi** (mạng thay đổi, users mới, services mới):

```python
from scipy.stats import ks_2samp

def detect_data_drift(
    training_data: np.ndarray,
    new_data: np.ndarray,
    feature_names: list[str],
    threshold: float = 0.05,
) -> dict:
    """Phát hiện data drift bằng Kolmogorov-Smirnov test."""
    drift_results = {}

    for i, name in enumerate(feature_names):
        statistic, p_value = ks_2samp(
            training_data[:, i],
            new_data[:, i],
        )
        drifted = p_value < threshold
        drift_results[name] = {
            "statistic": float(statistic),
            "p_value": float(p_value),
            "drifted": drifted,
        }

    drifted_features = [k for k, v in drift_results.items() if v["drifted"]]

    return {
        "total_features": len(feature_names),
        "drifted_features": len(drifted_features),
        "drifted_names": drifted_features,
        "should_retrain": len(drifted_features) > len(feature_names) * 0.3,
        "details": drift_results,
    }
```

---

## 8. Tích hợp vào PT186S Architecture

```
┌─────────────────────────────────────────────────────┐
│  NestJS Backend                                      │
│  ├── CronService: gọi /retrain hàng tuần           │
│  ├── AlertService: nhận predictions → tạo alerts     │
│  └── MlService: HTTP client → ML Engine              │
└───────────────────────┬─────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────┐
│  ML Engine (FastAPI)                                 │
│  ├── /api/v1/detection/analyze      → Predict        │
│  ├── /api/v1/model/retrain          → Retrain        │
│  ├── /api/v1/model/rollback         → Rollback       │
│  ├── /api/v1/model/info             → Model metadata │
│  ├── /api/v1/monitoring/summary     → Metrics        │
│  └── /api/v1/monitoring/drift       → Data drift     │
│                                                      │
│  Internal:                                           │
│  ├── ModelRegistry      → Version management         │
│  ├── RetrainingService  → Automated retrain          │
│  ├── MonitoringService  → Performance tracking        │
│  └── DataService        → Elasticsearch client       │
└─────────────────────────────────────────────────────┘
```

### NestJS Scheduler

```typescript
// backend/src/ml/ml-scheduler.service.ts
@Injectable()
export class MlSchedulerService {
  private readonly logger = new Logger(MlSchedulerService.name);

  constructor(private readonly mlService: MlService) {}

  // Retrain mỗi tuần (Chủ nhật 2AM)
  @Cron('0 2 * * 0')
  async weeklyRetrain(): Promise<void> {
    this.logger.log('Starting weekly model retrain...');
    const organizations = await this.getActiveOrganizations();

    for (const org of organizations) {
      await this.mlService.triggerRetrain(org.id);
    }
  }

  // Check drift hàng ngày
  @Cron('0 6 * * *')
  async dailyDriftCheck(): Promise<void> {
    const drift = await this.mlService.checkDataDrift();
    if (drift.should_retrain) {
      this.logger.warn('Data drift detected! Triggering retrain...');
      await this.mlService.triggerRetrain();
    }
  }
}
```

---

## 9. Bài tập thực hành

### Bài 1: Model Registry CLI

Viết script Python CLI cho phép:
- `python manage.py list` → list tất cả model versions
- `python manage.py activate <type> <version>` → switch model
- `python manage.py rollback` → rollback
- `python manage.py info` → thông tin model hiện tại

### Bài 2: Monitoring Dashboard Data

Viết FastAPI endpoint `/api/v1/monitoring/metrics` trả về metrics 24h gần nhất dưới dạng time series (để vẽ chart trên Angular dashboard).

### Bài 3: Drift Alert

Thêm logic: khi data drift detected → tạo Alert trong NestJS (severity: MEDIUM, type: "model_drift"). Analyst nhận notification để review.

---

## Tổng kết Lộ trình

```
✅ Phase 1: Python & Data Science Fundamentals
   01 - Python Fundamentals
   02 - Pandas Data Processing
   03 - NumPy & Statistics
   04 - ML Fundamentals

✅ Phase 2: Applied ML for Network Security
   05 - Scikit-learn Anomaly Detection
   06 - Feature Engineering
   07 - FastAPI ML Engine
   08 - Elasticsearch Python Client

✅ Phase 3: Advanced ML & MLOps
   09 - Supervised Learning (Random Forest)
   10 - Autoencoder (PyTorch)
   11 - MLOps Practices (bạn đang đây!)

🎯 Bước tiếp theo: Bắt đầu xây dựng ML Engine service thực tế!
```
