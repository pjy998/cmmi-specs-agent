# 在其他项目中使用CMMI多代理工具指南

## 配置状态确认

✅ **MCP服务器已配置**：`cmmi-specs-agent` 已经配置在VS Code的MCP设置中
✅ **工具已就绪**：所有核心功能模块已完成开发和测试
✅ **全局可用**：一旦VS Code配置完成，所有项目都可以使用

## 在任何项目中使用方法

### 方法1：通过GitHub Copilot Chat使用

在任何VS Code项目中，你可以直接在Copilot Chat中使用以下命令：

```
@cmmi-specs-agent 为我生成一个用户认证系统的完整CMMI文档
```

或者使用具体的工具函数：

```
使用mcp_cmmi-specs-ag_workflow_execute工具为"实现订单管理系统"生成完整文档
```

### 方法2：使用特定的MCP工具

你可以在Copilot Chat中直接调用以下工具：

#### 1. 任务分析
```
使用mcp_cmmi-specs-ag_task_analyze分析任务："开发电商购物车功能"
```

#### 2. 创建代理
```
使用mcp_cmmi-specs-ag_agent_create创建一个新的代理，专门负责前端开发
```

#### 3. 执行工作流
```
使用mcp_cmmi-specs-ag_workflow_execute为"用户注册登录系统"生成完整的CMMI文档集
```

#### 4. 初始化CMMI代理
```
使用mcp_cmmi-specs-ag_cmmi_init在当前项目中初始化标准CMMI代理
```

#### 5. 列出可用代理
```
使用mcp_cmmi-specs-ag_agent_list查看当前项目的所有可用代理
```

## 使用示例

### 示例1：为新功能生成完整文档

假设你在开发一个电商项目，需要实现支付功能：

1. **打开你的项目**：在VS Code中打开任何项目
2. **启动Copilot Chat**：按 `Ctrl+Shift+I` 或 `Cmd+Shift+I`
3. **输入命令**：
   ```
   使用mcp_cmmi-specs-ag_workflow_execute工具，为"实现支付系统集成支付宝和微信支付"任务生成完整的CMMI文档集，项目路径是当前目录
   ```

### 示例2：分析任务复杂度

```
使用mcp_cmmi-specs-ag_task_analyze分析"开发实时聊天功能包含消息推送、文件传输、表情包"的复杂度和所需代理
```

### 示例3：为现有项目添加CMMI流程

```
使用mcp_cmmi-specs-ag_cmmi_init在当前项目目录初始化标准CMMI代理配置
```

## 生成的文档结构

当你使用工作流执行工具时，会在你的项目中自动创建：

```
your-project/
├── feature-name/
│   ├── docs/
│   │   ├── requirements.md      # 需求文档 (CMMI: RD)
│   │   ├── design.md           # 设计文档 (CMMI: TS)
│   │   ├── tasks.md            # 任务管理 (CMMI: PI)
│   │   ├── tests.md            # 测试计划 (CMMI: VER)
│   │   └── implementation.md   # 实现指南 (CMMI: TS)
│   ├── src/                    # 源代码目录
│   └── tests/                  # 测试目录
└── agents/                     # 代理配置文件
    ├── requirements-agent.yaml
    ├── design-agent.yaml
    ├── tasks-agent.yaml
    ├── test-agent.yaml
    └── coding-agent.yaml
```

## 配置检查

### 验证MCP工具是否正常工作

1. 在VS Code中打开任何项目
2. 打开Copilot Chat
3. 输入：
   ```
   使用mcp_cmmi-specs-ag_agent_list查看可用的代理
   ```
4. 如果看到代理列表或相关响应，说明配置成功

### 如果工具不可用

检查以下配置：

1. **VS Code Insiders配置文件位置**：
   ```
   ~/Library/Application Support/Code - Insiders/User/globalStorage/github.copilot-chat/mcp_config.json
   ```

2. **确认配置内容包含**：
   ```json
   {
     "servers": {
       "cmmi-specs-agent": {
         "command": "node",
         "args": ["/Users/pengjiebin/Documents/GitHub/cmmi-specs-agent/mcp-server/dist/server.js"],
         "type": "stdio"
       }
     }
   }
   ```

3. **重启VS Code Insiders**

## 常见使用场景

### 1. 新功能开发
- 分析功能需求
- 生成设计文档
- 创建任务分解
- 制定测试计划
- 编写实现指南

### 2. 项目重构
- 分析重构范围
- 更新设计文档
- 调整任务计划
- 修订测试策略

### 3. 代码审查准备
- 生成完整文档集
- 确保CMMI合规性
- 准备审查材料

### 4. 团队协作
- 标准化文档格式
- 统一开发流程
- 提高文档质量

## 高级用法

### 自定义代理配置

你可以在项目中创建自己的代理配置：

```yaml
# my-custom-agent.yaml
name: frontend-specialist
role: Frontend Developer
capabilities:
  - react-development
  - ui-design
  - user-experience
responsibilities: Focus on frontend implementation and user interface
model: gpt-4.1
systemPrompt: |
  You are a frontend specialist focused on React development.
  Generate code and documentation for user interface components.
```

### 工作流定制

```
使用mcp_cmmi-specs-ag_workflow_execute工具，但只使用指定的代理：["requirements-agent", "design-agent"]来分析"移动端适配"任务
```

## 总结

✅ **即用即享**：VS Code配置完成后，任何项目都可以立即使用
✅ **无需重复配置**：一次配置，全局可用
✅ **智能化**：自动选择适当的代理和生成策略
✅ **标准化**：所有文档都符合CMMI标准

现在你可以在任何项目中通过Copilot Chat直接使用这些强大的CMMI多代理工具了！
