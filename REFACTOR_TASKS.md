# 🎯 VS Code 扩展重构任务清单

## 📋 Phase 1: 项目清理与重构 (本周)

### Task 1.1: 清理过时文档 ✅ 优先级：HIGH
**描述**: 清理项目中过时的测试文档和临时文件
**检查点**: 根目录只保留核心文档，移动相关文档到正确目录

#### 子任务:
- [ ] 删除根目录过时的测试指南文件
  - `complete-usage-guide-v0.1.7.md`
  - `debug-logging-guide.md`
  - `smart-matching-test-guide.md`
  - `test-mcp-tools.md`
  - `ultimate-mcp-test-guide.md`
  - `wake-words-guide.md`
- [ ] 整理docs目录结构
  - 保留核心CMMI标准文档
  - 移除过时的集成指南
- [ ] 清理测试文件
  - 移除过时的JavaScript测试文件

### Task 1.2: 移除模拟AI调用代码 ✅ 优先级：HIGH  
**描述**: 移除ModelScheduler中的模拟API调用，重新定位工具功能
**检查点**: 代码中不再包含simulateApiCall等虚假AI调用

#### 子任务:
- [ ] 修改 `src/core/modelScheduler.ts`
  - 移除 `simulateApiCall` 方法
  - 重新设计为配置和分析工具
  - 保留任务复杂度分析功能
- [ ] 更新相关类型定义
- [ ] 修改工具返回值，返回分析结果而非"AI回答"

### Task 1.3: 创建VS Code扩展基础结构 ✅ 优先级：HIGH
**描述**: 使用官方模板创建VS Code扩展项目
**检查点**: 扩展可以在开发模式下加载并执行基本命令

#### 子任务:
- [ ] 在项目中创建 `vscode-extension/` 目录
- [ ] 使用 `yo code` 生成扩展模板
- [ ] 配置基础的package.json和manifest
- [ ] 实现第一个测试命令：`cmmi.analyzeTask`

---

## 📋 Phase 2: 核心功能验证 (下周)

### Task 2.1: 实现MCP工具迁移 ✅ 优先级：MEDIUM
**描述**: 将现有MCP工具逻辑迁移到VS Code扩展中
**检查点**: 扩展可以调用工具并返回结果

#### 子任务:
- [ ] 创建扩展内的工具提供者
- [ ] 实现任务分析工具
- [ ] 实现代理配置管理工具
- [ ] 测试工具在扩展环境中的运行

### Task 2.2: Copilot Chat集成验证 ✅ 优先级：MEDIUM  
**描述**: 验证扩展可以与VS Code Copilot Chat交互
**检查点**: 用户可以通过Chat触发扩展功能

#### 子任务:
- [ ] 配置Copilot Chat参与者
- [ ] 实现基础的Chat命令响应
- [ ] 测试双向数据传递
- [ ] 验证错误处理机制

---

## 📋 Phase 3: 完整工作流实现 (第三周)

### Task 3.1: CMMI工作流实现 ✅ 优先级：LOW
**描述**: 实现完整的CMMI任务分析和代理协调
**检查点**: 用户可以通过扩展完成完整的CMMI任务流程

### Task 3.2: 用户体验优化 ✅ 优先级：LOW
**描述**: 优化扩展的用户界面和交互体验
**检查点**: 用户反馈良好，功能易用

---

## 🎯 立即行动项 (今天)

### 🧹 清理命令
```bash
# 删除过时的测试和指南文档
rm -f complete-usage-guide-v0.1.7.md
rm -f debug-logging-guide.md
rm -f smart-matching-test-guide.md
rm -f test-mcp-tools.md
rm -f ultimate-mcp-test-guide.md
rm -f wake-words-guide.md

# 清理过时的测试JavaScript文件
rm -f test-agent-*.js
rm -f test-complete-functionality.js
rm -f test-workflow-orchestrator.js
rm -f test-workspace-roots.js

# 移动保留的文档到docs目录
mkdir -p docs/archive
mv TASKS_OLD.md docs/archive/
```

### 🔧 代码修改
1. 立即修改 `ModelScheduler` 移除虚假AI调用
2. 更新工具定义，专注于分析和配置
3. 开始VS Code扩展项目创建

---

## 📊 成功标准

### Week 1 目标
- [ ] 项目清理完成，结构清晰
- [ ] 移除所有虚假的AI调用代码  
- [ ] VS Code扩展基础框架就绪

### Week 2 目标  
- [ ] 扩展可以加载并执行基本命令
- [ ] MCP工具在扩展环境中正常工作
- [ ] 基础的Copilot集成验证完成

### Week 3 目标
- [ ] 完整的CMMI工作流在扩展中运行
- [ ] 用户体验良好，功能稳定
- [ ] 准备发布第一个版本

---

## ⚠️ 风险控制

### 技术风险
- **VS Code API兼容性** → 使用稳定版本API
- **Copilot集成复杂度** → 先验证基础功能
- **工具迁移问题** → 逐步迁移，保持简单

### 时间风险  
- **学习VS Code扩展开发** → 预留额外时间
- **Copilot集成调试** → 准备备选方案

---

## 🔄 下一步行动

1. **立即执行清理命令** - 清理过时文件
2. **修改ModelScheduler** - 移除虚假AI调用
3. **创建扩展项目** - 开始VS Code扩展开发
4. **每日进度检查** - 确保按计划进行

这个任务清单确保我们专注于可行的技术路线，避免在不可行的方案上浪费时间。
