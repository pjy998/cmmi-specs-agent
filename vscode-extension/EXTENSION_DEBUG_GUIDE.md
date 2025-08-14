# 🚀 VS Code 扩展开发启动指南

## 🎯 当前状态
✅ VS Code已启动  
✅ 扩展项目已打开  
✅ 配置文件已创建  

## 📋 启动扩展开发的步骤

### 方法1: Mac键盘启动调试 (推荐)

1. **确保在VS Code中**
   - 当前工作区应该显示: `vscode-extension`
   - 左侧文件浏览器中应该看到扩展项目文件

2. **Mac启动调试的方法**
   - **选项A**: 按 `fn + F5` (如果F5键被系统占用)
   - **选项B**: 使用菜单 `运行 → 启动调试`
   - **选项C**: 按 `Cmd+Shift+P` 然后输入 `Debug: Start Debugging`

3. **选择调试配置**
   - 如果弹出选择菜单，选择 `Run Extension`
   - 系统会自动编译扩展并启动新的VS Code窗口

### 方法2: 使用调试面板

1. **打开调试面板**
   - 点击左侧活动栏的调试图标 (🐛)
   - 或按 `Cmd+Shift+D`

2. **选择配置**
   - 在调试面板顶部，确保选择了 `Run Extension`

3. **点击绿色播放按钮**
   - 或按 `F5`

### 方法3: 使用命令面板

1. **打开命令面板**
   - 按 `Cmd+Shift+P`

2. **搜索调试命令**
   - 输入: `Debug: Start Debugging`
   - 选择并执行

## 🎯 预期结果

启动成功后，您应该看到：

1. **新的VS Code窗口打开**
   - 标题栏显示: `[Extension Development Host]`
   - 这是扩展的测试环境

2. **控制台输出**
   - 在原VS Code窗口的调试控制台中
   - 应该显示: `🚀 CMMI Specs Agent extension is now active!`

3. **扩展已激活**
   - 新窗口中，扩展已经加载并运行

## 🧪 测试扩展功能

在新的VS Code窗口中：

1. **打开命令面板**
   - 按 `Cmd+Shift+P`

2. **搜索CMMI命令**
   - 输入: `CMMI`
   - 应该看到3个命令:
     - `CMMI: Analyze Task`
     - `CMMI: Create Agent`
     - `CMMI: Manage Workflow`

3. **测试任务分析**
   - 选择 `CMMI: Analyze Task`
   - 输入测试任务: `实现用户登录功能`
   - 应该弹出WebView显示分析结果

## 🐛 故障排除

### 问题1: F5没有反应
**解决方案**:
- 确保焦点在VS Code扩展项目中
- 检查是否正确选择了工作区
- 尝试使用调试面板的绿色按钮

### 问题2: 编译错误
**解决方案**:
```bash
# 在终端中手动编译
cd /Users/pengjiebin/Documents/GitHub/cmmi-specs-agent/vscode-extension
npm run compile
```

### 问题3: 没有看到调试配置
**解决方案**:
- 确保 `.vscode/launch.json` 文件存在
- 重新加载VS Code窗口: `Cmd+Shift+P` → `Developer: Reload Window`

### 问题4: 扩展没有激活
**解决方案**:
- 检查调试控制台是否有错误信息
- 确保package.json中的main字段指向正确的文件

## ✅ 验证清单

- [ ] F5启动调试成功
- [ ] 新的VS Code窗口打开（标题显示Extension Development Host）
- [ ] 控制台显示扩展激活消息
- [ ] 命令面板中显示3个CMMI命令
- [ ] 任务分析功能正常工作
- [ ] WebView正确显示结果

## 🎯 成功标志

当您看到以下内容时，说明扩展开发环境已成功启动：

1. **新VS Code窗口**: 标题包含 `[Extension Development Host]`
2. **激活消息**: 调试控制台显示扩展激活日志
3. **命令可用**: 可以在命令面板中找到CMMI命令
4. **功能正常**: 任务分析等功能正常运行

---

**🚀 立即行动**: 在VS Code中按F5键启动扩展开发！
