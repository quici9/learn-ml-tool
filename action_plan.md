# Action Plan: Guided Discovery Learning Tool

> **Mục tiêu**: Chuyển từ "học thuật reference" → "người hướng dẫn thông minh"  
> **Nguyên tắc**: Dùng visual/interactive chỉ khi giúp hiểu nhanh hơn, nhớ lâu hơn, tham gia chủ động hơn. Còn lại: text đơn giản là đủ.

---

## Kiểm kê hiện trạng

### ✅ Đã có (giữ nguyên)
| File | Mô tả |
|------|-------|
| [Sidebar.tsx](file:///Users/ttdh/WebstormProjects/learn-ml-tool/src/components/Sidebar.tsx) + CSS | Navigation + mobile toggle — OK |
| [ComparisonTable.tsx](file:///Users/ttdh/WebstormProjects/learn-ml-tool/src/components/ComparisonTable.tsx) | Bảng so sánh — OK, chỉ thiếu mobile padding (đã fix) |
| [QuizQuestionCard.tsx](file:///Users/ttdh/WebstormProjects/learn-ml-tool/src/components/QuizQuestionCard.tsx) | Quiz multiple-choice — tốt |
| [ConfusionMatrixExplorer.tsx](file:///Users/ttdh/WebstormProjects/learn-ml-tool/src/components/ConfusionMatrixExplorer.tsx) | Interactive — tốt, justified vì hands-on metrics |
| [ThresholdExplorer.tsx](file:///Users/ttdh/WebstormProjects/learn-ml-tool/src/components/ThresholdExplorer.tsx) | Interactive threshold — justified, giúp hiểu tradeoff |
| [IsolationForestDiagram.tsx](file:///Users/ttdh/WebstormProjects/learn-ml-tool/src/components/IsolationForestDiagram.tsx) | SVG diagram IF — justified, visual khó giải thích bằng text |
| [FeatureImportanceChart.tsx](file:///Users/ttdh/WebstormProjects/learn-ml-tool/src/components/FeatureImportanceChart.tsx) | Bar chart — OK |
| [PipelineVisualizer.tsx](file:///Users/ttdh/WebstormProjects/learn-ml-tool/src/components/PipelineVisualizer.tsx) | Pipeline steps — marginal, giữ vì giúp big picture |

### ⚠️ Cần nâng cấp
| File | Vấn đề | Action |
|------|---------|--------|
| [SectionRenderer.tsx](file:///Users/ttdh/WebstormProjects/learn-ml-tool/src/components/SectionRenderer.tsx) | Chỉ handle 4 types: `text`, `code`, `comparison-table`, `interactive` | Thêm 4 types mới |
| [CodePlayground.tsx](file:///Users/ttdh/WebstormProjects/learn-ml-tool/src/components/CodePlayground.tsx) | Luôn hiển thị — không có collapse | Thêm `isOptional` prop |
| [lesson.ts](file:///Users/ttdh/WebstormProjects/learn-ml-tool/src/types/lesson.ts) (types) | Thiếu: `analogy`, `insight`, `scenario`, `decision` types | Extend |
| 19 bài lesson files | Code sections luôn mở — nặng về học thuật | Thêm `isOptional: true` |

### ❌ Chưa có (cần tạo mới)
- Component `AnalogyCard` — mental model "giống như..."
- Component `InsightStep` — câu hỏi → reveal đáp án
- Component `DecisionGuide` — bảng traffic-light chọn model

---

## Phase A — Hạ tầng (Infrastructure)
> **Mục tiêu**: Xây nền cho approach mới. Không đụng đến content.  
> **Deliverable**: Build passes, 3 component mới, type system mở rộng  
> **Thời gian ước tính**: 1 session

### A1 — Mở rộng type system ([src/types/lesson.ts](file:///Users/ttdh/WebstormProjects/learn-ml-tool/src/types/lesson.ts))

```typescript
// Thêm vào SectionType
type SectionType = 'text' | 'code' | 'comparison-table' | 'interactive'
  | 'analogy'    // ← MỚI
  | 'insight'    // ← MỚI
  | 'scenario'   // ← MỚI
  | 'decision'   // ← MỚI

// Thêm vào CodeContent
interface CodeContent {
  ...existing...
  isOptional?: boolean  // true → collapsed với badge "Nâng cao"
}

// Thêm interface mới
interface AnalogyContent { kind: 'analogy'; icon: string; concept: string; realWorld: string; mapping: {abstract: string; concrete: string}[] }
interface InsightContent  { kind: 'insight'; question: string; hint?: string; answer: string }
interface ScenarioContent { kind: 'scenario'; situation: string; problem: string; question: string }
interface DecisionContent { kind: 'decision'; title: string; conditions: {condition: string; recommendation: string; rationale: string; signal: 'green'|'yellow'|'red'}[] }
```

### A2 — Component `AnalogyCard`
- Layout: icon lớn (3rem) + concept name + text analogy
- Bên dưới: 2-cột mapping table | Abstract → Concrete | (max 4 dòng)
- Style: border xanh nhạt, background surface
- **Justified**: khái niệm trừu tượng (IF, SHAP, LSTM, imbalanced) cần mental hook để nhớ

### A3 — Component `InsightStep`
- Hiển thị câu hỏi gợi mở (bold, italic)
- Optional hint (tooltip / collapsed)
- Nút "Xem câu trả lời →" → expand smooth reveal
- **Justified**: active recall > passive reading (research confirmed)

### A4 — Component `DecisionGuide`
- Bảng 3 cột: Điều kiện | Khuyến nghị | Lý do
- Row có traffic light icon (🟢/🟡/🔴) theo `signal`
- **Justified**: chọn giữa ≥2 model/approach — visual scan nhanh hơn đọc text

### A5 — Cập nhật `CodePlayground` + [CodeBlock](file:///Users/ttdh/WebstormProjects/learn-ml-tool/src/components/SectionRenderer.tsx#108-142)
- Thêm prop `isOptional?: boolean`
- Khi `true`: render collapsed với badge **"Nâng cao"** + button **"Xem code ↓"**
- Expand/collapse với smooth animation (height transition)

### A6 — Cập nhật [SectionRenderer.tsx](file:///Users/ttdh/WebstormProjects/learn-ml-tool/src/components/SectionRenderer.tsx)
- Thêm case cho 4 type mới → dispatch về component tương ứng
- Khi `code.isOptional === true` → render `CollapsibleCodeBlock` thay vì [CodeBlock](file:///Users/ttdh/WebstormProjects/learn-ml-tool/src/components/SectionRenderer.tsx#108-142)

---

## Phase B — Pilot Content (3 bài)
> **Mục tiêu**: Validate approach mới với 3 bài quan trọng nhất  
> **Deliverable**: 3 file lesson rewritten, deploy, user review  
> **Thời gian ước tính**: 1-2 sessions

### B1 — Tất cả 19 bài: thêm `isOptional: true` cho code sections
- Không rewrite content
- Chỉ thêm 1 field vào mỗi code section object
- **Effect ngay**: code ẩn mặc định trên toàn tool → nhẹ nhàng hơn ngay

### B2 — Rewrite L05: Isolation Forest *(bài quan trọng nhất)*
Cấu trúc mới:
1. `scenario` → "SOC nhận 1M logs/ngày. Không có nhãn. Làm sao tìm bất thường?"
2. `analogy` → icon 🎯 "Giống trò '20 câu hỏi': cô lập người lạ bằng ít câu nhất"
3. `text` → Tại sao IF hiệu quả (không toán, dùng ngôn ngữ tự nhiên)
4. `insight` → "Điểm bình thường cần nhiều hay ít câu để cô lập?"
5. `decision` → Khi nào dùng IF / không dùng
6. `code` (isOptional: true)
7. `quiz` → hỏi về use case, không phải syntax

### B3 — Rewrite L09: Supervised vs Unsupervised  
Cấu trúc mới:
1. `scenario` → "Bạn có 2 tháng Zeek logs. Chưa có alert nào. Bắt đầu từ đâu?"
2. `analogy` → "Supervised = dạy con học từ bài mẫu. Unsupervised = để con tự khám phá"
3. `insight` → "Nếu không có nhãn, supervised có dùng được không?"
4. `decision` → Điều kiện → chọn Supervised / Unsupervised / Semi-supervised
5. `comparison-table` → nêu rõ trade-offs
6. `code` (isOptional: true)

### B4 — Rewrite L13: Imbalanced Data
Cấu trúc mới:
1. `scenario` → "Model đạt 99% accuracy nhưng không phát hiện được 1 attack nào"
2. `analogy` → "Như bác sĩ chẩn đoán 99% 'khỏe mạnh' vì bệnh nhân hiếm"
3. `insight` → "Tại sao accuracy không phải metric phù hợp?"
4. `decision` → Chọn metrics nào / kỹ thuật nào theo từng tình huống
5. `code` (isOptional: true)

---

## Phase C — Rewrite Toàn bộ (16 bài còn lại)
> **Mục tiêu**: Đồng bộ format mới cho toàn curriculum  
> **Điều kiện bắt đầu**: User approve Phase B  
> **Thời gian ước tính**: 3-4 sessions

### Ưu tiên rewrite theo impact:

| Nhóm | Bài | Lý do ưu tiên |
|------|-----|---------------|
| **High** | L04 ML Fundamentals | Nền tảng, ai cũng đọc |
| **High** | L15 Model Comparison | Core decision-making bài |
| **High** | L17 SHAP | Concept trừu tượng nhất |
| **Medium** | L06 Feature Engineering | Quan trọng, nhưng ít trừu tượng |
| **Medium** | L12 EDA | Workflow, dễ visual hơn |
| **Medium** | L16 XGBoost | Concept cần analogy tốt |
| **Low** | L01-03 Python/Pandas/NumPy | Ít abstract, tool-based |
| **Low** | L07-08 API/Elasticsearch | Technical HOW-TO, ít concept |
| **Low** | L19 Capstone | Project-based, format khác |

### Format chuẩn cho mỗi bài (linh hoạt, không cứng):
```
[scenario nếu cần]  →  [analogy nếu concept trừu tượng]
→  [text giải thích chính]  →  [insight nếu có câu hỏi thú vị]
→  [decision nếu phải chọn]  →  [comparison-table nếu cần]
→  [code — isOptional: true]  →  [quiz — hỏi use case]
```

---

## Phase D — UX Polish
> **Mục tiêu**: Nâng chất trải nghiệm sau khi content đã ổn  
> **Điều kiện bắt đầu**: Phase C hoàn thành  
> **Thời gian ước tính**: 1 session

### D1 — Học tiếp theo (Next Lesson)
- Sau khi hoàn thành quiz → nút "Bài tiếp theo →" 
- Hiện ở cuối lesson, không cần scrollbar

### D2 — Reading progress indicator
- Progress bar phần trăm đọc trong bài (đã có scroll progress bar, cải thiện thêm)

### D3 — Search tìm kiếm nhanh
- Ctrl+K → modal search lesson theo keyword
- **Justified**: 19 bài → user cần tìm nhanh không phải scroll sidebar

### D4 — Mobile: Sidebar auto-close sau khi chọn bài
- Hiện tại sidebar cần click X để đóng

---

## Thứ tự ưu tiên thực hiện

```
Phase A (hạ tầng)  →  Deploy  →  Phase B (pilot 3 bài)
→  User review  →  Phase C (16 bài còn lại, chia nhỏ)  →  Phase D (polish)
```

> **Checkpoint sau mỗi phase**: `npm run build` + deploy + user review trước khi sang phase tiếp.
