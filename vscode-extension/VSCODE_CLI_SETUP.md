# 🛠️ 配置VS Code CLI 指南

## 🎯 目标
配置VS Code命令行工具，以便能够通过 `code .` 命令启动扩展开发环境。

## 📋 配置方法

### 方法1: 通过VS Code设置 (推荐)

1. **打开VS Code应用**
2. **打开命令面板**: `Cmd+Shift+P` (macOS) 或 `Ctrl+Shift+P` (Windows/Linux)
3. **搜索并执行**: `Shell Command: Install 'code' command in PATH`
4. **验证**: 在终端中运行 `code --version`

### 方法2: 手动配置符号链接

#### 选项A: 系统级别 (需要sudo权限)
```bash
# 为VS Code创建符号链接到系统路径
sudo ln -fs "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code" /usr/local/bin/code
```

#### 选项B: 用户级别 (推荐给M1 Mac)
```bash
# 创建用户本地bin目录
mkdir -p ~/.local/bin

# 创建符号链接到用户目录
ln -fs "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code" ~/.local/bin/code

# 添加到PATH (在 ~/.zshrc 中)
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc

# 重新加载配置
source ~/.zshrc
```

#### 选项C: 直接添加到PATH
```bash
# 添加到PATH (在 ~/.zshrc 或 ~/.bash_profile 中)
echo 'export PATH="$PATH:/Applications/Visual Studio Code.app/Contents/Resources/app/bin"' >> ~/.zshrc
source ~/.zshrc
```

### 方法3: 检查现有安装

```bash
# 检查VS Code是否已安装
ls -la "/Applications/Visual Studio Code.app"

# 检查CLI是否存在
ls -la "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code"

# 检查PATH中的code命令
which code
```

## ✅ 验证配置

配置完成后，运行以下命令验证：

```bash
# 检查VS Code版本
code --version

# 尝试打开当前目录
code .

# 打开特定文件
code package.json
```

## 🚀 启动扩展开发

配置成功后，您可以：

1. **进入扩展目录**:
   ```bash
   cd /Users/pengjiebin/Documents/GitHub/cmmi-specs-agent/vscode-extension
   ```

2. **打开VS Code**:
   ```bash
   code .
   ```

3. **启动调试**: 按 `F5` 或选择 "Run → Start Debugging"

4. **测试扩展**: 在新窗口中按 `Cmd+Shift+P` 搜索 "CMMI"

## 🔧 故障排除

### 问题1: Permission denied
```bash
# 如果遇到权限问题，使用sudo
sudo ln -fs "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code" /usr/local/bin/code
```

### 问题2: VS Code未安装在默认位置
```bash
# 查找VS Code安装位置
find /Applications -name "Visual Studio Code.app" 2>/dev/null

# 或者检查其他常见位置
ls -la ~/Applications/
```

### 问题3: 命令仍然无法使用
```bash
# 重新加载shell配置
source ~/.zshrc

# 或者重启终端
```

## 📝 替代方案

如果无法配置CLI，您仍然可以：

1. **手动打开VS Code** → 文件 → 打开文件夹
2. **拖拽文件夹** 到VS Code图标
3. **右键菜单** (如果支持) → "Open with VS Code"

## 🎯 配置成功后的下一步

1. **验证扩展功能** - 按照验证指南测试
2. **开始Phase 2开发** - MCP工具集成
3. **用户体验优化** - 界面和交互改进

---

**💡 提示**: 配置VS Code CLI后，开发效率将显著提升，强烈建议完成此配置！
