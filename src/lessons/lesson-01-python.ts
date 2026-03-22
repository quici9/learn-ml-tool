import type { Lesson } from '../types/lesson';

export const lesson01: Lesson = {
  id: '01-python-fundamentals',
  number: 1,
  title: 'Python Fundamentals',
  description:
    'So sánh Python ↔ TypeScript, cú pháp, functions, classes, type hints',
  phase: 'phase-1',
  estimatedTime: '2-3 ngày',
  prerequisites: [],

  sections: [
    /* ───── 1. Cài đặt môi trường ───── */
    {
      id: 'env-setup',
      title: '1. Cài đặt môi trường',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          'Python sử dụng **virtual environment (venv)** – tương đương `node_modules` trong Node.js. Mỗi project có môi trường riêng, tránh xung đột version giữa các dự án.',
          'Kiểm tra Python đã cài đặt: `python3 --version` → cần Python 3.11+.',
          'Quy trình: `python3 -m venv .venv` → `source .venv/bin/activate` → `pip install ...` → `pip freeze > requirements.txt`.',
        ],
        highlights: [
          {
            type: 'tip',
            text: 'Luôn tạo venv trước khi cài thư viện. Nếu quên → thư viện cài vào global Python → xung đột giữa các project.',
          },
        ],
      },
    },

    /* ───── 1b. So sánh Node ↔ Python ───── */
    {
      id: 'env-comparison',
      title: 'So sánh npm ↔ pip',
      type: 'comparison-table',
      content: {
        kind: 'comparison-table',
        headers: ['Node.js', 'Python', 'Chức năng'],
        rows: [
          ['npm init', 'python3 -m venv .venv', 'Khởi tạo project'],
          ['npm install pandas', 'pip install pandas', 'Cài thư viện'],
          ['package.json', 'requirements.txt', 'File dependencies'],
          ['node_modules/', '.venv/', 'Thư mục chứa dependencies'],
          ['npx', 'python -m', 'Chạy module'],
        ],
        caption:
          'So sánh hệ sinh thái Node.js và Python từ góc nhìn developer',
      },
    },

    /* ───── 2. Biến và kiểu dữ liệu ───── */
    {
      id: 'variables',
      title: '2. Biến và kiểu dữ liệu',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          'Python không cần từ khóa khai báo (`const`/`let`), không cần dấu `;`. Kiểu được suy luận tự động (dynamic typing) nhưng hỗ trợ **type hints**.',
          '`True`/`False`/`None` viết HOA chữ cái đầu (khác JS: `true`/`false`/`null`). Python dùng **snake_case** cho biến/hàm thay vì camelCase.',
          '**f-string** (format string) tương đương template literal: `f"Connection to {ip}:{port}"`.',
        ],
        highlights: [
          {
            type: 'info',
            text: 'Python phân biệt `int` và `float` (JS chỉ có `number`). Không có `undefined` — chỉ có `None`.',
          },
        ],
      },
    },

    /* ───── 2b. Bảng so sánh kiểu dữ liệu ───── */
    {
      id: 'types-comparison',
      title: 'TypeScript ↔ Python: Kiểu dữ liệu',
      type: 'comparison-table',
      content: {
        kind: 'comparison-table',
        headers: ['TypeScript', 'Python', 'Ghi chú'],
        rows: [
          ['string', 'str', ''],
          ['number', 'int, float', 'Python phân biệt số nguyên/thực'],
          ['boolean', 'bool', 'True / False (viết hoa)'],
          ['null', 'None', ''],
          ['undefined', 'Không có', 'Python không có undefined'],
          ['any', 'Không có', 'Python dynamic typing mặc định'],
        ],
        caption: 'Python có ít kiểu nguyên thuỷ hơn nhưng rõ ràng hơn',
      },
    },

    /* ───── 2c. Code so sánh biến ───── */
    {
      id: 'variables-code',
      title: 'Code: Khai báo biến TS ↔ Python',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'variables.py',
        description:
          'So sánh cú pháp khai báo biến giữa TypeScript và Python',
        code: `# Python – không cần từ khóa khai báo, không cần dấu ;
name: str = "PT186S"
count: int = 42
is_active: bool = True       # True/False thay vì true/false
nothing: None = None         # None thay vì null

# f-string – giống template literal
ip = "192.168.1.1"
port = 443
print(f"Connection to {ip}:{port}")`,
        output: 'Connection to 192.168.1.1:443',
      },
    },

    /* ───── 3. Cấu trúc dữ liệu ───── */
    {
      id: 'data-structures',
      title: '3. Cấu trúc dữ liệu: List, Dict, Tuple, Set',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          '**List** (tương đương Array): `ips = ["10.0.0.1", "10.0.0.2"]`. Dùng `append()` thay vì `push()`, `len()` thay vì `.length`.',
          '**Dict** (tương đương Object/Map): `alert = {"severity": "high"}`. Dùng `.get("key", default)` an toàn hơn `[]` — không crash khi key không tồn tại.',
          '**Tuple** — giống Array nhưng **immutable**: `connection = ("192.168.1.1", 443, "tcp")`. Rất hay dùng khi hàm trả về nhiều giá trị.',
          '**Set** — tập hợp không trùng lặp: `unique_ips = {"10.0.0.1", "10.0.0.2"}`. Hỗ trợ phép giao (`&`), hợp (`|`) — rất hữu ích trong network analysis.',
        ],
      },
    },

    /* ───── 3b. Code: Data Structures ───── */
    {
      id: 'data-structures-code',
      title: 'Code: List, Dict, Slicing',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'data_structures.py',
        description: 'Khả năng slicing mạnh mẽ mà JS không có',
        code: `# List — tương đương Array
ips: list[str] = ["10.0.0.1", "10.0.0.2", "10.0.0.3"]
ips.append("10.0.0.4")       # push → append
length = len(ips)             # .length → len()

# Slicing — JS không có tương đương
last_two = ips[-2:]           # 2 phần tử cuối
reversed_ips = ips[::-1]      # đảo ngược

# Dict — tương đương Object
alert: dict[str, any] = {
    "severity": "high",
    "source_ip": "192.168.1.100",
    "count": 15
}
# .get() an toàn — trả default nếu key không tồn tại
status = alert.get("missing_key", "unknown")

print(f"IPs: {ips}")
print(f"Last two: {last_two}")
print(f"Status: {status}")`,
        output:
          'IPs: [\'10.0.0.1\', \'10.0.0.2\', \'10.0.0.3\', \'10.0.0.4\']\nLast two: [\'10.0.0.3\', \'10.0.0.4\']\nStatus: unknown',
      },
    },

    /* ───── 4. Hàm và Lambda ───── */
    {
      id: 'functions',
      title: '4. Hàm và Lambda',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          'Python dùng `def` thay vì `function`, **indent (thụt lề)** thay vì `{}` để phân chia block code.',
          '**Lambda** giống arrow function nhưng chỉ được **1 biểu thức**: `is_high_risk = lambda score: score > 80`.',
          '**Docstring** (`"""..."""`) thay vì JSDoc — mô tả hàm ngay dòng đầu tiên trong body.',
          '**Unpacking** (destructuring): `first, *rest = [1, 2, 3, 4, 5]` → `first = 1, rest = [2, 3, 4, 5]`. Dict unpacking dùng `**`.',
        ],
        highlights: [
          {
            type: 'warning',
            text: 'Indent bắt buộc! Python dùng 4 spaces (hoặc Tab). Sai indent → SyntaxError. Đây là khác biệt lớn nhất với JS/TS.',
          },
        ],
      },
    },

    /* ───── 4b. Functions code ───── */
    {
      id: 'functions-code',
      title: 'Code: Hàm Python vs TypeScript',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'functions.py',
        description: 'So sánh: function TS → def Python, arrow fn → lambda',
        code: `def calculate_threat_score(
    connections: int,
    unique_ports: int,
    avg_bytes: float
) -> float:
    """Tính điểm đe dọa dựa trên network metrics."""
    return connections * 0.3 + unique_ports * 0.5 + avg_bytes * 0.2

# Lambda – arrow function 1 dòng
is_high_risk = lambda score: score > 80

# Default parameters
def analyze(data: list, threshold: float = 0.5, verbose: bool = False):
    if verbose:
        print(f"Analyzing {len(data)} records, threshold={threshold}")
    return [x for x in data if x > threshold]

# Destructuring / Unpacking
source_ip, dest_ip, port = ("10.0.0.1", "192.168.1.1", 443)
first, *rest = [1, 2, 3, 4, 5]

score = calculate_threat_score(100, 25, 5000.0)
print(f"Threat score: {score}")
print(f"High risk: {is_high_risk(score)}")
print(f"first={first}, rest={rest}")`,
        output:
          'Threat score: 1042.5\nHigh risk: True\nfirst=1, rest=[2, 3, 4, 5]',
      },
    },

    /* ───── 5. Type Hints ───── */
    {
      id: 'type-hints',
      title: '5. Type Hints – Tương tự TypeScript',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          'Python dynamic typing mặc định, nhưng hỗ trợ **type hints** tương tự TypeScript. Không bắt buộc nhưng rất khuyến khích — IDE sẽ kiểm tra lỗi.',
          '`Optional[str]` tương đương `string | null`. Từ Python 3.10+ có thể viết `str | None` giống TypeScript.',
          '`list[str]` thay vì `Array<string>`, `dict[str, int]` thay vì `Record<string, number>`, `tuple[str, int]` thay vì `[string, number]`.',
        ],
      },
    },

    /* ───── 5b. Type Hints comparison table ───── */
    {
      id: 'type-hints-comparison',
      title: 'TypeScript ↔ Python: Type Syntax',
      type: 'comparison-table',
      content: {
        kind: 'comparison-table',
        headers: ['TypeScript', 'Python', 'Ví dụ'],
        rows: [
          ['string | null', 'Optional[str] hoặc str | None', 'username: Optional[str] = None'],
          ['Array<string>', 'list[str]', 'ips: list[str] = []'],
          ['Record<string, number>', 'dict[str, int]', 'config: dict[str, int]'],
          ['[string, number]', 'tuple[str, int]', 'conn: tuple[str, int]'],
          ['interface', 'TypedDict hoặc @dataclass', 'Dùng dataclass phổ biến hơn'],
        ],
        caption:
          'Type syntax gần giống nhau — developer TS chuyển sang Python rất nhanh',
      },
    },

    /* ───── 6. Class và Dataclass ───── */
    {
      id: 'classes',
      title: '6. Class và @dataclass',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          'Python class dùng `self` thay vì `this`, constructor là `__init__`. Private property dùng `_` prefix (convention, không enforce).',
          '**@dataclass** — cực kỳ gọn cho data structures (giống DTO trong NestJS). Tự động tạo `__init__`, `__repr__`, `__eq__`.',
          'Dùng `@dataclass` khi cần define cấu trúc dữ liệu cho ML: features, predictions, model config.',
        ],
        highlights: [
          {
            type: 'tip',
            text: 'Tạo instance: `detector = AnomalyDetector("isolation_forest")` — không cần từ khóa `new` như JS/TS.',
          },
        ],
      },
    },

    /* ───── 6b. Dataclass code ───── */
    {
      id: 'dataclass-code',
      title: 'Code: @dataclass — DTO cho ML',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'dataclass_demo.py',
        description:
          'Dataclass tự động tạo __init__, __repr__, __eq__ — giống class-validator DTO trong NestJS',
        code: `from dataclasses import dataclass, field

@dataclass
class NetworkFlow:
    """Một bản ghi kết nối mạng — tương tự Zeek conn.log record."""
    source_ip: str
    dest_ip: str
    dest_port: int
    protocol: str
    duration: float
    orig_bytes: int
    resp_bytes: int
    conn_state: str = "SF"                    # default value
    is_anomaly: bool = False
    tags: list[str] = field(default_factory=list)

# Tạo instance — không cần new
flow = NetworkFlow(
    source_ip="10.0.0.1",
    dest_ip="192.168.1.100",
    dest_port=443,
    protocol="tcp",
    duration=2.5,
    orig_bytes=1024,
    resp_bytes=4096
)

print(flow.source_ip)
print(flow)`,
        output:
          '10.0.0.1\nNetworkFlow(source_ip=\'10.0.0.1\', dest_ip=\'192.168.1.100\', dest_port=443, protocol=\'tcp\', duration=2.5, orig_bytes=1024, resp_bytes=4096, conn_state=\'SF\', is_anomaly=False, tags=[])',
      },
    },

    /* ───── 7. Modules & Import ───── */
    {
      id: 'modules',
      title: '7. Module và Import',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'imports.py',
        description:
          'Import Python tương đương import ES6 – nhưng có thêm alias phổ biến',
        code: `# Giống import { AlertService } from './alerts'
from alerts.alert_service import AlertService

# Giống import * as os from 'os'
import os

# Giống import axios from 'axios'
import requests

# Import cụ thể
from sklearn.ensemble import IsolationForest
from typing import Optional, List

# Alias — convention phổ biến ML
import numpy as np        # ai cũng viết vậy
import pandas as pd       # convention bắt buộc

# __init__.py trong thư mục = index.ts trong Node
# Đánh dấu thư mục là Python package`,
      },
    },

    /* ───── 8. Virtual Environment chi tiết ───── */
    {
      id: 'venv-detail',
      title: '8. Virtual Environment – Chi tiết',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'venv_workflow.sh',
        description:
          'Workflow tạo project ML mới — tương đương npm init + npm install',
        code: `# 1. Tạo project mới
# mkdir ml-engine && cd ml-engine

# 2. Tạo virtual environment
# python3 -m venv .venv

# 3. Kích hoạt
# source .venv/bin/activate   (macOS/Linux)

# 4. Cài dependencies
# pip install fastapi uvicorn pandas numpy scikit-learn

# 5. Freeze dependencies (giống npm shrinkwrap)
# pip freeze > requirements.txt

# 6. Thêm vào .gitignore
# echo ".venv/" >> .gitignore

# 7. Teammate clone project:
# git clone <repo> && cd ml-engine
# python3 -m venv .venv
# source .venv/bin/activate
# pip install -r requirements.txt  ← giống npm install`,
      },
    },

    /* ───── 9. File I/O và JSON ───── */
    {
      id: 'file-io',
      title: '9. File I/O và JSON',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'json_io.py',
        description:
          'Đọc/ghi JSON — dùng rất nhiều khi giao tiếp giữa Python ML Engine và NestJS',
        code: `import json

# Parse JSON string → dict (giống JSON.parse)
json_str = '{"severity": "high", "score": 0.95}'
data = json.loads(json_str)
print(f"Severity: {data['severity']}")

# Dict → JSON string (giống JSON.stringify)
result = {"anomaly": True, "score": 0.95, "model": "isolation_forest"}
json_output = json.dumps(result, indent=2)
print(json_output)

# Đọc file dùng "with" — tự động đóng khi xong
# with open("config.json", "r") as f:
#     config = json.load(f)

# Ghi file
# with open("result.json", "w") as f:
#     json.dump(result, f, indent=2)`,
        output:
          'Severity: high\n{\n  "anomaly": true,\n  "score": 0.95,\n  "model": "isolation_forest"\n}',
      },
    },

    /* ───── 10. Error Handling ───── */
    {
      id: 'error-handling',
      title: '10. Error Handling — try / except',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'error_handling.py',
        description:
          'try/catch → try/except, throw → raise, custom Exception class',
        code: `# try/catch → try/except
try:
    value = int("not_a_number")
except ValueError as e:           # catch → except
    print(f"Value error: {e}")
except (TypeError, KeyError):     # bắt nhiều loại
    print("Type or key error")
except Exception as e:            # catch-all
    print(f"Unexpected: {e}")
else:
    print("No error occurred")    # chạy khi KHÔNG có lỗi
finally:
    print("Always runs")

# Raise exception (giống throw)
def validate_threshold(value: float):
    if not 0 <= value <= 1:
        raise ValueError(f"Threshold must be 0-1, got {value}")

# Custom Exception
class ModelNotTrainedError(Exception):
    def __init__(self, model_name: str):
        super().__init__(f"Model '{model_name}' not trained yet")
        self.model_name = model_name`,
        output: 'Value error: invalid literal for int() with base 10: \'not_a_number\'\nAlways runs',
      },
    },

    /* ───── 11. List Comprehension ───── */
    {
      id: 'list-comprehension',
      title: '11. List Comprehension — Vũ khí bí mật',
      type: 'text',
      content: {
        kind: 'text',
        paragraphs: [
          'Đây là tính năng mạnh nhất của Python mà JS không có tương đương ngắn gọn. Dùng cực nhiều trong data processing.',
          '**List comprehension** = `.filter()` + `.map()` trong 1 dòng: `result = [ip for ip in all_ips if ip.startswith("10.")]`',
          '**Dict comprehension**: `port_counts = {port: count for port, count in raw_data.items() if count > 10}`',
          '**Set comprehension**: `unique_protocols = {flow["protocol"] for flow in flows}`',
        ],
        highlights: [
          {
            type: 'important',
            text: 'Trong ML/Data Science, list comprehension xuất hiện ở MỌI NƠI. Nắm vững cú pháp này = viết Python tự nhiên.',
          },
        ],
      },
    },

    /* ───── 11b. List comprehension code ───── */
    {
      id: 'list-comprehension-code',
      title: 'Code: Xử lý network data với comprehension',
      type: 'code',
      content: {
        kind: 'code',
        language: 'python',
        filename: 'comprehension.py',
        description: 'Thực tế: lọc, transform network connections trong 1 dòng',
        code: `# Dữ liệu network connections
connections = [
    {"src": "10.0.0.1", "dst": "8.8.8.8", "port": 53, "bytes": 120},
    {"src": "10.0.0.2", "dst": "192.168.1.1", "port": 443, "bytes": 5000},
    {"src": "10.0.0.1", "dst": "evil.com", "port": 4444, "bytes": 50000},
    {"src": "10.0.0.3", "dst": "8.8.4.4", "port": 53, "bytes": 80},
]

# Lọc connection bytes > 10000 (tiềm năng data exfiltration)
large = [c for c in connections if c["bytes"] > 10000]
print(f"Large transfers: {len(large)}")

# Lấy danh sách IP nguồn duy nhất (set comprehension)
unique_src = {c["src"] for c in connections}
print(f"Unique sources: {unique_src}")

# Transform: chỉ lấy dst + port
targets = [(c["dst"], c["port"]) for c in connections]
print(f"Targets: {targets}")`,
        output:
          'Large transfers: 1\nUnique sources: {\'10.0.0.1\', \'10.0.0.2\', \'10.0.0.3\'}\nTargets: [(\'8.8.8.8\', 53), (\'192.168.1.1\', 443), (\'evil.com\', 4444), (\'8.8.4.4\', 53)]',
      },
    },

    /* ───── 12. Tổng kết ───── */
    {
      id: 'summary',
      title: '12. Tổng kết: TS Developer → Python',
      type: 'comparison-table',
      content: {
        kind: 'comparison-table',
        headers: ['Khái niệm', 'TypeScript/JS', 'Python'],
        rows: [
          ['Khai báo biến', 'const/let', 'Trực tiếp (x = 5)'],
          ['Block scope', '{ }', 'Indent (4 spaces)'],
          ['Template string', '`${var}`', 'f"{var}"'],
          ['Array', 'array.push()', 'list.append()'],
          ['Object', '{ key: value }', 'dict { "key": value }'],
          ['Arrow function', '(x) => x * 2', 'lambda x: x * 2'],
          ['Constructor', 'constructor()', '__init__(self)'],
          ['this', 'this.prop', 'self.prop'],
          ['Import', "import { X } from 'y'", 'from y import X'],
          ['try/catch', 'catch (error)', 'except Exception as e'],
          ['throw', 'throw new Error()', 'raise ValueError()'],
          ['filter + map', '.filter().map()', 'List comprehension'],
        ],
        caption:
          'Bảng tham khảo nhanh — bookmark trang này để tra cứu khi code Python',
      },
    },
  ],

  quiz: [
    {
      id: 'q01-1',
      type: 'multiple-choice',
      question:
        'Virtual environment trong Python tương đương gì trong Node.js?',
      options: [
        'package.json',
        'node_modules + package.json',
        '.env file',
        'tsconfig.json',
      ],
      correctAnswer: 'node_modules + package.json',
      explanation:
        'venv chứa Python interpreter + installed packages (giống node_modules), và requirements.txt liệt kê dependencies (giống package.json).',
    },
    {
      id: 'q01-2',
      type: 'multiple-choice',
      question: 'Cú pháp nào đúng để khai báo biến boolean trong Python?',
      options: [
        'const isActive: bool = true;',
        'is_active: bool = True',
        'let is_active = True',
        'var is_active: boolean = True',
      ],
      correctAnswer: 'is_active: bool = True',
      explanation:
        'Python dùng snake_case, type hint với dấu :, True viết hoa chữ T, và không cần const/let/var.',
    },
    {
      id: 'q01-3',
      type: 'multiple-choice',
      question:
        'Điểm khác biệt lớn nhất về cú pháp giữa Python và TypeScript là gì?',
      options: [
        'Python không hỗ trợ string formatting',
        'Python dùng indent thay vì { } để định nghĩa block code',
        'Python không có kiểu dữ liệu số',
        'Python bắt buộc phải khai báo kiểu cho mọi biến',
      ],
      correctAnswer:
        'Python dùng indent thay vì { } để định nghĩa block code',
      explanation:
        'Đây là khác biệt lớn nhất. Python dùng whitespace (4 spaces) thay vì { } để phân chia block. Sai indent sẽ gây SyntaxError.',
    },
    {
      id: 'q01-4',
      type: 'multiple-choice',
      question: 'List comprehension `[x*2 for x in range(5) if x > 2]` cho kết quả gì?',
      options: ['[0, 2, 4, 6, 8]', '[6, 8]', '[4, 6, 8]', '[3, 4]'],
      correctAnswer: '[6, 8]',
      explanation:
        'range(5) = [0,1,2,3,4]. Lọc x > 2 → [3,4]. Nhân 2 → [6,8]. Tương đương: [0,1,2,3,4].filter(x => x > 2).map(x => x*2).',
      hint: 'range(5) tạo [0,1,2,3,4]. Lọc trước, transform sau.',
    },
    {
      id: 'q01-5',
      type: 'multiple-choice',
      question: '@dataclass trong Python tương đương gì trong TypeScript/NestJS?',
      options: [
        'interface',
        'class-validator DTO',
        'enum',
        'type alias',
      ],
      correctAnswer: 'class-validator DTO',
      explanation:
        '@dataclass tự động tạo constructor, repr (toString), eq — giống DTO trong NestJS khi dùng class-validator để validate data.',
    },
  ],
};
