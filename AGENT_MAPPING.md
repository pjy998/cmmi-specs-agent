# MCP工具与代理配置对照表

## 🔧 实际MCP工具 vs 文档中的代理配置

| 文档中的代理 | 实际MCP工具 | 功能对比 | 状态 |
|------------|------------|----------|------|
| requirements-agent | task_analyze | 任务分析 → 需求分析 | ✅ 功能相似 |
| design-agent | - | 设计文档生成 | ❌ 未实现 |
| coding-agent | - | 代码实现 | ❌ 未实现 |
| tasks-agent | workflow_execute | 任务执行 → 工作流执行 | ✅ 功能相似 |
| test-agent | - | 测试执行 | ❌ 未实现 |
| spec-agent | cmmi_init | 规格协调 → CMMI初始化 | ⚠️ 部分功能 |
| - | agent_create | - → 代理创建 | ✅ 新增功能 |
| - | agent_list | - → 代理列表 | ✅ 新增功能 |
| - | config_validate | - → 配置验证 | ✅ 新增功能 |

---

## 🎯 统一后的MCP工具配置

基于实际验证通过的MCP工具，更新agent配置：
