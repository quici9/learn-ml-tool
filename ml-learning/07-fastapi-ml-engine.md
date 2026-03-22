# Tài liệu 07: FastAPI – Xây dựng ML Engine REST API

> **Mục tiêu:** Đóng gói ML model vào REST API với FastAPI – service Python mà NestJS backend sẽ gọi.
> **Thời gian học:** 3-4 ngày | **Yêu cầu:** Đã hoàn thành Tài liệu 01-06

---

## Mục lục

1. [Tại sao FastAPI?](#1-tại-sao-fastapi)
2. [So sánh NestJS vs FastAPI](#2-so-sánh-nestjs-vs-fastapi)
3. [Cài đặt và Project Structure](#3-cài-đặt-và-project-structure)
4. [Hello World API](#4-hello-world-api)
5. [Request/Response Schema với Pydantic](#5-requestresponse-schema-với-pydantic)
6. [Tích hợp ML Model vào API](#6-tích-hợp-ml-model-vào-api)
7. [Health Check & Model Info](#7-health-check--model-info)
8. [Background Tasks](#8-background-tasks)
9. [Error Handling](#9-error-handling)
10. [Docker Deployment](#10-docker-deployment)
11. [Bài tập thực hành](#11-bài-tập-thực-hành)

---

## 1. Tại sao FastAPI?

| Tiêu chí | Flask | Django REST | FastAPI |
|---|---|---|---|
| Tốc độ | Trung bình | Chậm | **Nhanh nhất** (async) |
| Type safety | Không | Partial | **Pydantic (strict)** |
| Auto docs | Plugin | Plugin | **Tự động (Swagger)** |
| Async native | Không | Django 4.1+ | **Có** |
| Learning curve | Thấp | Cao | **Trung bình** |
| ML integration | Phổ biến | Hiếm | **Phổ biến nhất cho ML** |

**Kết luận:** FastAPI là lựa chọn hàng đầu cho ML API vì type-safe, nhanh, và tự sinh docs.

---

## 2. So sánh NestJS vs FastAPI

Bạn đã quen NestJS – FastAPI rất giống nhưng đơn giản hơn:

### Controller/Route

```typescript
// NestJS: dùng decorator @Controller, @Get, @Post
@Controller('api/v1/alerts')
export class AlertsController {
  @Get()
  findAll(@Query('status') status: string): Promise<Alert[]> {
    return this.alertsService.findAll(status);
  }

  @Post()
  create(@Body() dto: CreateAlertDto): Promise<Alert> {
    return this.alertsService.create(dto);
  }
}
```

```python
# FastAPI: dùng decorator @app.get, @app.post
from fastapi import FastAPI, Query

app = FastAPI()

@app.get("/api/v1/alerts")
async def find_all(status: str = Query(None)):
    return await alerts_service.find_all(status)

@app.post("/api/v1/alerts")
async def create(dto: CreateAlertDto):
    return await alerts_service.create(dto)
```

### DTO / Schema Validation

```typescript
// NestJS: class-validator + class-transformer
export class CreateAlertDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNumber()
  @Min(1) @Max(5)
  severity: number;
}
```

```python
# FastAPI: Pydantic model (tương đương class-validator)
from pydantic import BaseModel, Field

class CreateAlertDto(BaseModel):
    title: str = Field(..., min_length=1)
    severity: int = Field(..., ge=1, le=5)
```

### Dependency Injection

```typescript
// NestJS: constructor injection
@Injectable()
export class AlertsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}
}
```

```python
# FastAPI: Depends() function
from fastapi import Depends

def get_model_service():
    return ModelService()

@app.post("/predict")
async def predict(service: ModelService = Depends(get_model_service)):
    return service.predict(data)
```

---

## 3. Cài đặt và Project Structure

```bash
# Tạo project
mkdir ml-engine && cd ml-engine
python -m venv venv
source venv/bin/activate

# Cài đặt
pip install fastapi uvicorn scikit-learn pandas numpy joblib pydantic
```

### Project Structure

```
ml-engine/
├── app/
│   ├── __init__.py
│   ├── main.py              # Entry point (giống main.ts)
│   ├── config.py             # Environment config
│   ├── models/               # ML models (giống models/ trong NestJS)
│   │   ├── __init__.py
│   │   └── anomaly_detector.py
│   ├── schemas/              # Pydantic schemas (giống DTOs)
│   │   ├── __init__.py
│   │   └── detection.py
│   ├── services/             # Business logic
│   │   ├── __init__.py
│   │   └── detection_service.py
│   └── routers/              # API routes (giống controllers)
│       ├── __init__.py
│       └── detection.py
├── trained_models/           # Saved ML models (.pkl files)
│   └── isolation_forest/
│       └── v1.0/
│           ├── pipeline.pkl
│           └── metadata.json
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
```

---

## 4. Hello World API

```python
# app/main.py
from fastapi import FastAPI
from contextlib import asynccontextmanager

# Startup/shutdown logic (giống NestJS OnModuleInit/OnModuleDestroy)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: load model, connect DB, etc.
    print("ML Engine starting up...")
    yield
    # Shutdown: cleanup resources
    print("ML Engine shutting down...")

app = FastAPI(
    title="PT186S ML Engine",
    description="Anomaly Detection API for PT186S SOC Platform",
    version="1.0.0",
    lifespan=lifespan,
)

@app.get("/")
async def root():
    return {"message": "PT186S ML Engine is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

```bash
# Chạy server (giống npm run start:dev)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Truy cập:
# http://localhost:8000        → root endpoint
# http://localhost:8000/docs   → Swagger UI (tự sinh!)
# http://localhost:8000/redoc  → ReDoc (alternative docs)
```

---

## 5. Request/Response Schema với Pydantic

```python
# app/schemas/detection.py
from pydantic import BaseModel, Field
from datetime import datetime

# === Request Schemas ===

class NetworkRecord(BaseModel):
    """Một record kết nối mạng (mapping từ Zeek conn.log)."""
    source_ip: str = Field(..., examples=["10.0.0.1"])
    dest_ip: str = Field(..., examples=["8.8.8.8"])
    dest_port: int = Field(..., ge=0, le=65535, examples=[443])
    protocol: str = Field(..., pattern="^(tcp|udp|icmp)$", examples=["tcp"])
    service: str = Field("-", examples=["http"])
    duration: float = Field(0.0, ge=0, examples=[1.23])
    orig_bytes: int = Field(0, ge=0, examples=[1024])
    resp_bytes: int = Field(0, ge=0, examples=[4096])
    conn_state: str = Field("OTH", examples=["SF"])


class DetectionRequest(BaseModel):
    """Request body cho batch anomaly detection."""
    organization_id: str = Field(..., examples=["org-001"])
    records: list[NetworkRecord] = Field(..., min_length=1, max_length=10000)
    threshold: float | None = Field(None, ge=-1, le=0, examples=[-0.5])


# === Response Schemas ===

class AnomalyResult(BaseModel):
    """Kết quả prediction cho 1 source_ip."""
    source_ip: str
    is_anomaly: bool
    anomaly_score: float = Field(..., description="Càng thấp càng bất thường")
    connection_count: int
    top_features: dict[str, float] = Field(
        default_factory=dict,
        description="Top features đóng góp vào kết quả"
    )


class DetectionResponse(BaseModel):
    """Response cho batch anomaly detection."""
    organization_id: str
    model_version: str
    total_ips_analyzed: int
    anomalies_detected: int
    results: list[AnomalyResult]
    analyzed_at: datetime
```

---

## 6. Tích hợp ML Model vào API

### Service: Load và Predict

```python
# app/services/detection_service.py
import joblib
import json
import numpy as np
import pandas as pd
from pathlib import Path
from app.schemas.detection import NetworkRecord, AnomalyResult

FEATURE_COLUMNS = [
    "connection_count", "unique_dest_ips", "unique_dest_ports",
    "avg_duration", "max_duration", "std_duration",
    "total_orig_bytes", "total_resp_bytes", "avg_orig_bytes",
    "bytes_ratio", "port_diversity",
]

class DetectionService:
    """Service quản lý ML model và thực hiện prediction."""

    def __init__(self, model_dir: str = "trained_models/isolation_forest/v1.0"):
        self.model_dir = Path(model_dir)
        self.pipeline = None
        self.metadata = None

    def load_model(self) -> None:
        """Load model từ disk (gọi khi startup)."""
        model_path = self.model_dir / "pipeline.pkl"
        metadata_path = self.model_dir / "metadata.json"

        if not model_path.exists():
            raise FileNotFoundError(f"Model not found: {model_path}")

        self.pipeline = joblib.load(model_path)
        with open(metadata_path, "r") as f:
            self.metadata = json.load(f)

        print(f"Model loaded: v{self.metadata['version']}")

    def extract_features(self, records: list[NetworkRecord]) -> pd.DataFrame:
        """Chuyển raw records thành feature table."""
        data = [r.model_dump() for r in records]
        df = pd.DataFrame(data)

        # Aggregate per source_ip
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
        ).reset_index()

        features["bytes_ratio"] = (
            features["total_orig_bytes"] / (features["total_resp_bytes"] + 1)
        )
        features["port_diversity"] = (
            features["unique_dest_ports"] / features["connection_count"]
        )
        features = features.fillna(0)

        return features

    def predict(
        self,
        records: list[NetworkRecord],
        threshold: float | None = None,
    ) -> list[AnomalyResult]:
        """Phát hiện anomaly từ danh sách network records."""
        if self.pipeline is None:
            raise RuntimeError("Model not loaded. Call load_model() first.")

        features = self.extract_features(records)
        X = features[FEATURE_COLUMNS].values.astype(float)
        source_ips = features["source_ip"].tolist()

        # Predict
        scores = self.pipeline.score_samples(X)

        if threshold is not None:
            predictions = scores < threshold
        else:
            raw_preds = self.pipeline.predict(X)
            predictions = raw_preds == -1

        # Build results
        results: list[AnomalyResult] = []
        for i, ip in enumerate(source_ips):
            top_feats = {
                col: float(X[i, j])
                for j, col in enumerate(FEATURE_COLUMNS)
            }
            results.append(AnomalyResult(
                source_ip=ip,
                is_anomaly=bool(predictions[i]),
                anomaly_score=float(scores[i]),
                connection_count=int(features.iloc[i]["connection_count"]),
                top_features=top_feats,
            ))

        # Sort: anomalies first, by score ascending
        results.sort(key=lambda r: (not r.is_anomaly, r.anomaly_score))
        return results
```

### Router: API Endpoints

```python
# app/routers/detection.py
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from app.schemas.detection import DetectionRequest, DetectionResponse
from app.services.detection_service import DetectionService

router = APIRouter(prefix="/api/v1/detection", tags=["Detection"])

# Singleton service (giống NestJS singleton provider)
detection_service = DetectionService()


@router.post("/analyze", response_model=DetectionResponse)
async def analyze_batch(request: DetectionRequest):
    """
    Phân tích batch network records, trả về danh sách anomaly.
    Endpoint chính mà NestJS backend gọi.
    """
    try:
        results = detection_service.predict(
            records=request.records,
            threshold=request.threshold,
        )

        anomaly_count = sum(1 for r in results if r.is_anomaly)

        return DetectionResponse(
            organization_id=request.organization_id,
            model_version=detection_service.metadata["version"],
            total_ips_analyzed=len(results),
            anomalies_detected=anomaly_count,
            results=results,
            analyzed_at=datetime.now(),
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
```

### Kết nối trong main.py

```python
# app/main.py (cập nhật)
from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.routers import detection

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load model khi startup
    detection.detection_service.load_model()
    print("ML Engine ready!")
    yield
    print("ML Engine shutting down...")

app = FastAPI(
    title="PT186S ML Engine",
    version="1.0.0",
    lifespan=lifespan,
)

# Register routers (giống app.module imports)
app.include_router(detection.router)
```

---

## 7. Health Check & Model Info

```python
# app/routers/health.py
from fastapi import APIRouter
from app.routers.detection import detection_service

router = APIRouter(tags=["Health"])

@router.get("/health")
async def health_check():
    """Health check cho Docker/Kubernetes."""
    model_loaded = detection_service.pipeline is not None
    return {
        "status": "healthy" if model_loaded else "degraded",
        "model_loaded": model_loaded,
    }

@router.get("/model/info")
async def model_info():
    """Thông tin model hiện tại."""
    if detection_service.metadata is None:
        return {"error": "No model loaded"}
    return detection_service.metadata
```

---

## 8. Background Tasks

Dùng cho training model – không block API response:

```python
from fastapi import BackgroundTasks

@router.post("/model/retrain")
async def trigger_retrain(
    background_tasks: BackgroundTasks,
    organization_id: str,
):
    """Trigger retrain model (chạy background, không block response)."""
    background_tasks.add_task(retrain_model, organization_id)
    return {"message": "Retraining started", "organization_id": organization_id}

async def retrain_model(organization_id: str):
    """Background task: fetch data → train → save model."""
    print(f"Retraining model for org: {organization_id}")
    # 1. Fetch data từ Elasticsearch
    # 2. Feature engineering
    # 3. Train Isolation Forest
    # 4. Save model
    # 5. Reload model
    print(f"Retraining complete for org: {organization_id}")
```

---

## 9. Error Handling

```python
# app/main.py (thêm exception handlers)
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global error handler (giống NestJS ExceptionFilter)."""
    return JSONResponse(
        status_code=500,
        content={
            "data": None,
            "error": {
                "message": str(exc),
                "type": type(exc).__name__,
            },
            "meta": {}
        },
    )
```

---

## 10. Docker Deployment

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Non-root user (security best practice)
RUN adduser --disabled-password --gecos "" appuser
USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```yaml
# docker-compose.yml (thêm vào docker-compose hiện tại)
services:
  ml-engine:
    build:
      context: ./ml-engine
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - ./ml-engine/trained_models:/app/trained_models
    environment:
      - MODEL_DIR=/app/trained_models/isolation_forest/v1.0
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - pt186s-network
```

NestJS backend gọi ML Engine:

```typescript
// backend/src/ml/ml.service.ts (NestJS side)
@Injectable()
export class MlService {
  private readonly mlEngineUrl = process.env.ML_ENGINE_URL || 'http://ml-engine:8000';

  async detectAnomalies(organizationId: string, records: ZeekRecord[]): Promise<DetectionResult> {
    const response = await fetch(`${this.mlEngineUrl}/api/v1/detection/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organization_id: organizationId, records }),
    });
    return response.json();
  }
}
```

---

## 11. Bài tập thực hành

### Bài 1: Tạo endpoint GET /api/v1/detection/history

Trả về list các lần detection gần nhất (lưu in-memory). Khi `/analyze` được gọi, lưu kết quả vào history.

### Bài 2: Thêm pagination

Thêm query params `page` và `limit` cho response results. Ví dụ: `?page=1&limit=20`.

### Bài 3: Gọi từ NestJS

Viết NestJS service gọi ML Engine API, xử lý response, và tạo Alert trong database (sử dụng existing AlertsService).

---

> **Tài liệu tiếp theo:** [08 – Elasticsearch Python Client: Đọc dữ liệu mạng](./08-elasticsearch-python-client.md)
