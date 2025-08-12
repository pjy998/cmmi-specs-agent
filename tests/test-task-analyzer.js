import { TaskAnalyzer } from '../mcp-server/dist/core/task-analyzer.js';

// 测试智能任务分析器
async function testTaskAnalyzer() {
    console.log('🧠 测试智能任务分析器...');
    
    try {
        const analyzer = new TaskAnalyzer();
        
        // 测试用例1: 简单Web开发任务
        console.log('\n🔸 测试用例1: 简单Web开发任务');
        const simpleWebTask = {
            content: '创建一个用户注册和登录的网页，包含基本的表单验证功能',
            domain: 'webDevelopment',
            complexityHint: 'simple'
        };
        
        const result1 = await analyzer.analyzeTask(simpleWebTask);
        console.log(`✅ 分析结果: 复杂度=${result1.complexity.level}, 推荐代理=${result1.recommendedAgents.length}个`);
        console.log(`📊 可行性评分: ${(result1.feasibilityScore * 100).toFixed(1)}%`);
        console.log(`⏱️ 预估时间: ${result1.estimatedCost.totalHours}小时`);
        
        // 测试用例2: 复杂数据科学任务
        console.log('\n🔸 测试用例2: 复杂数据科学任务');
        const complexDataTask = {
            content: '构建一个机器学习推荐系统，需要处理大规模用户行为数据，实现实时推荐算法，集成多个外部API，并提供可视化分析仪表板',
            domain: 'dataScience',
            complexityHint: 'complex',
            timeConstraint: 40
        };
        
        const result2 = await analyzer.analyzeTask(complexDataTask);
        console.log(`✅ 分析结果: 复杂度=${result2.complexity.level}, 推荐代理=${result2.recommendedAgents.length}个`);
        console.log(`📊 可行性评分: ${(result2.feasibilityScore * 100).toFixed(1)}%`);
        console.log(`⏱️ 预估时间: ${result2.estimatedCost.totalHours}小时`);
        
        if (result2.warnings.length > 0) {
            console.log(`⚠️ 警告: ${result2.warnings.join(', ')}`);
        }

        // 测试用例3: 移动应用开发
        console.log('\n🔸 测试用例3: 移动应用开发');
        const mobileTask = {
            content: '开发一个跨平台的任务管理APP，支持离线同步，推送通知，用户协作功能',
            domain: 'mobile',
            projectContext: {
                type: 'mobile',
                technologies: ['React Native', 'Firebase', 'Redux'],
                constraints: ['iOS和Android兼容', '离线支持'],
                existingComponents: ['用户认证服务'],
                teamSize: 3,
                timeline: 60
            }
        };
        
        const result3 = await analyzer.analyzeTask(mobileTask);
        console.log(`✅ 分析结果: 复杂度=${result3.complexity.level}, 推荐代理=${result3.recommendedAgents.length}个`);
        console.log(`📋 解析需求: ${result3.parsedRequirements.length}个`);
        console.log(`📅 执行阶段: ${result3.executionPlan.phases.length}个`);
        
        // 显示推荐代理
        console.log('\n🤖 推荐代理详情:');
        result3.recommendedAgents.slice(0, 3).forEach(agent => {
            console.log(`  - ${agent.agentId}: ${agent.role} (置信度: ${(agent.confidence * 100).toFixed(1)}%)`);
        });

        // 显示执行计划
        console.log('\n📅 执行计划:');
        result3.executionPlan.phases.forEach(phase => {
            console.log(`  - ${phase.name}: ${phase.estimatedDuration}小时 (${phase.riskLevel}风险)`);
        });

        // 测试复杂度评估
        console.log('\n🔸 测试复杂度评估功能');
        const complexityTest = await analyzer.assessComplexity(
            '构建企业级微服务架构，包含用户管理、订单处理、支付系统、实时通知、数据分析等模块'
        );
        console.log(`📊 复杂度评估: ${complexityTest.level} (评分: ${complexityTest.score})`);
        console.log(`🔍 主要因素: ${complexityTest.factors.map(f => f.name).join(', ')}`);

        // 测试需求解析
        console.log('\n🔸 测试需求解析功能');
        const requirements = await analyzer.parseRequirements(`
            1. 用户必须能够注册和登录账户
            2. 系统应该支持多种支付方式
            3. 可以提供实时数据分析功能
            4. 需要确保数据安全和隐私保护
        `);
        console.log(`📋 解析到 ${requirements.length} 个需求:`);
        requirements.forEach(req => {
            console.log(`  - ${req.description} (优先级: ${req.priority}, 复杂度: ${req.complexity})`);
        });

        // 测试代理推荐
        console.log('\n🔸 测试代理推荐功能');
        const agentRecs = await analyzer.recommendAgents(requirements, 'webDevelopment');
        console.log(`🤖 推荐 ${agentRecs.length} 个代理:`);
        agentRecs.slice(0, 3).forEach(agent => {
            console.log(`  - ${agent.agentId}: ${agent.role} (优先级: ${agent.priority}, 工作量: ${agent.estimatedWorkload}h)`);
        });

        // 测试相似任务查找
        console.log('\n🔸 测试相似任务查找');
        const similarTasks = await analyzer.findSimilarTasks('创建用户管理系统');
        console.log(`🔍 找到 ${similarTasks.length} 个相似任务`);
        
        // 测试学习反馈
        console.log('\n🔸 测试学习反馈功能');
        await analyzer.provideFeedback({
            taskId: result1.taskId,
            actualComplexity: {
                level: 'medium',
                score: 45,
                factors: [],
                reasoning: '实际比预期复杂'
            },
            actualDuration: 12,
            userSatisfaction: 4,
            notes: '需要更多技术调研时间'
        });
        console.log('✅ 学习反馈已记录');

        // 测试批量分析
        console.log('\n🔸 测试批量分析功能');
        const batchTasks = [
            { content: '创建简单博客网站' },
            { content: '开发在线购物车功能' },
            { content: '实现用户评论系统' }
        ];
        
        const batchResults = await analyzer.analyzeBatch(batchTasks);
        console.log(`📦 批量分析完成: ${batchResults.length}个任务`);
        
        // 显示分析器状态
        console.log('\n📊 分析器状态统计:');
        const state = analyzer.getState();
        console.log(`  - 已完成分析: ${state.completedAnalyses.length}个任务`);
        console.log(`  - 学习数据: ${state.learningData.length}条`);
        console.log(`  - 性能指标: ${state.performanceMetrics.length}条`);
        
        // 计算平均处理时间
        if (state.performanceMetrics.length > 0) {
            const avgTime = state.performanceMetrics.reduce((sum, m) => sum + m.processingTime, 0) / state.performanceMetrics.length;
            console.log(`  - 平均处理时间: ${avgTime.toFixed(1)}ms`);
        }

        console.log('\n✅ 智能任务分析器测试完成');

    } catch (error) {
        console.error('❌ 任务分析器测试失败:', error);
        throw error;
    }
}

// 保存测试结果
function saveTestResults(results) {
    // 这里可以保存测试结果到文件
    console.log('📁 测试结果记录完成');
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
    testTaskAnalyzer().catch(error => {
        console.error('测试失败:', error);
        process.exit(1);
    });
}

export { testTaskAnalyzer };
