import { UnifiedToolHandlers } from './dist/tools/handlers.js';

// 测试initCMMIAgents功能
const testInitCMMI = async () => {
  console.log('🔧 测试 CMMI 代理初始化功能...');
  try {
    const result = await UnifiedToolHandlers.manageAgent({
      action: "init_cmmi",
      project_path: "/Users/jieky/demo01/demo3"
    });
    
    console.log('✅ 测试结果:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
};

// 测试单个代理创建功能
const testCreateAgent = async () => {
  console.log('\n🤖 测试单个代理创建功能...');
  try {
    const result = await UnifiedToolHandlers.manageAgent({
      action: "create",
      name: "custom-agent",
      description: "自定义测试代理",
      capabilities: [
        "测试功能",
        "调试问题", 
        "性能优化"
      ],
      model: "gpt-4.1",
      project_path: "/Users/jieky/demo01/demo3"
    });
    
    console.log('✅ 测试结果:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
};

// 测试列出代理功能
const testListAgents = async () => {
  console.log('\n📋 测试列出代理功能...');
  try {
    const result = await UnifiedToolHandlers.manageAgent({
      action: "list",
      project_path: "/Users/jieky/demo01/demo3"
    });
    
    console.log('✅ 测试结果:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
};

const runTests = async () => {
  await testInitCMMI();
  await testCreateAgent();
  await testListAgents();
};

runTests();
