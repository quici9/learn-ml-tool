import type { Lesson } from '../types/lesson';

export const lesson17: Lesson = {
  id: '17-shap-explainability',
  number: 17,
  title: 'SHAP & Model Explainability',
  description: 'Tại sao alert X là anomaly? Global vs Local explanation',
  phase: 'phase-5',
  estimatedTime: '2-3 ngày',
  prerequisites: ['16-gradient-boosting'],

  sections: [
    /* ───── 1. Tại sao explainability quan trọng? ───── */
    {
      id: 'explainability-why',
      title: '1. Tại sao explainability không phải luxury?',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          '**Scenario**: Alert system báo "máy chủ A bất thường". SOC analyst hỏi: "Tại sao?". Model trả lời: "Anomaly score = 0.87". Analyst sẽ làm gì với thông tin này?',
          '**Vấn đề với blackbox models trong security**: (1) Analyst không biết validate alert có đúng không → waste time hoặc bỏ qua. (2) Không thể cải thiện model nếu không biết model đang học gì. (3) Compliance: nhiều regulations yêu cầu "explainable AI" cho critical decisions.',
          '**SHAP cho phép**: "Alert này triggered vì `port_diversity=47` (4x bình thường) và `failed_connections=23` (7x bình thường), trong khi `bytes_ratio` và `avg_duration` bình thường."',
          '**Analyst có thể**: Xác nhận port scanning behavior, lookup IP, escalate ngay thay vì tốn 30 phút investigate.',
        ],
        highlights: [
          {
            type: 'important',
            text: 'Explainability là điều kiện để được tin tưởng. Không có explainability → model dù accurate đến mấy cũng sẽ bị bypass bởi analysts → zero operational value.',
          },
        ],
      },
    },

    /* ───── 2. SHAP Overview ───── */
    {
      id: 'shap-overview',
      title: '2. SHAP — Shapley Additive exPlanations',
      type: 'comparison-table',
      content: {
        kind: 'comparison-table',
        headers: ['Khái niệm', 'Giải thích', 'Ví dụ'],
        rows: [
          ['SHAP value', 'Đóng góp của feature X vào prediction (so với baseline)', 'port_diversity SHAP = +0.34 → tăng anomaly score 0.34'],
          ['Baseline', 'Prediction khi không biết gì (mean prediction)', 'AnomalyScore = 0.15 (baseline)'],
          ['Prediction', 'Baseline + sum(all SHAP values)', '0.15 + 0.34 + 0.21 + ... = 0.87'],
          ['Global importance', 'Mean |SHAP| qua tất cả samples', 'port_diversity là feature quan trọng nhất globally'],
          ['Local explanation', 'SHAP values cho một prediction cụ thể', 'Alert #12847: port_diversity +0.41, bytes = -0.03'],
          ['Shapley values', 'Từ game theory: fair distribution of "credit"', 'Mỗi feature nhận "credit" xứng đáng, không hơn không kém'],
        ],
        caption: 'SHAP là mathematically grounded — không phải heuristic như nhiều explainability methods khác',
      },
    },

    /* ───── 3. SHAP Code ───── */
    {
      id: 'shap-code',
      title: '3. Code: SHAP với TreeExplainer (XGBoost/RF)',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'shap_explanations.py',
        description: 'Tính SHAP values, global importance, và local explanation cho từng alert',
        code: `import shap
import numpy as np
import pandas as pd

# ─── 1. TreeExplainer — nhanh nhất cho tree models ───
# Hỗ trợ: XGBoost, LightGBM, Random Forest, Isolation Forest
explainer = shap.TreeExplainer(xgb_clf)

# Tính SHAP values cho test set
shap_values = explainer.shap_values(X_test)
# shap_values.shape = (n_samples, n_features)
# Positive = tăng anomaly score, Negative = giảm

# ─── 2. Global Importance ───
mean_abs_shap = pd.Series(
    np.abs(shap_values).mean(axis=0),
    index=X_test.columns
).sort_values(ascending=False)

print("Top 10 Global Feature Importance (mean |SHAP|):")
print(mean_abs_shap.head(10).round(4))

# ─── 3. Local Explanation — giải thích một alert cụ thể ───
alert_idx = 42  # index trong test set
alert_shap = shap_values[alert_idx]
alert_features = X_test.iloc[alert_idx]

# Tạo explanation readable cho analyst
explanation_df = pd.DataFrame({
    'feature': X_test.columns,
    'value': alert_features.values,
    'shap_value': alert_shap,
    'direction': ['↑ anomaly' if s > 0 else '↓ anomaly' for s in alert_shap],
}).sort_values('shap_value', key=abs, ascending=False)

baseline = explainer.expected_value  # mean anomaly score
prediction = xgb_clf.predict_proba(X_test.iloc[[alert_idx]])[0, 1]

print(f"\\n{'='*60}")
print(f"ALERT #{alert_idx} EXPLANATION")
print(f"Baseline anomaly score: {baseline:.4f}")
print(f"Final anomaly score:    {prediction:.4f}")
print(f"{'='*60}")
print(explanation_df.head(8).to_string(index=False))

# ─── 4. Interaction values — feature interactions ───
# TreeExplainer hỗ trợ SHAP interaction values
# Đo ảnh hưởng của feature interactions (chậm hơn)
shap_interaction = explainer.shap_interaction_values(X_test[:100])
# shap_interaction[i, j, k] = interaction của feature j và k cho sample i

# ─── 5. SHAP cho Isolation Forest ───
iso_explainer = shap.TreeExplainer(iso_forest)
iso_shap = iso_explainer.shap_values(X_test[:1000])
print("\\nIF SHAP values computed successfully")
print(f"Shape: {iso_shap.shape}")
# Với IF: positive SHAP = makes sample MORE normal (less anomalous)`,
        output: `Top 10 Global Feature Importance (mean |SHAP|):
port_diversity         0.2834
unique_dest_ports      0.2012
connection_count       0.1734
failed_connections     0.1421
bytes_ratio            0.0923
avg_duration           0.0712
total_orig_bytes_log   0.0534
scan_pattern_score     0.0421
...

============================================================
ALERT #42 EXPLANATION
Baseline anomaly score: 0.1523
Final anomaly score:    0.8712
============================================================
feature               value    shap_value   direction
port_diversity           47      +0.4123   ↑ anomaly
failed_connections       23      +0.2134   ↑ anomaly
unique_dest_ips          89      +0.1823   ↑ anomaly
connection_count        312      +0.0921   ↑ anomaly
avg_duration           0.02      +0.0312   ↑ anomaly
bytes_ratio            1.23     -0.0089   ↓ anomaly
total_orig_bytes_log   8.21     -0.0023   ↓ anomaly
...`,
      },
    },

    /* ───── 4. Human-readable ───── */
    {
      id: 'human-readable',
      title: '4. Tạo alert explanation tự động cho SOC',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'alert_explanation_generator.py',
        description: 'Tự động generate explanation text dễ đọc từ SHAP values',
        code: `def generate_alert_explanation(
    sample: pd.Series,
    shap_vals: np.ndarray,
    feature_names: list,
    baseline: float,
    prediction: float,
    top_n: int = 5,
    feature_context: dict | None = None,
) -> str:
    """
    Generate human-readable explanation cho SOC analyst.

    feature_context: optional dict mô tả feature theo ngữ cảnh
    {
        'port_diversity': 'number of unique ports contacted',
        'failed_connections': 'number of failed TCP connections',
    }
    """
    # Sort features by SHAP magnitude
    sorted_idx = np.argsort(np.abs(shap_vals))[::-1][:top_n]

    # Build explanation
    lines = [
        f"ANOMALY ALERT — Score: {prediction:.1%}",
        f"(Baseline: {baseline:.1%})",
        "",
        "KEY INDICATORS:",
    ]

    for idx in sorted_idx:
        feature = feature_names[idx]
        val = sample[feature]
        shap = shap_vals[idx]
        direction = "⬆ increases" if shap > 0 else "⬇ decreases"
        context = feature_context.get(feature, feature) if feature_context else feature

        lines.append(
            f"  • {context}: {val:.2f} → {direction} anomaly probability by {abs(shap):.1%}"
        )

    lines += [
        "",
        "INTERPRETATION:",
        f"This alert is primarily driven by {'and '.join([feature_names[i] for i in sorted_idx[:2]])}.",
    ]

    if prediction > 0.8:
        lines.append("HIGH CONFIDENCE — Recommend immediate investigation.")
    elif prediction > 0.5:
        lines.append("MEDIUM CONFIDENCE — Review within 2 hours.")
    else:
        lines.append("LOW CONFIDENCE — Monitor and collect more data.")

    return "\\n".join(lines)


# Sử dụng
feature_ctx = {
    'port_diversity': 'unique destination ports/min',
    'failed_connections': 'failed TCP connections/min',
    'unique_dest_ips': 'unique destination IPs contacted',
}

explanation = generate_alert_explanation(
    sample=X_test.iloc[alert_idx],
    shap_vals=shap_values[alert_idx],
    feature_names=X_test.columns.tolist(),
    baseline=explainer.expected_value,
    prediction=prediction,
    feature_context=feature_ctx,
)
print(explanation)`,
        output: `ANOMALY ALERT — Score: 87.1%
(Baseline: 15.2%)

KEY INDICATORS:
  • unique destination ports/min: 47.00 → ⬆ increases anomaly probability by 41.2%
  • failed TCP connections/min: 23.00 → ⬆ increases anomaly probability by 21.3%
  • unique destination IPs contacted: 89.00 → ⬆ increases anomaly probability by 18.2%
  • connection_count: 312.00 → ⬆ increases anomaly probability by 9.2%
  • avg_duration: 0.02 → ⬆ increases anomaly probability by 3.1%

INTERPRETATION:
This alert is primarily driven by unique destination ports/min and failed TCP connections/min.
HIGH CONFIDENCE — Recommend immediate investigation.`,
      },
    },

    /* ───── 5. Global vs Local ───── */
    {
      id: 'global-vs-local',
      title: '5. Global vs Local Explanation',
      type: 'comparison-table',
      content: {
        kind: 'comparison-table',
        headers: ['', 'Global Explanation', 'Local Explanation'],
        rows: [
          ['Trả lời câu hỏi', 'Model rely on features nào nhìn chung?', 'Tại sao sample X cụ thể này là anomaly?'],
          ['SHAP metric', 'mean(|SHAP|) across all samples', 'SHAP values cho 1 sample'],
          ['Dùng để', 'Model debugging, feature engineering, bias detection', 'Alert triage, analyst investigation, SOC workflow'],
          ['Visualization', 'Summary plot (bee swarm), bar chart', 'Waterfall plot, force plot'],
          ['Audience', 'Data scientist, ML engineer', 'SOC analyst, security engineer'],
        ],
        caption: 'Cả hai quan trọng: global để build good model, local để make model operational',
      },
    },
  ],

  quiz: [
    {
      id: 'q17-1',
      type: 'multiple-choice',
      question: 'SHAP value của port_diversity = +0.34 có nghĩa là?',
      options: [
        'port_diversity của sample này là 0.34',
        'port_diversity tăng anomaly score lên 0.34 so với baseline',
        'port_diversity là 34% quan trọng',
        'Nếu xóa port_diversity, score giảm 34%',
      ],
      correctAnswer: 'port_diversity tăng anomaly score lên 0.34 so với baseline',
      explanation:
        'SHAP value là additive contribution của feature đến prediction. Baseline (mean prediction) cộng với tất cả SHAP values = final prediction. SHAP=+0.34 có nghĩa feature này đẩy prediction cao hơn 0.34 so với nếu không biết feature đó.',
    },
    {
      id: 'q17-2',
      type: 'multiple-choice',
      question: 'TreeExplainer nhanh hơn KernelExplainer vì lý do gì?',
      options: [
        'TreeExplainer dùng GPU',
        'TreeExplainer tận dụng cấu trúc tree để tính SHAP exact, không cần sampling',
        'TreeExplainer chỉ tính top-5 features',
        'TreeExplainer approximate SHAP values',
      ],
      correctAnswer: 'TreeExplainer tận dụng cấu trúc tree để tính SHAP exact, không cần sampling',
      explanation:
        'KernelExplainer là model-agnostic nhưng cần sampling để approximate SHAP → chậm và approximate. TreeExplainer exploit tree structure để tính exact SHAP values trong O(TLD²) thay vì exponential. Với XGBoost/RF, TreeExplainer tốt hơn 100-1000x.',
    },
    {
      id: 'q17-3',
      type: 'multiple-choice',
      question: 'Tại sao Global Importance (mean |SHAP|) tốt hơn XGBoost built-in feature importance (gain)?',
      options: [
        'SHAP tính nhanh hơn',
        'SHAP consistent và không bị biased bởi cardinality của feature',
        'SHAP là loại duy nhất hoạt động được',
        'Gain chỉ dùng cho classification, SHAP universal',
      ],
      correctAnswer: 'SHAP consistent và không bị biased bởi cardinality của feature',
      explanation:
        'XGBoost gain có thể bị biased: features với nhiều unique values tend to được split nhiều hơn → gain cao không phản ánh actual importance. SHAP theoretically grounded (Shapley values) → consistent, không bị bias bởi cardinality. Đây là lý do SHAP là standard cho explainability trong production.',
    },
    {
      id: 'q17-4',
      type: 'multiple-choice',
      question: 'Khi nào nên dùng Local Explanation thay vì chỉ Global Importance?',
      options: [
        'Khi muốn understand model tổng thể',
        'Khi investigate một alert cụ thể — tại sao sample X này là anomaly',
        'Khi feature engineering',
        'Khi compare 2 models',
      ],
      correctAnswer: 'Khi investigate một alert cụ thể — tại sao sample X này là anomaly',
      explanation:
        'Global: "port_diversity quan trọng nhất globally". Local: "Alert 12847 là anomaly VÌ port_diversity=47 (cụ thể)". SOC analyst cần local explanation để validate và act on specific alert, không cần biết global model behavior. Local explanation = actionable information cho analyst.',
    },
    {
      id: 'q17-5',
      type: 'multiple-choice',
      question: 'Prediction = Baseline + sum(SHAP values). Nếu baseline=0.15 và sum(SHAP)=0.72, prediction là?',
      options: ['0.87', '0.72', '0.57', '1.07'],
      correctAnswer: '0.87',
      explanation:
        'Đây là SHAP additivity property: prediction = expected_value + sum(phi_i) = 0.15 + 0.72 = 0.87. Đây là lý do SHAP được gọi là "additive": tổng của individual explanations bằng đúng total prediction (không phải approximation).',
    },
  ],
};
