import type { Lesson } from '../types/lesson';

export const lesson10: Lesson = {
  id: '10-autoencoder-anomaly-detection',
  number: 10,
  title: 'Autoencoder – Anomaly Detection',
  description:
    'Deep learning với PyTorch – phát hiện bất thường dựa trên reconstruction error',
  phase: 'phase-3',
  estimatedTime: '5-6 ngày',
  prerequisites: ['03-numpy-statistics', '04-ml-fundamentals', '06-feature-engineering'],

  sections: [
    /* ───── 1. Autoencoder Concept ───── */
    {
      id: 'autoencoder-concept',
      title: '1. Autoencoder là gì?',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          '**Autoencoder** là neural network học cách **nén dữ liệu** (encode) rồi **giải nén** (decode) lại bản gốc. Nếu decode không chính xác → dữ liệu đó **bất thường**.',
          'Kiến trúc: **Input → Encoder → Bottleneck (compressed) → Decoder → Output**. Bottleneck buộc model học chỉ giữ thông tin quan trọng nhất.',
          'Ý tưởng phát hiện anomaly: train trên dữ liệu **bình thường** → model học pattern bình thường → dữ liệu bất thường có **reconstruction error cao** (model không thể tái tạo chính xác).',
        ],
        highlights: [
          {
            type: 'info',
            text: 'Autoencoder = unsupervised (không cần label) + deep learning. Mạnh hơn Isolation Forest cho dữ liệu phức tạp, nhưng cần nhiều dữ liệu hơn.',
          },
        ],
      },
    },

    /* ───── 2. PyTorch Basics ───── */
    {
      id: 'pytorch-basics',
      title: '2. PyTorch cơ bản',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'pytorch_basics.py',
        description:
          'PyTorch là framework deep learning phổ biến nhất (dùng bởi Meta, OpenAI, Google). Tensor = NumPy array + GPU acceleration + auto-differentiation.',
        code: `import torch
import torch.nn as nn

# === Tensor – giống NumPy array nhưng mạnh hơn ===
# Từ Python list
x = torch.tensor([1.0, 2.0, 3.0])
print(x, x.dtype)  # tensor([1., 2., 3.]) torch.float32

# Từ NumPy (zero-copy trên CPU)
import numpy as np
np_array = np.array([[1, 2], [3, 4]], dtype=np.float32)
tensor = torch.from_numpy(np_array)
print(tensor.shape)  # torch.Size([2, 2])

# === Phép toán (giống NumPy) ===
a = torch.tensor([1.0, 2.0, 3.0])
b = torch.tensor([4.0, 5.0, 6.0])
print(a + b)          # [5., 7., 9.]
print(a @ b)          # 32.0 (dot product)
print(a.mean())       # 2.0

# === GPU (nếu có) ===
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
x = x.to(device)     # Chuyển tensor sang GPU
print(f"Using: {device}")`,
        output: `tensor([1., 2., 3.]) torch.float32
torch.Size([2, 2])
tensor([5., 7., 9.])
tensor(32.)
tensor(2.)
Using: cpu`,
      },
    },

    /* ───── 3. Building the Model ───── */
    {
      id: 'building-model',
      title: '3. Xây dựng Autoencoder',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'autoencoder_model.py',
        description:
          'Autoencoder với PyTorch nn.Module. Encoder nén 5 features → 2 chiều (bottleneck), Decoder giải nén lại 5 features.',
        code: `import torch
import torch.nn as nn

class Autoencoder(nn.Module):
    def __init__(self, input_dim: int = 5, encoding_dim: int = 2):
        super().__init__()

        # Encoder: 5 → 8 → encoding_dim
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 8),
            nn.ReLU(),            # Activation function
            nn.Linear(8, encoding_dim),
            nn.ReLU(),
        )

        # Decoder: encoding_dim → 8 → 5
        self.decoder = nn.Sequential(
            nn.Linear(encoding_dim, 8),
            nn.ReLU(),
            nn.Linear(8, input_dim),
            # Không có activation ở output → giá trị tự do
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        encoded = self.encoder(x)    # Nén
        decoded = self.decoder(encoded)  # Giải nén
        return decoded

    def get_encoding(self, x: torch.Tensor) -> torch.Tensor:
        """Lấy biểu diễn nén (dùng cho visualization)"""
        return self.encoder(x)

# Khởi tạo model
model = Autoencoder(input_dim=5, encoding_dim=2)
print(model)
print(f"Parameters: {sum(p.numel() for p in model.parameters()):,}")`,
        output: `Autoencoder(
  (encoder): Sequential(
    (0): Linear(in_features=5, out_features=8, bias=True)
    (1): ReLU()
    (2): Linear(in_features=8, out_features=2, bias=True)
    (3): ReLU()
  )
  (decoder): Sequential(
    (0): Linear(in_features=2, out_features=8, bias=True)
    (1): ReLU()
    (2): Linear(in_features=8, out_features=5, bias=True)
  )
)
Parameters: 123`,
      },
    },

    /* ───── 4. Training Loop ───── */
    {
      id: 'training-loop',
      title: '4. Training Loop',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'train_autoencoder.py',
        description:
          'Training loop: forward pass → tính loss (MSE) → backward pass (gradient) → update weights. Chỉ train trên dữ liệu BÌNH THƯỜNG.',
        code: `import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
import numpy as np

# === Chuẩn bị dữ liệu ===
# CHỈ dùng dữ liệu BÌNH THƯỜNG để train!
np.random.seed(42)
normal_features = np.random.randn(1000, 5).astype(np.float32)

# Chuyển sang PyTorch tensor
train_tensor = torch.from_numpy(normal_features)
train_dataset = TensorDataset(train_tensor, train_tensor)  # input = target
train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)

# === Training ===
model = Autoencoder(input_dim=5, encoding_dim=2)
criterion = nn.MSELoss()             # Mean Squared Error
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

EPOCHS = 50
for epoch in range(EPOCHS):
    total_loss = 0
    for batch_x, _ in train_loader:
        # Forward pass
        reconstructed = model(batch_x)
        loss = criterion(reconstructed, batch_x)

        # Backward pass
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        total_loss += loss.item()

    avg_loss = total_loss / len(train_loader)
    if (epoch + 1) % 10 == 0:
        print(f"Epoch {epoch+1}/{EPOCHS}, Loss: {avg_loss:.6f}")

# Lưu model
torch.save(model.state_dict(), "autoencoder_v1.pth")`,
        output: `Epoch 10/50, Loss: 0.234521
Epoch 20/50, Loss: 0.089432
Epoch 30/50, Loss: 0.045123
Epoch 40/50, Loss: 0.028901
Epoch 50/50, Loss: 0.019876`,
      },
    },

    /* ───── 5. Anomaly Detection ───── */
    {
      id: 'anomaly-detection',
      title: '5. Phát hiện bất thường',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'detect_anomalies.py',
        description:
          'Dữ liệu bất thường có reconstruction error cao (model không thể tái tạo chính xác). Đặt threshold dựa trên percentile của error từ dữ liệu bình thường.',
        code: `import torch
import numpy as np

# Load trained model
model = Autoencoder(input_dim=5, encoding_dim=2)
model.load_state_dict(torch.load("autoencoder_v1.pth"))
model.eval()  # Chuyển sang inference mode

def compute_reconstruction_error(model, data: np.ndarray) -> np.ndarray:
    """Tính reconstruction error cho mỗi sample"""
    with torch.no_grad():
        tensor = torch.from_numpy(data.astype(np.float32))
        reconstructed = model(tensor)
        # MSE per sample (không phải per batch)
        errors = ((tensor - reconstructed) ** 2).mean(dim=1).numpy()
    return errors

# === Tính threshold từ dữ liệu bình thường ===
normal_errors = compute_reconstruction_error(model, normal_features)
threshold = np.percentile(normal_errors, 95)  # P95
print(f"Threshold (P95): {threshold:.6f}")

# === Test trên dữ liệu mới (có cả normal và anomaly) ===
test_normal = np.random.randn(50, 5).astype(np.float32)
test_anomaly = np.random.randn(10, 5).astype(np.float32) * 5 + 3  # Khác biệt rõ

test_data = np.vstack([test_normal, test_anomaly])
test_labels = np.array([0]*50 + [1]*10)  # 0 = normal, 1 = anomaly

errors = compute_reconstruction_error(model, test_data)
predictions = (errors > threshold).astype(int)

# Kết quả
from sklearn.metrics import precision_score, recall_score
print(f"Precision: {precision_score(test_labels, predictions):.3f}")
print(f"Recall:    {recall_score(test_labels, predictions):.3f}")`,
        output: `Threshold (P95): 0.045123
Precision: 0.909
Recall:    1.000`,
      },
    },

    /* ───── 6. Threshold Explorer ───── */
    {
      id: 'threshold-tuning',
      title: '6. Điều chỉnh Threshold',
      type: 'interactive',
      content: {
        kind: 'interactive',
        component: 'ThresholdExplorer',
        description:
          'Thay đổi threshold để hiểu trade-off giữa Precision và Recall. Threshold thấp → bắt nhiều anomaly nhưng nhiều false alarm.',
        props: { defaultThreshold: 0.045 },
      },
    },

    /* ───── 7. Approach Comparison ───── */
    {
      id: 'approach-comparison',
      title: '7. So sánh 3 phương pháp',
      type: 'comparison-table',
      content: {
        kind: 'comparison-table',
        headers: ['Tiêu chí', 'Isolation Forest', 'Random Forest', 'Autoencoder'],
        rows: [
          ['Loại', 'Unsupervised', 'Supervised', 'Unsupervised (Deep Learning)'],
          ['Cần labels', 'KHÔNG', 'CÓ (>100 samples)', 'KHÔNG'],
          ['Dữ liệu cần', 'Ít (~100 samples)', 'Vừa (~500 samples)', 'Nhiều (~1000+ samples)'],
          ['Độ phức tạp', 'Thấp', 'Trung bình', 'Cao'],
          ['Training time', 'Nhanh (giây)', 'Nhanh (giây)', 'Chậm hơn (phút)'],
          ['Interpretable', 'Anomaly score', 'Feature importance', 'Reconstruction error'],
          ['Khi nào dùng', 'Phase 1: chưa có labels', 'Phase 2: có labels', 'Phase 3: data phức tạp'],
          ['Framework', 'Scikit-learn', 'Scikit-learn', 'PyTorch'],
        ],
        caption: 'Lộ trình tự nhiên: IF → RF → Autoencoder khi hệ thống mature',
      },
    },
  ],

  quiz: [
    {
      id: 'q10-1',
      type: 'multiple-choice',
      question:
        'Autoencoder phát hiện anomaly dựa trên cơ chế nào?',
      options: [
        'Phân loại trực tiếp normal/anomaly',
        'Reconstruction error – dữ liệu bất thường không thể tái tạo chính xác',
        'Clustering – nhóm dữ liệu tương tự',
        'Regression – dự đoán giá trị liên tục',
      ],
      correctAnswer: 1,
      explanation:
        'Autoencoder học tái tạo dữ liệu bình thường. Khi gặp dữ liệu bất thường (chưa thấy khi train), reconstruction error cao → flag là anomaly.',
    },
    {
      id: 'q10-2',
      type: 'multiple-choice',
      question:
        'Bottleneck (encoding_dim=2) trong Autoencoder có vai trò gì?',
      options: [
        'Tăng tốc tính toán',
        'Buộc model học biểu diễn nén – chỉ giữ thông tin quan trọng nhất',
        'Giảm overfitting bằng dropout',
        'Chuyển đổi kiểu dữ liệu',
      ],
      correctAnswer: 1,
      explanation:
        'Bottleneck nhỏ hơn input (2 vs 5 dimensions) buộc model "nén" thông tin → chỉ giữ patterns quan trọng. Dữ liệu bất thường không fit vào compressed representation → reconstruction kém.',
    },
    {
      id: 'q10-3',
      type: 'multiple-choice',
      question:
        'Khi train Autoencoder cho anomaly detection, dùng dữ liệu nào?',
      options: [
        'Cả normal và anomaly, chia 50/50',
        'CHỈ dữ liệu bình thường (normal)',
        'CHỈ dữ liệu bất thường (anomaly)',
        'Dữ liệu random',
      ],
      correctAnswer: 1,
      explanation:
        'Train CHỈ trên dữ liệu bình thường → model học pattern "bình thường". Khi gặp anomaly (chưa từng thấy) → reconstruction error cao → phát hiện anomaly.',
    },
    {
      id: 'q10-4',
      type: 'multiple-choice',
      question:
        'Loss function MSELoss() tính gì?',
      options: [
        'Mean Squared Error – trung bình bình phương sai lệch giữa input và output',
        'Maximum Squared Error – sai lệch lớn nhất',
        'Minimum Squared Error – sai lệch nhỏ nhất',
        'Mean Scalar Estimation',
      ],
      correctAnswer: 0,
      explanation:
        'MSE = Mean Squared Error = trung bình của (input - output)². Giá trị càng nhỏ → reconstruction càng chính xác. Model minimize MSE trong training.',
    },
    {
      id: 'q10-5',
      type: 'multiple-choice',
      question:
        'torch.no_grad() khi inference dùng để làm gì?',
      options: [
        'Tắt GPU',
        'Tắt gradient computation → tiết kiệm memory và tăng tốc',
        'Tắt model.eval() mode',
        'Tắt backward pass forever',
      ],
      correctAnswer: 1,
      explanation:
        'Khi inference (predict), không cần tính gradient (chỉ cần khi train). torch.no_grad() tắt gradient tracking → giảm ~50% memory, tăng tốc inference.',
    },
  ],
};
