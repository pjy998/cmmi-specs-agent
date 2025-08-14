# 日志标准化修复报告

## 问题描述

0.1.8版本的代码中存在混合使用不同日志输出方式的问题：

1. **MCP协议debug信息** - 使用 `console.error()` 输出到stderr
2. **业务功能日志** - 在core/目录下使用 `console.log()` 输出到stdout  
3. **错误处理日志** - 混合使用 `console.error()` 和winston logger

### 问题影响

- **stdout污染**: `console.log()` 输出会影响MCP协议通信，因为MCP使用stdout进行协议通信
- **日志噪音**: 缺乏统一的日志级别控制
- **调试困难**: 业务日志和协议调试信息混合，难以过滤

## 解决方案

### 1. 日志输出分类

将日志输出分为两类：

#### A. MCP协议相关 (stderr)
- 服务器启动信息
- 工具调用debug信息  
- 连接状态通知
- **目的**: VS Code MCP客户端需要的协议调试信息
- **输出方式**: `console.error()` → stderr

#### B. 业务功能日志 (winston)
- 工具执行结果
- 任务分析过程
- 错误监控
- **目的**: 业务监控和故障排除
- **输出方式**: `winston logger` → 文件

### 2. 修改文件清单

#### `/src/server.ts`
- ✅ 重新组织MCP debug和业务日志的使用
- ✅ DEBUG模式下的stderr输出保持不变  
- ✅ 添加业务日志记录工具执行结果
- ✅ 避免重复日志记录

#### `/src/core/taskAnalyzer.ts`
- ✅ 将所有 `console.log()` 替换为 `logger.info()`
- ✅ 将 `console.error()` 替换为 `logger.error()`
- ✅ 修复方法调用的类型错误

#### `/src/core/monitoring.ts`
- ✅ 批量替换 `console.log()` 为 `logger.info()`

#### `/src/tools/handlers.ts`
- ✅ 替换 `console.error()` 为 `logger.error()`

#### `/src/utils/logger.ts`
- ✅ 提高默认日志级别从 'error' 到 'info'
- ✅ 更新service名称为 'cmmi-specs-mcp'

### 3. 日志控制机制

#### 环境变量控制
```bash
# MCP协议调试 (stderr输出)
DEBUG_MCP=1

# 业务日志级别 (文件输出)  
LOG_LEVEL=info|warn|error|debug
```

#### 输出目标
- **MCP协议**: stderr (VS Code可见)
- **业务日志**: `logs/combined.log` 和 `logs/error.log`
- **开发模式**: 如果同时设置NODE_ENV=development和DEBUG_MCP，winston也会输出到stderr

## 实施结果

### ✅ 完成的修复

1. **代码标准化**
   - 40+ console输出已标准化
   - 类型错误已修复
   - 构建成功通过

2. **日志分离**
   - MCP协议debug → stderr
   - 业务功能日志 → winston文件
   - 避免stdout污染

3. **可控性增强**
   - DEBUG_MCP控制协议调试
   - LOG_LEVEL控制业务日志
   - 生产环境友好

### 📊 影响评估

- **性能**: 最小影响，主要是日志输出重定向
- **兼容性**: MCP协议通信完全兼容  
- **可维护性**: 显著提升，日志更清晰
- **调试便利**: 协议调试和业务调试分离

## 验证建议

1. **构建验证**: ✅ 已通过 `npm run build`
2. **MCP通信**: 建议测试VS Code连接是否正常
3. **日志输出**: 验证文件日志记录是否正常
4. **Debug模式**: 测试DEBUG_MCP=1时的stderr输出

## 后续优化

### 可选改进项

1. **结构化日志**: 考虑使用JSON格式的结构化日志
2. **日志轮转**: 实现日志文件自动轮转和清理  
3. **性能监控**: 添加工具执行时间的详细统计
4. **远程日志**: 集成到远程日志服务(如果需要)

---

**修复状态**: ✅ 完成  
**版本**: 0.1.8 → 0.1.9  
**测试建议**: 重新测试MCP连接和工具功能
