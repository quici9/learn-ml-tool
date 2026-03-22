# Tài liệu 10: PyTorch Autoencoder cho Anomaly Detection nâng cao

> **Mục tiêu:** Giới thiệu deep learning approach – Autoencoder phát hiện anomaly bằng reconstruction error.
> **Thời gian học:** 4-5 ngày | **Yêu cầu:** Đã hoàn thành Tài liệu 01-09

---

## Mục lục

1. [Autoencoder là gì?](#1-autoencoder-là-gì)
2. [Cài đặt PyTorch](#2-cài-đặt-pytorch)
3. [PyTorch cơ bản cho NestJS developers](#3-pytorch-cơ-bản-cho-nestjs-developers)
4. [Xây Autoencoder Model](#4-xây-autoencoder-model)
5. [Training Loop](#5-training-loop)
6. [Anomaly Detection bằng Reconstruction Error](#6-anomaly-detection-bằng-reconstruction-error)
7. [So sánh 3 Approaches](#7-so-sánh-3-approaches)
8. [Khi nào dùng Autoencoder?](#8-khi-nào-dùng-autoencoder)
9. [Bài tập thực hành](#9-bài-tập-thực-hành)

---

## 1. Autoencoder là gì?

### Trực giác

Tưởng tượng bạn nén file ZIP rồi giải nén:

```
File gốc (100KB) → ZIP (20KB) → Giải nén (100KB) → Giống hệt file gốc
```

Autoencoder hoạt động tương tự nhưng cho dữ liệu mạng:

```
Network features (13 số) → Encoder (nén xuống 5 số) → Decoder (giải nén lại 13 số)

Nếu dữ liệu BÌNH THƯỜNG:
  Input:  [1.2, 0.3, 500, 80, 0.5, ...]
  Output: [1.1, 0.3, 498, 80, 0.5, ...]  → Gần giống → OK

Nếu dữ liệu BẤT THƯỜNG:
  Input:  [0.001, 200, 50000, 4444, 0.99, ...]
  Output: [1.5, 3.2, 800, 120, 0.3, ...]  → Rất khác → ANOMALY!
```

**Nguyên lý:** Model học cách nén/giải nén dữ liệu bình thường. Khi gặp dữ liệu bất thường (chưa từng thấy), nó "giải nén" sai → reconstruction error cao → đó là anomaly.

---

## 2. Cài đặt PyTorch

```bash
# CPU only (đủ cho PT186S vì data không quá lớn)
pip install torch --index-url https://download.pytorch.org/whl/cpu

# Nếu có GPU NVIDIA:
# pip install torch --index-url https://download.pytorch.org/whl/cu121
```

---

## 3. PyTorch cơ bản cho NestJS developers

### Tensor = Array đặc biệt

```python
import torch
import numpy as np

# Tạo tensor (giống numpy array nhưng có thể chạy trên GPU)
x = torch.tensor([1.0, 2.0, 3.0])
print(x)  # tensor([1., 2., 3.])

# Từ numpy array
np_array = np.array([1.0, 2.0, 3.0])
x = torch.from_numpy(np_array)

# Tensor operations (giống numpy)
y = x * 2 + 1
print(y)  # tensor([3., 5., 7.])
```

### Module = Class/Service

```python
import torch.nn as nn

# PyTorch nn.Module = NestJS @Injectable() Service
class MyModel(nn.Module):
    def __init__(self, input_size: int, hidden_size: int):
        super().__init__()  # Gọi parent constructor
        self.layer1 = nn.Linear(input_size, hidden_size)
        self.layer2 = nn.Linear(hidden_size, input_size)
        self.relu = nn.ReLU()

    def forward(self, x):
        """Forward pass (giống service method)."""
        x = self.relu(self.layer1(x))
        x = self.layer2(x)
        return x

model = MyModel(input_size=13, hidden_size=5)
print(f"Model parameters: {sum(p.numel() for p in model.parameters())}")
```

---

## 4. Xây Autoencoder Model

```python
import torch
import torch.nn as nn

class NetworkAutoencoder(nn.Module):
    """
    Autoencoder cho network anomaly detection.

    Architecture:
      Input(13) → 10 → 7 → 4 (bottleneck) → 7 → 10 → Output(13)
    """

    def __init__(self, input_dim: int = 13):
        super().__init__()

        # Encoder: nén từ input_dim xuống 4
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 10),
            nn.ReLU(),
            nn.Linear(10, 7),
            nn.ReLU(),
            nn.Linear(7, 4),   # Bottleneck: chỉ giữ 4 features quan trọng nhất
        )

        # Decoder: giải nén từ 4 về input_dim
        self.decoder = nn.Sequential(
            nn.Linear(4, 7),
            nn.ReLU(),
            nn.Linear(7, 10),
            nn.ReLU(),
            nn.Linear(10, input_dim),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Encode rồi decode: x → z → x_reconstructed."""
        z = self.encoder(x)        # Nén
        x_recon = self.decoder(z)  # Giải nén
        return x_recon

    def get_reconstruction_error(self, x: torch.Tensor) -> torch.Tensor:
        """Tính reconstruction error cho mỗi sample."""
        x_recon = self.forward(x)
        # MSE per sample (không average qua samples)
        error = torch.mean((x - x_recon) ** 2, dim=1)
        return error


# Tạo model
model = NetworkAutoencoder(input_dim=13)
print(model)
```

---

## 5. Training Loop

```python
import torch
from torch.utils.data import DataLoader, TensorDataset
from sklearn.preprocessing import StandardScaler
import numpy as np

# === Chuẩn bị dữ liệu ===
# CHỈ dùng dữ liệu BÌNH THƯỜNG để train
# (Autoencoder chỉ học pattern bình thường)
np.random.seed(42)
X_normal = np.random.randn(1000, 13).astype(np.float32)  # Giả lập

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X_normal)

# Chuyển sang PyTorch Dataset
dataset = TensorDataset(torch.FloatTensor(X_scaled))
dataloader = DataLoader(dataset, batch_size=64, shuffle=True)

# === Training ===
model = NetworkAutoencoder(input_dim=13)
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
loss_fn = nn.MSELoss()

EPOCHS = 50

for epoch in range(EPOCHS):
    total_loss = 0
    for batch, in dataloader:
        # Forward pass
        x_recon = model(batch)
        loss = loss_fn(x_recon, batch)  # So sánh output với input

        # Backward pass
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        total_loss += loss.item()

    avg_loss = total_loss / len(dataloader)
    if (epoch + 1) % 10 == 0:
        print(f"Epoch [{epoch+1}/{EPOCHS}], Loss: {avg_loss:.6f}")

print("Training complete!")
```

---

## 6. Anomaly Detection bằng Reconstruction Error

```python
# === Tính threshold từ dữ liệu training ===
model.eval()  # Chuyển sang evaluation mode
with torch.no_grad():
    train_tensor = torch.FloatTensor(X_scaled)
    train_errors = model.get_reconstruction_error(train_tensor)

# Threshold = mean + 2*std của training errors
threshold = train_errors.mean() + 2 * train_errors.std()
print(f"Anomaly threshold: {threshold:.4f}")

# === Detect anomalies ===
def detect_with_autoencoder(
    model: NetworkAutoencoder,
    scaler: StandardScaler,
    new_data: np.ndarray,
    threshold: float,
) -> list[dict]:
    """Detect anomalies bằng reconstruction error."""
    model.eval()

    X_scaled = scaler.transform(new_data)
    X_tensor = torch.FloatTensor(X_scaled)

    with torch.no_grad():
        errors = model.get_reconstruction_error(X_tensor)

    results = []
    for i in range(len(new_data)):
        error = float(errors[i])
        results.append({
            "index": i,
            "reconstruction_error": error,
            "is_anomaly": error > threshold,
            "anomaly_score": error / threshold,  # >1 = anomaly
        })

    return results


# Test với dữ liệu bất thường
X_anomaly = np.random.randn(50, 13).astype(np.float32) * 5 + 3  # Shift + scale
results = detect_with_autoencoder(model, scaler, X_anomaly, float(threshold))

anomaly_count = sum(1 for r in results if r["is_anomaly"])
print(f"\nDetected: {anomaly_count}/{len(results)} anomalies")
```

### Lưu và Nạp Model

```python
import torch
import joblib

# Lưu
torch.save(model.state_dict(), "models/autoencoder/v1.0/model.pt")
joblib.dump(scaler, "models/autoencoder/v1.0/scaler.pkl")
torch.save({"threshold": threshold}, "models/autoencoder/v1.0/config.pt")

# Nạp
loaded_model = NetworkAutoencoder(input_dim=13)
loaded_model.load_state_dict(torch.load("models/autoencoder/v1.0/model.pt"))
loaded_model.eval()

loaded_scaler = joblib.load("models/autoencoder/v1.0/scaler.pkl")
config = torch.load("models/autoencoder/v1.0/config.pt")
loaded_threshold = config["threshold"]
```

---

## 7. So sánh 3 Approaches

| Tiêu chí | Isolation Forest | Random Forest | Autoencoder |
|---|---|---|---|
| Loại | Unsupervised | Supervised | Unsupervised |
| Labeled data? | Không | Có (≥500) | Không (chỉ cần normal) |
| Multi-class? | Không | **Có** | Không |
| Novel attacks? | Tốt | Cần retrain | **Rất tốt** |
| Training speed | Nhanh | Trung bình | Chậm |
| Inference speed | Nhanh | Nhanh | Trung bình |
| Interpretable? | Score | **Feature importance** | Error per feature |
| Giai đoạn PT186S | Phase 1 | Phase 2 | Phase 3 (tùy chọn) |

---

## 8. Khi nào dùng Autoencoder?

**Nên dùng khi:**
- Data có high-dimensional features (>20 features)
- Cần phát hiện dạng tấn công hoàn toàn mới (zero-day)
- Isolation Forest cho FPR cao (>15%)

**Không nên dùng khi:**
- Data ít (<1000 records normal)
- Cần giải thích chi tiết cho analyst
- Resources hạn chế (PyTorch nặng hơn Scikit-learn)

**Khuyến nghị cho PT186S:** Bắt đầu với Isolation Forest (Phase 1), chuyển sang Random Forest khi có labeled data (Phase 2). Autoencoder chỉ thêm nếu cần phát hiện zero-day attacks.

---

## 9. Bài tập thực hành

### Bài 1: Thay đổi bottleneck size

Thử bottleneck = 2, 4, 6, 8. So sánh reconstruction error trên dữ liệu bình thường và bất thường. Bottleneck nào phân biệt tốt nhất?

### Bài 2: Visualize reconstruction

Chọn 5 records bình thường và 5 records bất thường. Plot bar chart so sánh input vs output cho mỗi record. Features nào có error cao nhất ở anomalies?

### Bài 3: Tích hợp vào FastAPI

Thêm endpoint `/api/v1/detection/analyze-deep` cho Autoencoder. Endpoint trả về `reconstruction_error` và `anomaly_features` (features có error cao nhất).

---

> **Tài liệu tiếp theo:** [11 – MLOps: Model Versioning, Retraining & Monitoring](./11-mlops-practices.md)
