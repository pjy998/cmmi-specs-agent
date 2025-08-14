# 🍎 Mac专用 VS Code扩展调试指南

## 🎯 Mac键盘说明

在Mac上，F5键通常被系统占用（调节亮度），所以启动VS Code扩展调试有以下几种方法：

## 🚀 启动方法 (按推荐顺序)

### 方法1: 使用菜单 (最可靠)
1. 在VS Code中点击顶部菜单 `运行`
2. 选择 `启动调试`
3. 如果弹出配置选择，选择 `Run Extension`

### 方法2: 使用命令面板 (推荐)
1. 按 `Cmd+Shift+P` 打开命令面板
2. 输入: `Debug: Start Debugging`
3. 按回车执行

### 方法3: 使用调试面板
1. 点击左侧活动栏的调试图标 🐛
2. 确保顶部选择了 `Run Extension`
3. 点击绿色的播放按钮 ▶️

### 方法4: 功能键 (如果可用)
1. 按 `fn + F5` (fn键 + F5键同时按)
2. 如果还不行，检查系统偏好设置中的键盘设置

## 📱 Mac键盘设置检查

如果想使用F5键，可以检查系统设置：

1. **系统偏好设置** → **键盘**
2. 勾选 **将F1、F2等键用作标准功能键**
3. 这样就可以直接按F5，不需要fn键

## 🎯 预期结果

无论使用哪种方法，成功后都会：

1. **新VS Code窗口打开**
   - 标题显示: `[Extension Development Host]`

2. **调试控制台显示**
   - `🚀 CMMI Specs Agent extension is now active!`

3. **扩展命令可用**
   - 在新窗口按 `Cmd+Shift+P`
   - 搜索 `CMMI` 能看到3个命令

## 🧪 Mac专用测试步骤

1. **启动调试** (使用上述任一方法)
2. **等待新窗口** (标题包含Extension Development Host)
3. **测试命令**: 在新窗口中按 `Cmd+Shift+P`
4. **搜索CMMI**: 输入 `CMMI` 查看命令列表
5. **测试功能**: 选择 `CMMI: Analyze Task`

## 🔧 Mac专用故障排除

### 问题: 菜单中没有"运行"选项
**解决**: 确保VS Code处于活动状态，菜单应该在屏幕顶部

### 问题: 调试面板没有配置
**解决**: 
- 确保打开了正确的工作区 (vscode-extension文件夹)
- 检查 `.vscode/launch.json` 文件是否存在

### 问题: 新窗口没有打开
**解决**:
- 检查调试控制台是否有错误信息
- 尝试重新编译: 在终端运行 `npm run compile`

### 问题: SQLite 实验性功能警告

**现象**: 调试控制台显示 `(node:xxxxx) ExperimentalWarning: SQLite is an experimental feature`

**原因**: Node.js 20.x 版本内置了实验性的 SQLite 支持，MCP SDK 或其他依赖可能触发此警告

**解决方案**:

1. **方法1: 添加Node.js启动参数** (推荐)
   - 在 `.vscode/launch.json` 中添加 `--no-warnings` 参数
   
2. **方法2: 环境变量**
   - 设置 `NODE_NO_WARNINGS=1` 环境变量
   
3. **方法3: 忽略特定警告**
   - 使用 `--disable-warning=ExperimentalWarning` 参数

**注意**: 这是无害的警告，不影响扩展功能，可以安全忽略

---

## 🎉 Mac用户推荐流程

**最简单的方法**:

1. 在VS Code中按 `Cmd+Shift+P`
2. 输入 `Debug: Start Debugging`
3. 按回车

这是在Mac上最可靠的启动方式！
