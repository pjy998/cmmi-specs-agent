import { UnifiedToolHandlers } from './dist/tools/handlers.js';

// 测试workspace roots功能
const testWorkspaceRoots = async () => {
  console.log('🎯 测试工作区根路径功能...\n');

  // 测试1: 没有project_path的情况下创建代理（应该使用当前目录）
  console.log('1️⃣ 测试：没有指定project_path时的默认行为');
  try {
    const result = await UnifiedToolHandlers.manageAgent({
      action: "create",
      name: "default-test-agent",
      description: "测试默认路径行为的代理",
      capabilities: ["测试", "默认路径"],
      model: "gpt-4.1"
    });
    
    console.log('✅ 默认行为测试结果:');
    console.log(`   创建路径: ${result.file_path}`);
    console.log(`   成功: ${result.success}`);
  } catch (error) {
    console.error('❌ 默认行为测试失败:', error.message);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // 测试2: 指定project_path的情况
  console.log('2️⃣ 测试：明确指定project_path');
  try {
    const specificPath = '/Users/jieky/demo01/demo4';
    const result = await UnifiedToolHandlers.manageAgent({
      action: "create", 
      name: "specific-path-agent",
      description: "测试指定路径的代理",
      capabilities: ["测试", "指定路径"],
      model: "gpt-4.1",
      project_path: specificPath
    });
    
    console.log('✅ 指定路径测试结果:');
    console.log(`   创建路径: ${result.file_path}`);
    console.log(`   成功: ${result.success}`);
    console.log(`   是否使用指定路径: ${result.file_path.includes(specificPath)}`);
  } catch (error) {
    console.error('❌ 指定路径测试失败:', error.message);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // 测试3: 列出不同路径的代理
  console.log('3️⃣ 测试：列出不同路径的代理');
  try {
    // 列出当前目录的代理
    const currentResult = await UnifiedToolHandlers.manageAgent({
      action: "list"
    });
    
    console.log('✅ 当前目录代理列表:');
    console.log(`   代理数量: ${currentResult.agents.length}`);
    console.log(`   代理目录: ${currentResult.agents_directory}`);

    // 列出指定路径的代理
    const specificResult = await UnifiedToolHandlers.manageAgent({
      action: "list",
      project_path: '/Users/jieky/demo01/demo4'
    });

    console.log('\n✅ 指定路径代理列表:');
    console.log(`   代理数量: ${specificResult.agents.length}`);
    console.log(`   代理目录: ${specificResult.agents_directory}`);
    
  } catch (error) {
    console.error('❌ 列表测试失败:', error.message);
  }

  console.log('\n🎉 工作区根路径功能测试完成！');
};

testWorkspaceRoots();
