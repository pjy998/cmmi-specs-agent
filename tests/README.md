# Tests Directory

这个目录包含了 CMMI Specs Agent 项目的所有测试工具。

## 测试文件说明

### 🚀 统一测试启动器

- **`run-all-tests.js`** - 主要的统一测试脚本，运行所有测试并生成统一报告

### 🔧 核心测试工具

- **`mcp-client-test.js`** - MCP协议完整性测试，验证6个核心工具的功能
- **`validate-tools.js`** - 工具定义验证，检查JSON Schema兼容性 (已废弃)
- **`verify-mcp.sh`** - 环境验证脚本，检查依赖和配置
- **`test-document-auto-landing.mjs`** - 文档自动生成功能的端到端测试

### 🌐 通用测试框架

- **`universal-test-framework.js`** - 通用多语言测试框架核心类
- **`test-scenarios.json`** - 默认测试场景配置文件
- **`run-universal-tests.js`** - 通用框架主运行脚本
- **`test-integration.js`** - 框架集成验证脚本

## 运行测试

### 快速启动

#### 运行完整测试套件（推荐）

```bash
node tests/run-all-tests.js
```

#### 单独运行通用测试框架

```bash
cd tests
node run-universal-tests.js
```

#### 基础集成验证

```bash
cd tests  
node test-integration.js
```

```bash
# 运行完整测试套件
./test-all.sh

# 或者直接运行
node tests/run-all-tests.js
```

### 单独测试

```bash
# MCP协议测试
node tests/mcp-client-test.js

# 工具验证
node tests/validate-tools.js

# 环境检查
./tests/verify-mcp.sh

# 文档生成测试
node tests/test-document-auto-landing.mjs
```

## 测试输出

所有测试结果都统一输出到 `test-output/` 目录：

- `unified-test-report.json` - 完整测试套件报告
- `mcp-protocol-test-report.json` - MCP协议测试详细报告
- `universal-test-report.json` - 通用框架测试报告
- `docs/` - 生成的CMMI文档
- `agents/` - 测试用的代理配置

## 通用测试框架详解

### 特性

通用测试框架是一个配置驱动的多语言测试系统，支持：

- 🌐 **多语言支持**: 中文、英文、混合语言文档
- ⚙️ **配置驱动**: JSON场景配置，无需修改代码
- 🚀 **自动化验证**: 内容长度、语言检测、CMMI标准检查
- 📊 **详细报告**: 成功率统计和详细失败原因

### 场景配置示例

```json
{
  "scenarios": [
    {
      "id": "chinese-system",
      "name": "中文系统测试",
      "language": "zh",
      "task_content": "开发基于Vue.js的管理系统",
      "expected_files": ["requirements.md", "design.md"],
      "validation_rules": {
        "min_content_length": 100,
        "required_sections": ["# "],
        "language_consistency": true
      }
    }
  ]
}
```

### 自定义测试

1. 创建自定义场景文件 `my-scenarios.json`
2. 运行: `node run-universal-tests.js my-scenarios.json`
3. 查看详细报告: `test-output/universal-test-report.json`

### 支持的验证规则

- `min_content_length`: 最小内容长度
- `required_sections`: 必需章节标题
- `cmmi_headers`: CMMI标准标题检查
- `api_placeholder_check`: API占位符检查
- `language_consistency`: 语言一致性验证

所有测试结果和生成的文件都保存在 `test-output/` 目录：

```text
test-output/
├── unified-test-report.json    # 统一测试报告
├── mcp-protocol-test-report.json  # MCP协议测试详细报告
├── agents/                     # 生成的代理配置
├── docs/                       # 生成的文档
└── ...                         # 其他测试输出
```

## 测试状态

- ✅ **环境检查**: 验证Node.js、npm、MCP服务器构建状态
- ✅ **MCP协议测试**: 6/6 工具通过测试，成功率100%
- ✅ **工具定义验证**: JSON Schema兼容性检查通过
- ⚠️ **文档自动生成**: 基本功能正常，部分测试检查需要调整

## 测试覆盖范围

1. **环境验证**: Node.js版本、依赖包、构建状态
2. **协议兼容性**: MCP JSON-RPC 2.0 协议握手和通信
3. **工具功能**: 6个核心MCP工具的完整功能测试
4. **文档生成**: 多代理协作的文档自动生成流程
5. **配置验证**: 代理配置文件的正确性检查
