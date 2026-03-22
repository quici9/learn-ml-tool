import type { Lesson } from '../types/lesson';

export const lesson18: Lesson = {
  id: '18-lstm-temporal',
  number: 18,
  title: 'LSTM & Temporal Anomaly Detection',
  description: 'Sequential patterns trong network traffic, PyTorch LSTM',
  phase: 'phase-5',
  estimatedTime: '4-5 ngày',
  prerequisites: ['17-shap-explainability'],

  sections: [
    /* ───── 1. Tại sao cần temporal models? ───── */
    {
      id: 'temporal-why',
      title: '1. Tại sao cần Temporal Models?',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          '**Vấn đề với snapshot models** (IF, RF, XGBoost): Mỗi data point được evaluate **độc lập**. Một connection với 100 packets/sec không anomalous. Nhưng nếu số này **tăng đều từ 10 → 20 → 40 → 80 → 100** trong 5 phút → classic DDoS ramp-up. Static models hoàn toàn bỏ qua pattern này.',
          '**Temporal anomalies**: (1) **Trend**: traffic tăng dần theo thời gian. (2) **Periodicity**: bình thường chỉ có traffic ban ngày, đột nhiên có traffic 3AM. (3) **Sequence**: A→B→C là bình thường, A→C→B là bất thường (lateral movement). (4) **Duration**: short burst vs sustained high traffic.',
          '**LSTM (Long Short-Term Memory)** giải quyết vanishing gradient problem của vanilla RNN. Có thể learn long-term dependencies qua gating mechanisms: forget gate (quên gì?), input gate (nhớ gì mới?), output gate (output gì?).',
          '**Alternative: Transformer**, đặc biệt là **Time Series Transformer** (như PatchTST, Autoformer). Transformer nhanh hơn và training ổn định hơn LSTM cho long sequences. LSTM vẫn tốt cho sequences ngắn (<100 timesteps).',
        ],
        highlights: [
          {
            type: 'tip',
            text: 'Dùng LSTM Autoencoder cho unsupervised temporal anomaly. Train chỉ trên "normal" sequences. Reconstruction error cao → sequence khác với pattern bình thường → anomaly. Không cần labels.',
          },
        ],
      },
    },

    /* ───── 2. LSTM Architecture ───── */
    {
      id: 'lstm-architecture',
      title: '2. LSTM Architecture và Windowing',
      type: 'comparison-table',
      content: {
        kind: 'comparison-table',
        headers: ['Concept', 'Mô tả', 'Áp dụng vào Network Data'],
        rows: [
          ['Sequence Window', 'T timesteps liên tiếp = 1 sample cho LSTM', 'T=30 phút của 1-min aggregated stats = window size 30'],
          ['Features per timestep', 'D features tại mỗi timestep', 'bytes, packets, connections mỗi phút (D=10)'],
          ['Input shape', '(batch_size, T, D)', '(32, 30, 10) — 32 windows, 30 timesteps, 10 features'],
          ['Hidden size', 'Dimension của LSTM hidden state', '64-256 tùy complexity của patterns'],
          ['Encoder-Decoder', 'Encode sequence → latent vector → Decode lại', 'Reconstruction error = anomaly score'],
          ['Stride', 'Sliding window với overlap', 'stride=1: mỗi phút tạo 1 sample (nhiều overlap)'],
        ],
        caption: 'Window size = lookback period. Stride = step size. Trade-off: lớn hơn = học pattern dài hơn nhưng ít samples hơn',
      },
    },

    /* ───── 3. LSTM Autoencoder Code ───── */
    {
      id: 'lstm-ae-code',
      title: '3. Code: LSTM Autoencoder cho Temporal Anomaly',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'lstm_autoencoder.py',
        description: 'PyTorch LSTM Autoencoder — unsupervised detection cho temporal patterns',
        code: `import torch
import torch.nn as nn
import numpy as np
from torch.utils.data import DataLoader, TensorDataset

# ─── 1. Data Preparation: Sliding Windows ───
def create_windows(
    time_series: np.ndarray,   # (n_timesteps, n_features)
    window_size: int,
    stride: int = 1,
) -> np.ndarray:
    """Create sliding window sequences."""
    n_timesteps, n_features = time_series.shape
    windows = []
    for i in range(0, n_timesteps - window_size + 1, stride):
        windows.append(time_series[i : i + window_size])
    return np.array(windows)  # (n_windows, window_size, n_features)

# Tạo windows từ normal training data
W = 30            # 30-minute window
STRIDE = 5        # new window every 5 minutes
FEATURES = 10     # bytes/min, packets/min, connections/min, ...

normal_windows = create_windows(X_normal_timeseries, W, STRIDE)
print(f"Windows shape: {normal_windows.shape}")  # (n_windows, 30, 10)

# ─── 2. LSTM Autoencoder Model ───
class LSTMAutoencoder(nn.Module):
    def __init__(
        self,
        n_features: int,
        hidden_size: int = 64,
        n_layers: int = 2,
        dropout: float = 0.1,
    ):
        super().__init__()
        # Encoder: compress sequence → latent vector
        self.encoder = nn.LSTM(
            input_size=n_features,
            hidden_size=hidden_size,
            num_layers=n_layers,
            dropout=dropout,
            batch_first=True,
        )
        # Decoder: reconstruct sequence từ latent
        self.decoder = nn.LSTM(
            input_size=hidden_size,
            hidden_size=hidden_size,
            num_layers=n_layers,
            dropout=dropout,
            batch_first=True,
        )
        self.output_fc = nn.Linear(hidden_size, n_features)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (batch, seq_len, n_features)
        # Encode
        _, (hidden, _) = self.encoder(x)
        # hidden: (n_layers, batch, hidden_size)

        # Repeat hidden → decode (seq_len times)
        latent = hidden[-1].unsqueeze(1).repeat(1, x.size(1), 1)
        # latent: (batch, seq_len, hidden_size)

        # Decode
        dec_out, _ = self.decoder(latent)
        output = self.output_fc(dec_out)
        # output: (batch, seq_len, n_features) — reconstructed sequence
        return output


# ─── 3. Training ───
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = LSTMAutoencoder(n_features=FEATURES, hidden_size=64).to(device)
optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
criterion = nn.MSELoss()

X_tensor = torch.FloatTensor(normal_windows).to(device)
dataset = TensorDataset(X_tensor, X_tensor)
loader = DataLoader(dataset, batch_size=64, shuffle=True)

model.train()
for epoch in range(50):
    total_loss = 0
    for batch_x, _ in loader:
        optimizer.zero_grad()
        recon = model(batch_x)
        loss = criterion(recon, batch_x)
        loss.backward()
        nn.utils.clip_grad_norm_(model.parameters(), 1.0)  # gradient clipping
        optimizer.step()
        total_loss += loss.item()
    if (epoch + 1) % 10 == 0:
        print(f"Epoch {epoch+1}: avg_loss = {total_loss/len(loader):.6f}")

# ─── 4. Anomaly Scoring ───
model.eval()
with torch.no_grad():
    # Test windows (có thể có anomalies)
    X_test_tensor = torch.FloatTensor(test_windows).to(device)
    reconstructed = model(X_test_tensor)
    # Reconstruction error per window
    recon_errors = ((X_test_tensor - reconstructed) ** 2).mean(dim=[1, 2]).cpu().numpy()

# Threshold: mean + k*std từ normal data
normal_errors = []
model.eval()
with torch.no_grad():
    for batch_x, _ in DataLoader(TensorDataset(X_tensor, X_tensor), batch_size=64):
        recon = model(batch_x)
        err = ((batch_x - recon) ** 2).mean(dim=[1, 2])
        normal_errors.extend(err.cpu().numpy())

threshold = np.mean(normal_errors) + 3 * np.std(normal_errors)
print(f"\\nAnomaly threshold: {threshold:.6f}")
print(f"Detected anomalies: {(recon_errors > threshold).sum()}")`,
        output: `Windows shape: (47520, 30, 10)

Epoch 10: avg_loss = 0.003421
Epoch 20: avg_loss = 0.001987
Epoch 30: avg_loss = 0.001234
Epoch 40: avg_loss = 0.000891
Epoch 50: avg_loss = 0.000712

Anomaly threshold: 0.004231
Detected anomalies: 127`,
      },
    },

    /* ───── 4. LSTM vs Transformer ───── */
    {
      id: 'lstm-vs-transformer',
      title: '4. LSTM vs Transformer cho Time Series',
      type: 'comparison-table',
      content: {
        kind: 'comparison-table',
        headers: ['', 'LSTM', 'Transformer (Attention)'],
        rows: [
          ['Strength', 'Short-medium sequences (<100 steps)', 'Long sequences (>200 steps) — global attention'],
          ['Speed', 'Sequential → slower training', 'Parallel → faster training'],
          ['Memory', 'O(1) inference (stateful)', 'O(n²) attention → memory intensive'],
          ['Interpretability', 'Hidden state khó interpret', 'Attention weights visualizable'],
          ['Data requirement', 'Medium (~10k+ sequences)', 'Large (~100k+ sequences)'],
          ['Use case', '1-hour window anomaly detection', 'Multi-day behavioral patterns, APT detection'],
        ],
        caption: 'Bắt đầu với LSTM, upgrade lên Transformer khi có đủ data và compute',
      },
    },

    /* ───── 5. Production Considerations ───── */
    {
      id: 'lstm-production',
      title: '5. LSTM trong Production',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          '**Online vs Batch inference**: LSTM có thể run real-time nhưng cần buffer window_size minutes. Với W=30, phải chờ 30 minutes data trước khi tính anomaly score.',
          '**Concept drift**: Network behavior thay đổi theo thời gian (new services, policy changes). LSTM cần retrain định kỳ — thường mỗi 1-4 tuần với rolling window training.',
          '**Threshold adaptation**: Dùng rolling statistics (online mean/std) cho threshold thay vì fixed — tự động adapt với changes trong traffic patterns.',
          '**Multivariate vs Univariate**: Bài này dùng multivariate (nhiều features). Univariate (chỉ 1 feature như packets/min) đơn giản hơn, dùng khi chỉ cần monitor specific metric.',
        ],
        highlights: [
          {
            type: 'warning',
            text: 'LSTM training cần nhiều data hơn IF/RF. Cần tối thiểu 2-4 tuần của normal traffic để learn baseline patterns, đặc biệt nếu có weekly/daily seasonality.',
          },
        ],
      },
    },
  ],

  quiz: [
    {
      id: 'q18-1',
      type: 'multiple-choice',
      question: 'Tại sao cần LSTM khi đã có Isolation Forest?',
      options: [
        'LSTM chính xác hơn IF',
        'IF evaluate từng điểm độc lập, không capture temporal patterns (trend, seasonality, sequences)',
        'LSTM không cần labels',
        'IF không scale với data lớn',
      ],
      correctAnswer: 'IF evaluate từng điểm độc lập, không capture temporal patterns (trend, seasonality, sequences)',
      explanation:
        'IF nhìn mỗi sample một cách isolated. Connection với 100 packets/s: IF không biết đây là peak bình thường hay ramp-up của DDoS nếu không nhìn được lịch sử. LSTM nhìn sequence 30 phút → detect pattern "tăng dần đều" dù từng timestep riêng lẻ có thể bình thường.',
    },
    {
      id: 'q18-2',
      type: 'multiple-choice',
      question: 'LSTM Autoencoder detect anomaly bằng cách nào?',
      options: [
        'Predict "anomaly" hay "normal" như classifier',
        'Train chỉ trên normal data, anomaly = reconstruction error cao',
        'Cluster sequences rồi mark outlier clusters là anomaly',
        'Dùng attention weights để identify unusual timesteps',
      ],
      correctAnswer: 'Train chỉ trên normal data, anomaly = reconstruction error cao',
      explanation:
        'LSTM Autoencoder = unsupervised method. Model learn to compress và reconstruct "normal" sequences tốt. Khi gặp anomalous sequence, model không biết cách reconstruct → error cao. Không cần labels. Trade-off: threshold phải được calibrate — quá cao = miss anomaly, quá thấp = too many FP.',
    },
    {
      id: 'q18-3',
      type: 'multiple-choice',
      question: 'Window size W=60 (minutes), stride=1. Với 10,000 minutes data, có bao nhiêu training samples?',
      options: ['10,000', '9,941', '167', '60'],
      correctAnswer: '9,941',
      explanation:
        'n_windows = (n_timesteps - W) / stride + 1 = (10,000 - 60) / 1 + 1 = 9,941. Mỗi minute tạo 1 window (slide 1 stride). Overlap cao → nhiều training samples nhưng correlated. Trade-off: stride lớn hơn = ít samples nhưng ít correlation.',
    },
    {
      id: 'q18-4',
      type: 'multiple-choice',
      question: 'Gradient clipping (clip_grad_norm_) trong LSTM training giải quyết vấn đề gì?',
      options: [
        'Tăng learning rate tự động',
        'Tránh exploding gradients — gradients quá lớn khiến training diverge',
        'Giảm memory usage',
        'Accelerate convergence',
      ],
      correctAnswer: 'Tránh exploding gradients — gradients quá lớn khiến training diverge',
      explanation:
        'RNN/LSTM có thể bị exploding gradients — backprop qua nhiều timesteps làm gradients tăng theo cấp số nhân → model weights update quá lớn → training diverge. Gradient clipping giới hạn gradient norm tối đa. LSTM gating help với vanishing gradient, nhưng exploding gradient vẫn có thể xảy ra.',
    },
    {
      id: 'q18-5',
      type: 'multiple-choice',
      question: 'Tại sao threshold nên dùng mean+3σ từ VALIDATION set, không phải TRAINING set?',
      options: [
        'Validation set tốt hơn training set',
        'Model đã thấy training data → reconstruction error artificially low → threshold quá thấp',
        'Training set có quá nhiều anomalies',
        'Không quan trọng khi dùng mean+3σ',
      ],
      correctAnswer: 'Model đã thấy training data → reconstruction error artificially low → threshold quá thấp',
      explanation:
        'Model optimize reconstruction của training data → reconstruction error rất thấp trên training set (thậm chí overfit). Nếu dùng training error để set threshold → threshold quá thấp → quá nhiều false positives trên production. Validation set (normal data không thấy khi train) cho threshold realistic và generalizable.',
    },
  ],
};
