import type { Lesson } from '../types/lesson';

export const lesson11: Lesson = {
  id: '11-mlops-practices',
  number: 11,
  title: 'MLOps Practices',
  description:
    'Model versioning, retraining, monitoring, data drift',
  phase: 'phase-3',
  estimatedTime: '2-3 ngày',
  prerequisites: ['10-autoencoder-anomaly-detection'],

  sections: [
    /* ───── 1. MLOps Overview ───── */
    {
      id: 'mlops-overview',
      title: '1. MLOps là gì?',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          '**MLOps = DevOps cho Machine Learning**. Giải quyết câu hỏi: "Model chạy tốt trên laptop, làm sao chạy ổn trên production?"',
          'DevOps: Code → Build → Test → Deploy → Monitor. MLOps: Data → Train → Evaluate → Deploy → Monitor → **Retrain**. Vòng lặp retrain là điểm khác biệt lớn nhất.',
          'Trong PT186S: ML Engine cần pipeline hoàn chỉnh – versioning model artifacts, retrain tự động, monitoring performance, phát hiện data drift, và rollback khi cần.',
        ],
        highlights: [
          {
            type: 'warning',
            text: 'ML model có "expiry date" – data thay đổi theo thời gian (data drift) → model accuracy giảm → cần retrain. MLOps giúp phát hiện và xử lý sớm.',
          },
        ],
      },
    },

    /* ───── 2. DevOps vs MLOps ───── */
    {
      id: 'devops-vs-mlops',
      title: 'DevOps ↔ MLOps',
      type: 'comparison-table',
      content: {
        kind: 'comparison-table',
        headers: ['NestJS DevOps', 'ML Engine MLOps'],
        rows: [
          ['Git version code', 'Version model artifacts (.pkl, .joblib)'],
          ['npm test', 'Evaluate metrics (Recall, FPR, F1)'],
          ['Docker build', 'Package model + scaler + metadata'],
          ['Health check endpoint', 'Model performance monitoring'],
          ['Hotfix deploy', 'Emergency model rollback'],
          ['CI/CD pipeline', 'Retrain → Evaluate → Deploy pipeline'],
        ],
        caption: 'MLOps áp dụng kỷ luật DevOps cho ML artifacts',
      },
    },

    /* ───── 3. Model Versioning ───── */
    {
      id: 'model-versioning',
      title: '2. Model Versioning',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'model_versioning.py',
        description:
          'Mỗi model version có metadata.json chứa training info, metrics, hyperparameters. Giống Git commit nhưng cho ML model.',
        code: `import json, joblib, os
from datetime import datetime

# === Cấu trúc thư mục ===
# trained_models/
# ├── isolation_forest/
# │   ├── v1.0/
# │   │   ├── pipeline.pkl
# │   │   └── metadata.json
# │   └── v1.1/
# │       ├── pipeline.pkl
# │       └── metadata.json
# └── active_model.json     ← pointer đến model đang dùng

# === Metadata Schema ===
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
        "bytes_ratio", "port_diversity",
    ],

    "status": "active",           # active | staging | archived
    "previous_version": "1.0",
}

# === active_model.json – pointer ===
active_config = {
    "primary": {
        "type": "isolation_forest",
        "version": "v1.1",
        "path": "trained_models/isolation_forest/v1.1",
        "activated_at": datetime.now().isoformat(),
    },
    "fallback": {
        "type": "isolation_forest",
        "version": "v1.0",
        "path": "trained_models/isolation_forest/v1.0",
    },
}`,
      },
    },

    /* ───── 4. Model Registry ───── */
    {
      id: 'model-registry',
      title: '3. Model Registry',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'model_registry.py',
        description:
          'ModelRegistry quản lý lifecycle: load, switch, rollback. Hỗ trợ hot-swap không cần restart service.',
        code: `import json, joblib
from pathlib import Path
from dataclasses import dataclass
from datetime import datetime

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
        self.active_model: ModelInfo | None = None

    def load_active_model(self) -> None:
        """Load model đang active từ active_model.json."""
        config_path = self.base_dir / "active_model.json"
        with open(config_path) as f:
            config = json.load(f)

        primary = config["primary"]
        self.active_model = self._load_model(
            model_type=primary["type"],
            version=primary["version"],
            model_dir=Path(primary["path"]),
        )
        print(f"Active model: {primary['type']} v{primary['version']}")

    def _load_model(self, model_type, version, model_dir) -> ModelInfo:
        pipeline = joblib.load(model_dir / "pipeline.pkl")
        with open(model_dir / "metadata.json") as f:
            metadata = json.load(f)
        return ModelInfo(model_type, version, model_dir, pipeline, metadata)

    def switch_model(self, model_type: str, version: str) -> None:
        """Hot swap – chuyển model không cần restart."""
        model_dir = self.base_dir / model_type / version
        old = self.active_model.version if self.active_model else "none"
        self.active_model = self._load_model(model_type, version, model_dir)

        # Update pointer
        config = {
            "primary": {
                "type": model_type, "version": version,
                "path": str(model_dir),
                "activated_at": datetime.now().isoformat(),
            }
        }
        with open(self.base_dir / "active_model.json", "w") as f:
            json.dump(config, f, indent=2)
        print(f"Model switched: v{old} → v{version}")

    def rollback(self) -> None:
        """Rollback về model trước đó (từ fallback config)."""
        with open(self.base_dir / "active_model.json") as f:
            config = json.load(f)
        fallback = config["fallback"]
        self.switch_model(fallback["type"], fallback["version"])
        print("Rollback complete!")`,
        output: `Active model: isolation_forest v1.1`,
      },
    },

    /* ───── 5. Retraining Pipeline ───── */
    {
      id: 'retraining-pipeline',
      title: '4. Retraining Pipeline',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'retraining_service.py',
        description:
          'Pipeline tự động: Fetch data → Train model mới → Evaluate vs model cũ → Deploy nếu tốt hơn → Giữ nguyên nếu không.',
        code: `import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest

class RetrainingService:
    """Tự động retrain model."""

    def __init__(self, data_service, registry):
        self.data_service = data_service
        self.registry = registry

    def retrain(self, organization_id: str, days: int = 14) -> dict:
        """
        Retrain pipeline:
        1. Fetch dữ liệu training mới
        2. Train model mới
        3. Evaluate so với model cũ
        4. Nếu tốt hơn → deploy, ngược lại → giữ nguyên
        """
        # 1. Fetch data
        df = self.data_service.fetch_training_data(organization_id, days)
        X = df[FEATURE_COLUMNS].values.astype(float)

        if len(X) < 100:
            return {"status": "skipped", "reason": f"Insufficient data ({len(X)})"}

        # 2. Train model mới
        new_pipeline = Pipeline([
            ("scaler", StandardScaler()),
            ("detector", IsolationForest(
                n_estimators=100, contamination=0.05, random_state=42,
            ))
        ])
        new_pipeline.fit(X)

        # 3. Evaluate: compare anomaly rates
        current_scores = self.registry.active_model.pipeline.score_samples(X)
        new_scores = new_pipeline.score_samples(X)

        current_rate = (current_scores < np.percentile(current_scores, 5)).mean()
        new_rate = (new_scores < np.percentile(new_scores, 5)).mean()

        # 4. Deploy if better (closer to target contamination)
        improvement = abs(new_rate - 0.05) < abs(current_rate - 0.05)

        if improvement:
            version = self._get_next_version()
            self._save_and_deploy(new_pipeline, version, len(X))
            return {"status": "deployed", "version": version}
        else:
            return {"status": "skipped", "reason": "New model not better"}

    def _get_next_version(self) -> str:
        current = self.registry.active_model.version
        major, minor = current.split(".")
        return f"{major}.{int(minor) + 1}"`,
      },
    },

    /* ───── 5b. Retrain API Endpoint ───── */
    {
      id: 'retrain-api',
      title: 'Retrain & Rollback Endpoints',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'model_endpoints.py',
        description:
          'FastAPI endpoints cho retrain (background task) và rollback. NestJS CronService gọi /retrain hàng tuần.',
        code: `from fastapi import APIRouter, BackgroundTasks

router = APIRouter(prefix="/api/v1/model", tags=["Model Management"])

@router.post("/retrain")
async def trigger_retrain(
    organization_id: str,
    days: int = 14,
    background_tasks: BackgroundTasks = None,
):
    """Trigger retrain (chạy background – không block request)."""
    background_tasks.add_task(
        retraining_service.retrain, organization_id, days,
    )
    return {"message": "Retraining started", "organization_id": organization_id}

@router.post("/rollback")
async def rollback_model():
    """Rollback về model trước đó."""
    registry.rollback()
    return {"message": "Rolled back", "version": registry.active_model.version}

@router.get("/info")
async def model_info():
    """Thông tin model đang active."""
    return {
        "version": registry.active_model.version,
        "type": registry.active_model.model_type,
        "metrics": registry.active_model.metadata.get("metrics", {}),
    }`,
      },
    },

    /* ───── 6. Monitoring Service ───── */
    {
      id: 'monitoring-service',
      title: '5. Model Monitoring',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'monitoring_service.py',
        description:
          'Theo dõi anomaly rate, latency, errors. Alert khi vượt ngưỡng cho thấy model cần retrain.',
        code: `from dataclasses import dataclass, field
from datetime import datetime

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
    p95_latency_ms: float

class MonitoringService:
    """Theo dõi hiệu suất model trong production."""

    def __init__(self):
        self.metrics_history: list[PredictionMetrics] = []
        self.alert_thresholds = {
            "anomaly_rate_high": 0.20,    # >20% → model drift?
            "anomaly_rate_low": 0.001,    # <0.1% → model bỏ sót?
            "latency_high_ms": 5000,      # >5s → chậm
        }

    def record_prediction(self, metrics: PredictionMetrics) -> list[str]:
        self.metrics_history.append(metrics)
        return self._check_alerts(metrics)

    def _check_alerts(self, m: PredictionMetrics) -> list[str]:
        alerts = []
        if m.anomaly_rate > self.alert_thresholds["anomaly_rate_high"]:
            alerts.append(
                f"HIGH anomaly rate: {m.anomaly_rate:.1%} "
                f"→ Model drift? Consider retrain."
            )
        if m.anomaly_rate < self.alert_thresholds["anomaly_rate_low"]:
            alerts.append(
                f"LOW anomaly rate: {m.anomaly_rate:.1%} "
                f"→ Model might be missing anomalies."
            )
        if m.p95_latency_ms > self.alert_thresholds["latency_high_ms"]:
            alerts.append(f"HIGH latency: {m.p95_latency_ms:.0f}ms")
        return alerts

    def get_summary(self, last_n: int = 100) -> dict:
        recent = self.metrics_history[-last_n:]
        if not recent:
            return {"message": "No metrics yet"}
        return {
            "total_batches": len(recent),
            "avg_anomaly_rate": sum(m.anomaly_rate for m in recent) / len(recent),
            "avg_latency_ms": sum(m.p95_latency_ms for m in recent) / len(recent),
            "total_anomalies": sum(m.anomalies_detected for m in recent),
        }`,
      },
    },

    /* ───── 7. Data Drift Detection ───── */
    {
      id: 'data-drift',
      title: '6. Data Drift Detection',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'data_drift.py',
        description:
          'Phát hiện khi dữ liệu production thay đổi so với training data bằng Kolmogorov-Smirnov test. Nếu >30% features drift → trigger retrain.',
        code: `from scipy.stats import ks_2samp
import numpy as np

def detect_data_drift(
    training_data: np.ndarray,
    new_data: np.ndarray,
    feature_names: list[str],
    threshold: float = 0.05,
) -> dict:
    """Phát hiện data drift bằng KS test.

    Ý tưởng: so sánh phân bố training data vs new data.
    Nếu p_value < threshold → phân bố khác nhau → drift.
    """
    drift_results = {}

    for i, name in enumerate(feature_names):
        statistic, p_value = ks_2samp(
            training_data[:, i],
            new_data[:, i],
        )
        drift_results[name] = {
            "statistic": float(statistic),
            "p_value": float(p_value),
            "drifted": p_value < threshold,
        }

    drifted = [k for k, v in drift_results.items() if v["drifted"]]

    return {
        "total_features": len(feature_names),
        "drifted_features": len(drifted),
        "drifted_names": drifted,
        "should_retrain": len(drifted) > len(feature_names) * 0.3,
        "details": drift_results,
    }

# Ví dụ output:
# {
#   "total_features": 11,
#   "drifted_features": 4,
#   "drifted_names": ["avg_duration", "total_orig_bytes", ...],
#   "should_retrain": true     # 4/11 > 30%
# }`,
      },
    },

    /* ───── 8. A/B Testing ───── */
    {
      id: 'ab-testing',
      title: '7. A/B Testing Models',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'ab_testing.py',
        description:
          'Chạy 2 models song song trên cùng dữ liệu. Nếu agreement >85% → safe to promote model mới.',
        code: `import numpy as np

class ABTestService:
    """So sánh 2 models song song trên cùng dữ liệu."""

    def __init__(self, model_a, model_b):
        self.model_a = model_a   # Current production
        self.model_b = model_b   # Candidate

    def compare(self, X: np.ndarray) -> dict:
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

# Ví dụ:
# ab_test = ABTestService(model_v1, model_v2)
# result = ab_test.compare(X_production)
# {"agreement_rate": 0.92, "recommendation": "promote_b"}`,
      },
    },

    /* ───── 9. NestJS Integration ───── */
    {
      id: 'nestjs-integration',
      title: '8. Tích hợp NestJS Scheduler',
      type: 'code',
      content: {
        kind: 'code',
        language: 'typescript',
        filename: 'ml-scheduler.service.ts',
        description:
          'NestJS CronService gọi ML Engine endpoints: retrain hàng tuần, check drift hàng ngày.',
        code: `import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MlService } from './ml.service';

@Injectable()
export class MlSchedulerService {
  private readonly logger = new Logger(MlSchedulerService.name);

  constructor(private readonly mlService: MlService) {}

  // Retrain mỗi Chủ nhật 2AM
  @Cron('0 2 * * 0')
  async weeklyRetrain(): Promise<void> {
    this.logger.log('Starting weekly model retrain...');
    const organizations = await this.getActiveOrganizations();

    for (const org of organizations) {
      await this.mlService.triggerRetrain(org.id);
    }
  }

  // Check drift hàng ngày 6AM
  @Cron('0 6 * * *')
  async dailyDriftCheck(): Promise<void> {
    const drift = await this.mlService.checkDataDrift();
    if (drift.should_retrain) {
      this.logger.warn('Data drift detected! Triggering retrain...');
      await this.mlService.triggerRetrain();
    }
  }
}`,
      },
    },

    /* ───── 10. Pipeline Visualizer ───── */
    {
      id: 'pipeline-visualizer',
      title: '9. Tổng quan ML Pipeline',
      type: 'interactive',
      content: {
        kind: 'interactive',
        component: 'PipelineVisualizer',
        description:
          'Trực quan hóa toàn bộ MLOps pipeline: Data → Train → Evaluate → Deploy → Monitor → Retrain.',
        props: {},
      },
    },

    /* ───── 11. Production Checklist ───── */
    {
      id: 'production-checklist',
      title: '10. Production Checklist',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          '✅ **Model Versioning**: Mỗi model có metadata.json + active_model.json pointer + fallback version.',
          '✅ **Model Registry**: Load/switch/rollback runtime, hot-swap không cần restart.',
          '✅ **Retraining Pipeline**: Fetch → Train → Evaluate → Deploy/Skip. Background task không block API.',
          '✅ **Monitoring**: Track anomaly rate, latency, errors. Alert khi vượt ngưỡng.',
          '✅ **Data Drift**: KS test so sánh phân bố. >30% features drift → trigger retrain.',
          '✅ **A/B Testing**: Compare 2 models song song. Agreement >85% → safe to promote.',
          '✅ **NestJS Integration**: Cron retrain weekly, drift check daily.',
          '✅ **Rollback Plan**: Luôn giữ fallback version. Endpoint /rollback cho emergency.',
        ],
      },
    },
  ],

  quiz: [
    {
      id: 'q11-1',
      type: 'multiple-choice',
      question:
        'MLOps khác DevOps ở điểm nào quan trọng nhất?',
      options: [
        'MLOps dùng Python thay vì JavaScript',
        'MLOps có vòng lặp Retrain – model cần được train lại khi data thay đổi',
        'MLOps không cần Docker',
        'MLOps không cần monitoring',
      ],
      correctAnswer: 1,
      explanation:
        'DevOps: Code → Deploy → Monitor. MLOps: thêm vòng Retrain. ML model có "expiry date" – data drift khiến model accuracy giảm → cần retrain định kỳ hoặc triggered.',
    },
    {
      id: 'q11-2',
      type: 'multiple-choice',
      question:
        'active_model.json trong Model Registry dùng để làm gì?',
      options: [
        'Chứa training data',
        'Pointer đến model đang active + fallback version cho rollback',
        'Chứa hyperparameters',
        'Chứa source code của model',
      ],
      correctAnswer: 1,
      explanation:
        'active_model.json là pointer: primary (model đang dùng) + fallback (model trước đó cho rollback). Cho phép switch model mà không cần rebuild/restart.',
    },
    {
      id: 'q11-3',
      type: 'multiple-choice',
      question:
        'Data drift detection bằng KS test kiểm tra gì?',
      options: [
        'Model accuracy',
        'Phân bố dữ liệu production có khác so với training data không',
        'Tốc độ prediction',
        'Số lượng features',
      ],
      correctAnswer: 1,
      explanation:
        'Kolmogorov-Smirnov test so sánh phân bố 2 datasets. Nếu p_value < 0.05 → phân bố khác nhau đáng kể → feature đó bị drift. >30% features drift → nên retrain.',
    },
    {
      id: 'q11-4',
      type: 'multiple-choice',
      question:
        'Retraining pipeline deploy model mới khi nào?',
      options: [
        'Luôn deploy model mới nhất',
        'CHỈ khi model mới tốt hơn model cũ (evaluation pass)',
        'Khi có đủ data',
        'Mỗi tuần bất kể kết quả',
      ],
      correctAnswer: 1,
      explanation:
        'Pipeline: Train → Evaluate so với model hiện tại → Deploy CHỈ nếu better. Nếu model mới không tốt hơn → giữ nguyên model cũ. Tránh "deploy regression".',
    },
    {
      id: 'q11-5',
      type: 'multiple-choice',
      question:
        'A/B Testing models: khi nào an toàn để promote model mới?',
      options: [
        'Khi model mới train xong',
        'Khi agreement rate giữa 2 models > 85%',
        'Khi model mới có nhiều anomalies hơn',
        'Không bao giờ nên thay model',
      ],
      correctAnswer: 1,
      explanation:
        'Chạy 2 models song song trên cùng data. Agreement >85% nghĩa là model mới cho kết quả tương tự → ít risk khi switch. Nếu agreement thấp → cần review thêm.',
    },
  ],
};
