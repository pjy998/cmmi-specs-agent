# VS Code MCP 功能测试指南

## 重新加载VS Code

1. 在VS Code中按 `Cmd+Shift+P` (macOS) 或 `Ctrl+Shift+P` (Windows/Linux)
2. 输入: `Developer: Reload Window`
3. 按回车执行

## 打开GitHub Copilot Chat

1. 按 `Cmd+Shift+I` (macOS) 或 `Ctrl+Shift+I` (Windows/Linux)
2. 或点击侧边栏的聊天图标

## 测试CMMI功能

在Chat窗口中依次测试以下命令:

### 测试1: 需求开发流程
```
请帮我生成一个CMMI Level 3的需求开发流程文档
```

### 测试2: 技术方案设计
```
我需要创建一个技术方案设计模板，符合CMMI标准
```

### 测试3: 验证和确认
```
生成一个验证和确认的检查清单
```

### 测试4: 过程改进
```
创建一个CMMI过程改进计划模板
```

### 测试5: 质量保证
```
帮我设计一个软件质量保证流程
```

## 成功标志

如果看到以下情况，说明MCP服务正常工作:

- ✅ Chat能理解CMMI相关概念
- ✅ 生成结构化的CMMI文档
- ✅ 提供符合CMMI Level 3要求的模板
- ✅ 支持中文和英文文档生成
- ✅ 能回答具体的CMMI实施问题

## 故障排除

### 如果Chat无响应或不理解CMMI:

1. **检查开发者控制台**:
   - 按 `Cmd+Option+I` 打开开发者工具
   - 查看Console标签页的错误信息

2. **验证MCP配置**:
   - 检查 `~/Library/Application Support/Code/User/mcp.json`
   - 确保JSON格式正确
   - 确认包含 `cmmi-specs-mcp` 配置

3. **重新安装**:
   ```bash
   npm cache clean --force
   npx -y cmmi-specs-mcp@latest --help
   ```

4. **网络检查**:
   - 确保可以访问npm registry
   - 检查防火墙设置

## 高级测试

### 测试多语言支持
```
Please generate a CMMI Level 3 requirements development process document in English
```

### 测试具体模板
```
生成一个软件需求规格说明书(SRS)模板，符合CMMI RD实践要求
```

### 测试过程域知识
```
解释CMMI中的需求开发(RD)过程域的具体实践
```

---

📞 **如果遇到问题，请检查:**
- VS Code版本是否支持MCP
- GitHub Copilot扩展是否已安装并登录  
- 网络连接是否正常
