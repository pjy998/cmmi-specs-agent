# MCP Installation and Setup Guide

## Overview

This guide provides comprehensive instructions for installing and configuring the MCP (Model Context Protocol) multi-agent system with VS Code integration.

## Installation Status

✅ **MCP SDK Installed**: @modelcontextprotocol/sdk@0.5.0  
✅ **MCP Server Built**: dist/server.js  
✅ **VS Code Configuration Updated**: mcp.json  
✅ **Workspace Configuration Created**: .vscode/settings.json  
✅ **Connection Test Passed**: All 6 tools available  

**Note**: VS Code Insiders support is included and properly configured.

## Prerequisites

### Required Software

1. **Node.js** (v18+ or v20+ LTS recommended)
2. **VS Code** or **VS Code Insiders**
3. **GitHub Copilot** extension
4. **GitHub Copilot Chat** extension

### System Requirements

- macOS, Windows, or Linux
- Internet connection for package installation
- Administrative privileges for VS Code configuration

## Quick Installation

### Automated Installation

```bash
# Clone the repository
git clone https://github.com/pjy998/cmmi-specs-agent.git
cd cmmi-specs-agent

# Run automated installation script
./install-mcp.sh
```

The script will automatically:
- Install Node.js dependencies
- Build the MCP server
- Configure VS Code settings
- Test the connection

### Manual Installation

If automated installation fails, follow these steps:

#### Step 1: Install Node.js

**Option A: Official Download (Recommended)**
1. Visit https://nodejs.org/
2. Download LTS version (v18 or v20)
3. Run the installer package
4. Restart terminal after installation

**Option B: Using nvm (Node Version Manager)**
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal or run
source ~/.zshrc

# Install Node.js
nvm install --lts
nvm use --lts
```

#### Step 2: Install Project Dependencies

```bash
cd mcp-server
npm install
npm run build
```

#### Step 3: Configure VS Code

**For VS Code:**
```bash
# Create VS Code MCP configuration
mkdir -p ~/Library/Application\ Support/Code/User/
cp configs/mcp-config-insiders.json ~/Library/Application\ Support/Code/User/mcp.json
```

**For VS Code Insiders:**
```bash
# Create VS Code Insiders MCP configuration
mkdir -p ~/Library/Application\ Support/Code\ -\ Insiders/User/
cp configs/mcp-config-insiders.json ~/Library/Application\ Support/Code\ -\ Insiders/User/mcp.json
```

#### Step 4: Install Required Extensions

In VS Code:
1. Open Extensions panel (Cmd+Shift+X)
2. Install "GitHub Copilot"
3. Install "GitHub Copilot Chat"

## Available MCP Tools

| Tool Name | Description | Usage |
|-----------|-------------|-------|
| `task_analyze` | Analyze task complexity and recommend agents | `task_analyze "your task description"` |
| `cmmi_init` | Initialize standard CMMI agent configurations | `cmmi_init` |
| `agent_create` | Create AI agents with specific capabilities | `agent_create name="my-agent"` |
| `workflow_execute` | Execute multi-agent workflow orchestration | `workflow_execute "project description"` |
| `agent_list` | List all available agents and capabilities | `agent_list` |
| `config_validate` | Validate agent configuration files | `config_validate` |

## Usage Instructions

### Getting Started

1. **Restart VS Code** after installation to load new configuration
2. **Open Copilot Chat** (Cmd+Shift+I or click chat icon)
3. **Test MCP connection** by typing: `cmmi_init`

### Example Workflows

#### Analyze a New Project
```
task_analyze "Build a user authentication system with JWT tokens"
```

#### Initialize CMMI Agents
```
cmmi_init
```

#### Execute Multi-Agent Workflow
```
workflow_execute "Implement a RESTful API for blog management"
```

### Checking MCP Status

**In VS Code Copilot Chat:**
```
agent_list
```

**In Terminal:**
```bash
# Check if MCP server is running
ps aux | grep mcp-server

# Test tool availability
cd mcp-server
npm test
```

## Troubleshooting

### Common Issues

**Issue**: MCP tools not available in Copilot Chat
**Solution**: 
1. Restart VS Code
2. Check that mcp.json is in the correct location
3. Verify server build: `cd mcp-server && npm run build`

**Issue**: Permission denied when creating configuration
**Solution**: 
```bash
sudo mkdir -p ~/Library/Application\ Support/Code/User/
sudo chown $USER ~/Library/Application\ Support/Code/User/
```

**Issue**: Node.js not found
**Solution**: 
1. Verify installation: `node --version`
2. Check PATH: `echo $PATH`
3. Restart terminal

### Debug Commands

```bash
# Verify Node.js installation
node --version
npm --version

# Check MCP server build
cd mcp-server
ls -la dist/

# Test MCP server directly
node dist/server.js

# Validate agent configurations
./tests/verify-mcp.sh
```

### Log Files

- **MCP Server Logs**: `mcp-server/logs/`
- **VS Code Logs**: Help → Toggle Developer Tools → Console
- **Installation Logs**: Check terminal output during installation

## Configuration Files

### MCP Configuration (mcp.json)
```json
{
  "mcpServers": {
    "cmmi-specs-agent": {
      "command": "node",
      "args": ["dist/server.js"],
      "cwd": "/path/to/cmmi-specs-agent/mcp-server"
    }
  }
}
```

### VS Code Workspace Settings (.vscode/settings.json)
```json
{
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "copilot.enabled": true
}
```

## Next Steps

After successful installation:

1. **Explore Documentation**: Check `docs/DOCUMENTATION_OVERVIEW.md`
2. **Run Examples**: Try the example workflows in `docs/USAGE_GUIDE.md`
3. **Create Custom Agents**: Use `agent_create` to build specialized agents
4. **Setup Projects**: Use `cmmi_init` to standardize your development process

## Support

- **Documentation**: [docs/](../docs/)
- **Issues**: Report problems via GitHub Issues
- **Updates**: Check for updates regularly with `git pull`

---

*This guide consolidates installation procedures for both automated and manual setup processes.*
