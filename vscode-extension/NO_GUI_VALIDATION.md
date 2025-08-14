# 🧪 无GUI环境下的VS Code扩展验证方案

## ❌ 问题：VS Code CLI未配置

在当前环境中，`code` 命令不可用，无法直接启动VS Code开发环境。

## ✅ 替代验证方案

### 方案1: 命令行结构验证 ✅

我们已经通过命令行验证了扩展的基本结构：

```bash
✅ package.json配置正确:
- name: "cmmi-specs-vscode"
- displayName: "CMMI Specs Agent"  
- version: "0.1.0"
- main: "./out/extension.js"
- 命令配置: 3个CMMI命令已注册

✅ 编译结果正确:
- out/extension.js (8,867 bytes)
- out/extension.js.map (6,135 bytes)

✅ 源码完整:
- src/extension.ts (324 lines)
```

### 方案2: 手动VS Code验证

如果您有VS Code应用，可以手动验证：

#### 步骤1: 打开扩展项目
1. 启动VS Code应用
2. 文件 → 打开文件夹
3. 选择: `/Users/pengjiebin/Documents/GitHub/cmmi-specs-agent/vscode-extension`

#### 步骤2: 启动扩展调试
1. 在VS Code中按 **F5** 
2. 或者 运行 → 启动调试
3. 选择 "Run Extension" 配置

#### 步骤3: 测试功能
1. 在新窗口中按 **Cmd+Shift+P**
2. 输入 "CMMI" 查看命令
3. 测试 "CMMI: Analyze Task" 功能

### 方案3: 配置VS Code CLI (推荐)

#### 安装VS Code CLI：
```bash
# 如果VS Code已安装但CLI未配置
# 在VS Code中：Cmd+Shift+P → "Shell Command: Install 'code' command in PATH"

# 或者手动配置
sudo ln -fs "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code" /usr/local/bin/code
```

### 方案4: 代码静态分析验证

我们可以通过分析编译后的JavaScript代码来验证功能：
