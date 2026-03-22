import type { Lesson } from '../types/lesson';

export const lesson19: Lesson = {
  id: '19-capstone-project',
  number: 19,
  title: 'Capstone Project',
  description: 'End-to-end: raw Zeek logs → EDA → train → SHAP → FastAPI → MLOps',
  phase: 'phase-5',
  estimatedTime: '5-7 ngày',
  prerequisites: ['18-lstm-temporal'],

  sections: [
    /* ───── 1. Project Overview ───── */
    {
      id: 'capstone-overview',
      title: '1. Project Overview: Production ML System',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          '**Mục tiêu**: Xây dựng một complete ML-powered anomaly detection system từ đầu đến cuối, tích hợp tất cả kiến thức từ 18 bài học. Không phải notebook demo — đây là production-grade system.',
          '**Output**: (1) REST API phục vụ real-time predictions, (2) Automated training pipeline, (3) Model versioning và monitoring, (4) SHAP-powered alert explanations.',
          '**Dataset**: CICIDS2017 hoặc Zeek logs thực từ môi trường lab (NSM/Suricata). Nếu không có real data, sử dụng synthetic data với patterns thực tế.',
          '**Tech stack**: Python, scikit-learn, XGBoost, PyTorch (LSTM), SHAP, FastAPI, MLflow, Docker. Tất cả đều đã học trong khóa.',
        ],
        highlights: [
          {
            type: 'important',
            text: 'Capstone là dự án thực sự, không phải bài tập. Code nên production-ready: error handling, logging, tests, documentation. Sẽ dùng như portfolio showcase.',
          },
        ],
      },
    },

    /* ───── 2. Architecture ───── */
    {
      id: 'system-architecture',
      title: '2. System Architecture',
      type: 'comparison-table',
      content: {
        kind: 'comparison-table',
        headers: ['Component', 'Technology', 'Responsibility'],
        rows: [
          ['Data Ingestion', 'Python + pandas', 'Parse Zeek logs → structured features'],
          ['Feature Engineering', 'sklearn Pipeline', 'EDA-derived transforms, scaling, encoding'],
          ['Model Training', 'XGBoost + LSTM + IF', 'Supervised (XGB), unsupervised (IF), temporal (LSTM)'],
          ['Hyperparameter Tuning', 'Optuna', 'Automated tuning với TimeSeriesSplit CV'],
          ['Explainability', 'SHAP TreeExplainer', 'Per-alert explanation cho analyst'],
          ['Experiment Tracking', 'MLflow', 'Parameter, metric, artifact logging'],
          ['Serving API', 'FastAPI + uvicorn', 'Real-time prediction endpoint'],
          ['Monitoring', 'Prometheus + Grafana', 'Drift detection, model performance'],
          ['Containerization', 'Docker + docker-compose', 'Reproducible deployments'],
        ],
        caption: 'Toàn bộ stack được cover trong khóa học. Capstone = integrating everything.',
      },
    },

    /* ───── 3. Step by Step ───── */
    {
      id: 'step-by-step',
      title: '3. Lộ trình triển khai',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          '**Phase A — Data Pipeline (Ngày 1-2)**:  Parse raw Zeek `conn.log` → extract features (connection stats, temporal features, protocol features) → EDA report automated → data quality checks → save processed dataset.',
          '**Phase B — Training Pipeline (Ngày 2-3)**: Implement StratifiedSplit + TimeSeriesSplit → train IF/XGBoost/LSTM ensemble → Optuna hyperparameter tuning → log tất cả experiments vào MLflow → select best models → serialize.',
          '**Phase C — Serving API (Ngày 3-4)**: FastAPI với endpoints: `POST /predict` (real-time single prediction), `POST /batch-predict` (batch), `GET /explain/{alert_id}` (SHAP explanation). Health checks, error handling, logging.',
          '**Phase D — MLOps (Ngày 4-5)**: Model versioning với MLflow Model Registry → automated retraining trigger khi data drift detected → performance dashboard với Grafana → Docker deployment.',
          '**Phase E — Testing & Documentation (Ngày 5-7)**: Unit tests cho feature engineering và API endpoints → Integration tests → README với architecture diagram → Performance benchmarks.',
        ],
        highlights: [
          {
            type: 'tip',
            text: 'Tiệm cận từ simple → complex. Ngày 1: end-to-end pipeline với baseline IF. Ngày 3: add XGBoost + SHAP. Ngày 5: add LSTM + MLOps. Iterative development, không phải big bang.',
          },
        ],
      },
    },

    /* ───── 4. Data Pipeline ───── */
    {
      id: 'data-pipeline-code',
      title: '4. Code: Data Pipeline',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'src/data/pipeline.py',
        description: 'Production-grade data pipeline với validation và logging',
        code: `"""
Data pipeline: raw Zeek logs → features → train/test splits.
"""
import logging
from pathlib import Path
from typing import Tuple
import pandas as pd
import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

logger = logging.getLogger(__name__)


def parse_zeek_conn_log(log_path: Path) -> pd.DataFrame:
    """Parse Zeek conn.log thành pandas DataFrame."""
    COLUMNS = [
        'ts', 'uid', 'id.orig_h', 'id.orig_p',
        'id.resp_h', 'id.resp_p', 'proto',
        'orig_bytes', 'resp_bytes', 'duration',
        'orig_pkts', 'resp_pkts', 'conn_state',
    ]

    df = pd.read_csv(
        log_path, sep='\\t', comment='#',
        names=COLUMNS, low_memory=False,
    )
    df['ts'] = pd.to_datetime(df['ts'], unit='s')
    # Replace '-' (Zeek null) với NaN
    df = df.replace({'-': np.nan, '(empty)': np.nan})
    logger.info(f"Loaded {len(df):,} connections from {log_path.name}")
    return df


def build_feature_engineering_pipeline() -> Pipeline:
    """Build reproducible feature engineering pipeline."""
    from sklearn.impute import SimpleImputer
    from sklearn.preprocessing import FunctionTransformer

    def log_transform(X: np.ndarray) -> np.ndarray:
        return np.log1p(np.abs(X))

    return Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('log_transform', FunctionTransformer(log_transform)),
        ('scaler', StandardScaler()),
    ])


def prepare_features(
    df: pd.DataFrame,
    window_minutes: int = 1,
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Aggregate connections theo time window và extract features.

    Returns:
        X: feature matrix (n_windows, n_features)
        timestamps: timestamp của mỗi window
    """
    def safe_nunique(x: pd.Series) -> int:
        return x.nunique()

    df = df.copy()
    df['time_window'] = df['ts'].dt.floor(f'{window_minutes}min')

    features = df.groupby('time_window').agg(
        connection_count=('uid', 'count'),
        unique_src_ips=('id.orig_h', safe_nunique),
        unique_dst_ips=('id.resp_h', safe_nunique),
        unique_dst_ports=('id.resp_p', safe_nunique),
        total_orig_bytes=('orig_bytes', 'sum'),
        total_resp_bytes=('resp_bytes', 'sum'),
        avg_duration=('duration', 'mean'),
        failed_connections=('conn_state', lambda x: (x == 'REJ').sum()),
    ).fillna(0)

    # Derived features
    features['bytes_ratio'] = (
        (features['total_orig_bytes'] + 1) /
        (features['total_resp_bytes'] + 1)
    )
    features['port_diversity'] = (
        features['unique_dst_ports'] / (features['connection_count'] + 1)
    )

    logger.info(f"Feature matrix: {features.shape}")
    return features, features.index.to_series()


def validate_data_quality(df: pd.DataFrame) -> None:
    """Raise ValueError nếu data quality không đạt."""
    checks = {
        'no_empty_df': len(df) > 0,
        'min_samples': len(df) >= 100,
        'no_all_null_cols': df.isnull().all(axis=0).sum() == 0,
        'no_inf_values': not np.isinf(df.select_dtypes(include=np.number)).any().any(),
    }
    failed = [name for name, ok in checks.items() if not ok]
    if failed:
        raise ValueError(f"Data quality checks failed: {failed}")
    logger.info("All data quality checks passed ✓")`,
        output: `INFO: Loaded 1,234,567 connections from conn.log
INFO: Feature matrix: (43826, 10)
INFO: All data quality checks passed ✓`,
      },
    },

    /* ───── 5. FastAPI ───── */
    {
      id: 'fastapi-code',
      title: '5. Code: FastAPI Serving với SHAP Explanation',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'src/api/main.py',
        description: 'Production FastAPI server với prediction và explanation endpoints',
        code: `"""
FastAPI serving endpoints cho anomaly detection model.
"""
from contextlib import asynccontextmanager
from typing import AsyncIterator
import numpy as np
import pandas as pd
import shap
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import mlflow.sklearn


# ─── Models ───
class PredictionRequest(BaseModel):
    features: dict[str, float] = Field(
        ...,
        example={
            'connection_count': 312,
            'unique_dst_ports': 47,
            'failed_connections': 23,
            'bytes_ratio': 1.23,
        },
    )

class PredictionResponse(BaseModel):
    anomaly_score: float
    is_anomaly: bool
    confidence: str  # HIGH / MEDIUM / LOW
    threshold: float

class ExplanationResponse(BaseModel):
    top_features: list[dict[str, float | str]]
    baseline_score: float
    final_score: float
    human_readable: str


# ─── App lifecycle ───
app_state: dict = {}

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Load model và explainer khi startup."""
    import logging
    logger = logging.getLogger(__name__)

    logger.info("Loading model from MLflow registry...")
    model = mlflow.sklearn.load_model("models:/anomaly_detector/Production")
    explainer = shap.TreeExplainer(model)

    # Load threshold từ MLflow params
    threshold = 0.35  # từ F2-optimal tuning

    app_state['model'] = model
    app_state['explainer'] = explainer
    app_state['threshold'] = threshold
    logger.info("Model loaded successfully ✓")

    yield  # App running

    app_state.clear()
    logger.info("Model unloaded")


app = FastAPI(
    title="Network Anomaly Detection API",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/health")
async def health_check() -> dict:
    return {"status": "healthy", "model_loaded": 'model' in app_state}


@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest) -> PredictionResponse:
    """Real-time prediction cho một network window."""
    model = app_state.get('model')
    threshold = app_state.get('threshold', 0.35)

    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    X = pd.DataFrame([request.features])
    anomaly_score = float(model.predict_proba(X)[0, 1])

    confidence = (
        "HIGH" if abs(anomaly_score - threshold) > 0.3
        else "MEDIUM" if abs(anomaly_score - threshold) > 0.15
        else "LOW"
    )

    return PredictionResponse(
        anomaly_score=round(anomaly_score, 4),
        is_anomaly=anomaly_score >= threshold,
        confidence=confidence,
        threshold=threshold,
    )


@app.get("/explain/{alert_id}", response_model=ExplanationResponse)
async def explain_alert(alert_id: str) -> ExplanationResponse:
    """SHAP explanation cho một alert đã được store."""
    # Trong production: fetch từ database bằng alert_id
    # Demo: return mock explanation
    raise HTTPException(status_code=501, detail="Fetch alert store first")`,
        output: `INFO:     Started server process [12345]
INFO:     Loading model from MLflow registry...
INFO:     Model loaded successfully ✓
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000

POST /predict HTTP/1.1  200 OK
{"anomaly_score": 0.8712, "is_anomaly": true, "confidence": "HIGH", "threshold": 0.35}`,
      },
    },

    /* ───── 6. MLflow Tracking ───── */
    {
      id: 'mlflow-tracking',
      title: '6. MLflow Experiment Tracking',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'src/training/trainer.py',
        description: 'Training với MLflow logging — track mọi experiment',
        code: `import mlflow
import mlflow.sklearn
import mlflow.xgboost
from sklearn.metrics import average_precision_score
import xgboost as xgb
import optuna

MLFLOW_TRACKING_URI = "http://localhost:5000"
EXPERIMENT_NAME = "network_anomaly_detection"

mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
mlflow.set_experiment(EXPERIMENT_NAME)


def train_with_tracking(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_val: pd.DataFrame,
    y_val: pd.Series,
    hyperparams: dict | None = None,
) -> tuple[xgb.XGBClassifier, str]:
    """Train XGBoost với full MLflow tracking."""

    with mlflow.start_run() as run:
        run_id = run.info.run_id
        mlflow.set_tags({
            'model_type': 'xgboost',
            'purpose': 'anomaly_detection',
            'data_version': '2024-01',
        })

        # Default params nếu không provide
        params = hyperparams or {
            'n_estimators': 500,
            'learning_rate': 0.05,
            'max_depth': 6,
            'scale_pos_weight': (y_train == 0).sum() / (y_train == 1).sum(),
            'tree_method': 'hist',
            'random_state': 42,
        }

        # Log tất cả hyperparameters
        mlflow.log_params(params)

        # Log data info
        mlflow.log_params({
            'n_train': len(X_train),
            'n_val': len(X_val),
            'anomaly_rate_train': f"{(y_train==1).mean():.4f}",
            'n_features': X_train.shape[1],
        })

        # Train
        model = xgb.XGBClassifier(**params)
        model.fit(
            X_train, y_train,
            eval_set=[(X_val, y_val)],
            early_stopping_rounds=50,
            verbose=False,
        )

        # Log metrics
        y_prob = model.predict_proba(X_val)[:, 1]
        pr_auc = average_precision_score(y_val, y_prob)
        mlflow.log_metrics({
            'val_pr_auc': pr_auc,
            'best_iteration': model.best_iteration,
        })

        # Log model artifact
        mlflow.xgboost.log_model(
            model,
            "model",
            registered_model_name="anomaly_detector",
        )

        # Log feature names
        mlflow.log_dict(
            {'features': X_train.columns.tolist()},
            "features.json",
        )

        print(f"Run ID: {run_id}")
        print(f"Val PR-AUC: {pr_auc:.4f}")
        return model, run_id`,
        output: `2024/01/15 10:23:45 INFO mlflow.tracking: Experiment ID: 1
Training XGBoost...
Run ID: a1b2c3d4e5f6...
Val PR-AUC: 0.7156

MLflow UI: http://localhost:5000/#/experiments/1/runs/a1b2c3d4e5f6`,
      },
    },

    /* ───── 7. Capstone Checklist ───── */
    {
      id: 'capstone-checklist',
      title: '7. Capstone Completion Checklist',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          '**Data Pipeline** ✓: Parse raw logs → validate → engineer features → EDA report automated',
          '**Training Pipeline** ✓: TimeSeriesSplit CV → Optuna tuning → ensemble (IF + XGB) → MLflow tracking',
          '**Explainability** ✓: SHAP global importance + per-alert explanation → human-readable text',
          '**API** ✓: FastAPI với /predict, /explain, /health → error handling → async → logging',
          '**MLOps** ✓: MLflow experiment tracking → model versioning → drift detection → retrain trigger',
          '**Testing** ✓: Unit tests (pytest) cho data pipeline + API endpoints → integration tests',
          '**Documentation** ✓: README với setup instructions + architecture diagram + API docs',
          '**Docker** ✓: `docker-compose up` để chạy toàn bộ stack (API + MLflow + Prometheus)',
        ],
        highlights: [
          {
            type: 'important',
            text: 'Capstone project là portfolio highlight. Đưa lên GitHub với good README. Này là bằng chứng bạn có thể build production ML system — không chỉ notebook demo.',
          },
        ],
      },
    },
  ],

  quiz: [
    {
      id: 'q19-1',
      type: 'multiple-choice',
      question: 'Tại sao dùng MLflow experiment tracking thay vì chỉ save model file?',
      options: [
        'MLflow nhanh hơn',
        'Track cả hyperparameters, metrics, code version → reproduce và compare experiments',
        'MLflow tự động tune hyperparameters',
        'Chỉ cần khi làm việc nhóm',
      ],
      correctAnswer: 'Track cả hyperparameters, metrics, code version → reproduce và compare experiments',
      explanation:
        'MLflow solve reproducibility problem: 3 tháng sau, bạn cần biết model này được train với params nào, data nào, metrics trên validation. Save model file không catch được. MLflow track: params, metrics, artifacts, code version, environment → full reproducibility. Cũng enable comparison giữa nhiều experiments.',
    },
    {
      id: 'q19-2',
      type: 'multiple-choice',
      question: 'FastAPI `lifespan` context manager dùng để làm gì trong serving API?',
      options: [
        'Định nghĩa timeout cho mỗi request',
        'Load model một lần khi startup, unload khi shutdown — không reload mỗi request',
        'Authenticate requests',
        'Rate limiting',
      ],
      correctAnswer: 'Load model một lần khi startup, unload khi shutdown — không reload mỗi request',
      explanation:
        'Nếu load model trong mỗi request handler → tốn 2-5 giây mỗi request. Với lifespan: model load 1 lần khi server start → trong memory → mỗi request chỉ cần inference (~ms). Pattern chuẩn cho ML serving. app_state dict dùng để share model giữa requests.',
    },
    {
      id: 'q19-3',
      type: 'multiple-choice',
      question: 'Tại sao cần validate_data_quality() trước khi train?',
      options: [
        'Để tăng training speed',
        'Phát hiện sớm data issues (empty, all-null cols, inf values) → fail fast, rõ error',
        'Để encrypt data',
        'Vì sklearn yêu cầu',
      ],
      correctAnswer: 'Phát hiện sớm data issues (empty, all-null cols, inf values) → fail fast, rõ error',
      explanation:
        '"Fail fast" principle: tốt hơn là crash sớm với clear error message thay vì train xong mới phát hiện model kém vì data xấu. validate_data_quality() check basic invariants → nếu fail, report ngay với meaningful message. Defensive programming cho ML pipelines.',
    },
    {
      id: 'q19-4',
      type: 'multiple-choice',
      question: 'Integration tests trong ML API project nên test điều gì?',
      options: [
        'Chỉ test business logic trong isolation',
        'Entire request flow from HTTP endpoint → model prediction → response format',
        'Chỉ test database queries',
        'Chỉ test model accuracy',
      ],
      correctAnswer: 'Entire request flow from HTTP endpoint → model prediction → response format',
      explanation:
        'Unit tests: test individual functions isolated. Integration tests: test components TOGETHER. Với FastAPI ML API: start test server → send HTTP request → check response format + values → check model actually runs. httpx.AsyncClient hoặc TestClient từ FastAPI/starlette. Bắt được nhiều bugs unit tests bỏ sót (serialization, model loading, etc).',
    },
    {
      id: 'q19-5',
      type: 'multiple-choice',
      question: 'Trong production ML, "concept drift" nghĩa là gì?',
      options: [
        'Model code bị thay đổi',
        'Statistical relationship giữa features và target thay đổi theo thời gian',
        'Database schema thay đổi',
        'Server bị quá tải',
      ],
      correctAnswer: 'Statistical relationship giữa features và target thay đổi theo thời gian',
      explanation:
        'Attack patterns tiến hóa → distribution của anomaly thay đổi. Model train trên 2023 data không necessarily work tốt trên 2024 patterns mới. Monitor: so sánh prediction distribution hàng tuần, so sánh feature statistics với training baseline. Trigger retrain khi drift vượt threshold (PSI, KL divergence ≥ threshold).',
    },
  ],
};
