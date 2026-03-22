import type { Lesson } from '../types/lesson';

export const lesson07: Lesson = {
  id: '07-fastapi-ml-engine',
  number: 7,
  title: 'FastAPI – ML Engine',
  description:
    'Xây dựng REST API phục vụ ML model với FastAPI – async, type-safe, auto-docs',
  phase: 'phase-2',
  estimatedTime: '4-5 ngày',
  prerequisites: ['04-ml-fundamentals', '05-sklearn-anomaly-detection', '06-feature-engineering'],

  sections: [
    /* ───── 1. Why FastAPI ───── */
    {
      id: 'why-fastapi',
      title: '1. Tại sao chọn FastAPI?',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          '**FastAPI** là framework Python hiện đại nhất để xây dựng REST API. Ưu điểm: **async native**, **tự động sinh API docs** (Swagger/OpenAPI), và **type validation** qua Pydantic.',
          'Trong PT186S, FastAPI đóng vai trò **ML Engine** – nhận dữ liệu từ NestJS Backend, chạy prediction qua model, trả kết quả.',
          'Convention: `import fastapi`, project structure theo domain (routers, schemas, services, models).',
        ],
        highlights: [
          {
            type: 'info',
            text: 'FastAPI + Pydantic = tương đương NestJS + class-validator. Cùng pattern, khác ngôn ngữ.',
          },
        ],
      },
    },

    /* ───── 2. FastAPI vs NestJS ───── */
    {
      id: 'fastapi-vs-nestjs',
      title: 'FastAPI ↔ NestJS',
      type: 'comparison-table',
      content: {
        kind: 'comparison-table',
        headers: ['Tiêu chí', 'FastAPI (Python)', 'NestJS (TypeScript)'],
        rows: [
          ['Routing', '@app.get("/path")', '@Get("/path")'],
          ['Validation', 'Pydantic BaseModel', 'class-validator + DTOs'],
          ['DI', 'Depends()', '@Injectable() + constructor injection'],
          ['Async', 'async def + await (native)', 'async/await (native)'],
          ['API Docs', 'Auto Swagger/ReDoc tại /docs', 'Cần setup @nestjs/swagger'],
          ['Type Safety', 'Type hints + Pydantic', 'TypeScript + decorators'],
          ['Middleware', 'ASGI middleware', 'NestJS middleware/guards'],
          ['Performance', 'Starlette + uvicorn (rất nhanh)', 'Express/Fastify'],
        ],
        caption: 'FastAPI và NestJS chia sẻ nhiều pattern – chuyển đổi tương đối dễ',
      },
    },

    /* ───── 3. Project Structure ───── */
    {
      id: 'project-structure',
      title: '2. Project Structure',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'project_layout.txt',
        description:
          'Cấu trúc project FastAPI cho ML Engine, tổ chức theo domain giống NestJS modules.',
        code: `# ml-engine/
# ├── app/
# │   ├── __init__.py
# │   ├── main.py              # Entry point, CORS, routers
# │   ├── config.py            # Settings (env vars)
# │   ├── routers/
# │   │   ├── health.py        # Health check endpoints
# │   │   ├── predict.py       # Prediction endpoints
# │   │   └── training.py      # Training endpoints
# │   ├── schemas/
# │   │   ├── predict.py       # Pydantic request/response models
# │   │   └── training.py
# │   ├── services/
# │   │   ├── ml_service.py    # ML model logic
# │   │   └── es_service.py    # Elasticsearch client
# │   └── models/              # Saved ML models (.joblib)
# ├── requirements.txt
# ├── Dockerfile
# └── docker-compose.yml`,
      },
    },

    /* ───── 4. Hello World API ───── */
    {
      id: 'hello-world',
      title: '3. Hello World API',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'app/main.py',
        description:
          'Entry point của FastAPI app. Tương đương main.ts trong NestJS. CORS, routers, startup events.',
        code: `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="PT186S ML Engine",
    description="Anomaly Detection API",
    version="1.0.0",
)

# CORS – cho phép NestJS backend gọi
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # NestJS backend
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "ML Engine is running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": True}

# Chạy: uvicorn app.main:app --reload --port 8000
# Docs tự động: http://localhost:8000/docs`,
        output: `INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
# Truy cập http://localhost:8000/docs → Swagger UI tự động!`,
      },
    },

    /* ───── 5. Pydantic Schemas ───── */
    {
      id: 'pydantic-schemas',
      title: '4. Pydantic Schemas (Validation)',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'app/schemas/predict.py',
        description:
          'Pydantic = class-validator + DTOs trong NestJS. Tự động validate request body và serialize response.',
        code: `from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

# === Request Schema (giống CreateDto trong NestJS) ===
class PredictionRequest(BaseModel):
    source_ip: str = Field(..., description="Source IP address")
    connection_count: int = Field(..., ge=0, description="Total connections")
    unique_dest_ports: int = Field(..., ge=0)
    avg_duration: float = Field(..., ge=0)
    total_bytes: int = Field(..., ge=0)
    bytes_ratio: float = Field(..., ge=0)

    # Tương đương class-validator decorators
    # @IsString(), @IsInt(), @Min(0), etc.

# === Response Schema ===
class PredictionResponse(BaseModel):
    source_ip: str
    is_anomaly: bool
    anomaly_score: float = Field(..., ge=-1, le=1)
    risk_level: str       # "low" | "medium" | "high"
    model_version: str
    predicted_at: datetime

# === Pydantic tự động validate ===
# Invalid request → 422 Unprocessable Entity + chi tiết lỗi
# Giống class-validator ValidationPipe trong NestJS`,
      },
    },

    /* ───── 6. ML Model Integration ───── */
    {
      id: 'ml-integration',
      title: '5. Tích hợp ML Model',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'app/routers/predict.py',
        description:
          'Endpoint predict: nhận features → load model → chạy prediction → trả kết quả. Dùng Depends() cho dependency injection.',
        code: `from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
import joblib
import numpy as np

from app.schemas.predict import PredictionRequest, PredictionResponse

router = APIRouter(prefix="/api/v1", tags=["predictions"])

# Load model 1 lần khi startup (giống singleton trong NestJS)
MODEL_PATH = "app/models/isolation_forest_v1.joblib"
model = None
scaler = None

def get_model():
    """Dependency injection – giống @Injectable() trong NestJS"""
    global model, scaler
    if model is None:
        model = joblib.load(MODEL_PATH)
        scaler = joblib.load("app/models/scaler_v1.joblib")
    return model, scaler

@router.post("/predict", response_model=PredictionResponse)
async def predict_anomaly(
    request: PredictionRequest,
    model_scaler=Depends(get_model),
):
    model, scaler = model_scaler

    # Chuẩn bị features
    features = np.array([[
        request.connection_count,
        request.unique_dest_ports,
        request.avg_duration,
        request.total_bytes,
        request.bytes_ratio,
    ]])

    # Scale features
    features_scaled = scaler.transform(features)

    # Predict
    prediction = model.predict(features_scaled)[0]   # 1 = normal, -1 = anomaly
    score = model.score_samples(features_scaled)[0]

    is_anomaly = prediction == -1
    risk_level = "high" if score < -0.5 else ("medium" if score < -0.3 else "low")

    return PredictionResponse(
        source_ip=request.source_ip,
        is_anomaly=is_anomaly,
        anomaly_score=float(score),
        risk_level=risk_level,
        model_version="v1.0",
        predicted_at=datetime.utcnow(),
    )`,
      },
    },

    /* ───── 7. Error Handling & Background Tasks ───── */
    {
      id: 'error-handling',
      title: '6. Error Handling & Background Tasks',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'app/error_handling.py',
        description:
          'Exception handlers tập trung (giống ExceptionFilter trong NestJS) và BackgroundTasks cho tác vụ không cần đợi response.',
        code: `from fastapi import FastAPI, Request, BackgroundTasks
from fastapi.responses import JSONResponse
import logging

app = FastAPI()
logger = logging.getLogger(__name__)

# === Global Exception Handler ===
# Giống @Catch() ExceptionFilter trong NestJS
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "data": None,
            "error": {"message": "Internal server error", "type": type(exc).__name__},
            "meta": {},
        },
    )

# === Custom Exception ===
class ModelNotLoadedError(Exception):
    pass

@app.exception_handler(ModelNotLoadedError)
async def model_not_loaded_handler(request: Request, exc: ModelNotLoadedError):
    return JSONResponse(
        status_code=503,
        content={"data": None, "error": {"message": str(exc)}, "meta": {}},
    )

# === Background Tasks ===
# Giống Bull queue / @nestjs/bull nhưng đơn giản hơn
async def log_prediction(source_ip: str, score: float):
    """Ghi log prediction không cần đợi response"""
    logger.info(f"Prediction: {source_ip} → score={score}")

@app.post("/predict")
async def predict(background_tasks: BackgroundTasks):
    # ... prediction logic ...
    score = -0.42
    background_tasks.add_task(log_prediction, "10.0.0.1", score)
    return {"score": score}  # Response trả về ngay`,
      },
    },

    /* ───── 8. Docker Deployment ───── */
    {
      id: 'docker-deployment',
      title: '7. Docker Deployment',
      type: 'code',
      content: {
        kind: 'code',
        language: 'dockerfile',
        filename: 'Dockerfile',
        description:
          'Multi-stage Dockerfile cho ML Engine. Dùng slim image để giảm size, copy chỉ những gì cần.',
        code: `# === Stage 1: Build dependencies ===
FROM python:3.11-slim as builder

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# === Stage 2: Runtime ===
FROM python:3.11-slim

WORKDIR /app

# Copy dependencies từ builder
COPY --from=builder /install /usr/local

# Copy source code
COPY app/ app/

# Health check
HEALTHCHECK --interval=30s --timeout=5s \\
  CMD curl -f http://localhost:8000/health || exit 1

# Run with uvicorn
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# docker build -t ml-engine .
# docker run -p 8000:8000 ml-engine`,
      },
    },
  ],

  quiz: [
    {
      id: 'q07-1',
      type: 'multiple-choice',
      question:
        '@app.get("/items/{item_id}") trong FastAPI tương đương gì trong NestJS?',
      options: [
        '@Post("/items/:item_id")',
        '@Get("/items/:item_id")',
        '@Controller("/items/{item_id}")',
        '@Module({ path: "/items" })',
      ],
      correctAnswer: 1,
      explanation:
        'FastAPI dùng {param} thay vì :param, nhưng concept giống nhau. @app.get() = @Get() decorator trong NestJS controller.',
    },
    {
      id: 'q07-2',
      type: 'multiple-choice',
      question:
        'Pydantic BaseModel trong FastAPI tương đương gì trong NestJS?',
      options: [
        'Service (@Injectable)',
        'DTO + class-validator',
        'Guard (@CanActivate)',
        'Middleware',
      ],
      correctAnswer: 1,
      explanation:
        'Pydantic BaseModel = DTO + validation decorators. Tự động validate request body, type-check, và serialize response – giống DTO + class-validator + ValidationPipe.',
    },
    {
      id: 'q07-3',
      type: 'multiple-choice',
      question:
        'Depends() trong FastAPI dùng để làm gì?',
      options: [
        'Khai báo route path',
        'Dependency injection – inject service/model vào endpoint',
        'Define middleware',
        'Tạo database connection pool',
      ],
      correctAnswer: 1,
      explanation:
        'Depends() là cơ chế DI của FastAPI, tương đương constructor injection trong NestJS @Injectable(). Dùng để inject model, database session, auth, etc.',
    },
    {
      id: 'q07-4',
      type: 'multiple-choice',
      question:
        'Khi request body không đúng Pydantic schema, FastAPI trả về status code nào?',
      options: ['400 Bad Request', '401 Unauthorized', '422 Unprocessable Entity', '500 Internal Server Error'],
      correctAnswer: 2,
      explanation:
        'FastAPI trả về 422 Unprocessable Entity với chi tiết validation errors (field nào lỗi, lỗi gì). Tương đương ValidationPipe throwing BadRequestException trong NestJS.',
    },
    {
      id: 'q07-5',
      type: 'multiple-choice',
      question:
        'BackgroundTasks trong FastAPI phù hợp cho tác vụ nào?',
      options: [
        'Training ML model (mất 30 phút)',
        'Log prediction results, gửi notification',
        'Xử lý file upload 10GB',
        'Database migration',
      ],
      correctAnswer: 1,
      explanation:
        'BackgroundTasks phù hợp cho tác vụ nhẹ, ngắn (logging, notification). Tác vụ nặng/dài (training) nên dùng Celery + Redis (tương đương Bull queue trong NestJS).',
    },
  ],
};
