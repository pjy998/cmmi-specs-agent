import { QualityAssuranceSystem } from '../mcp-server/dist/core/quality-assurance.js';
import fs from 'fs';
import path from 'path';

// 测试质量保证系统
async function testQualityAssuranceSystem() {
    console.log('🔍 测试质量保证系统...');
    
    try {
        const qaSystem = new QualityAssuranceSystem();
        
        // 创建临时测试项目
        const testProjectPath = createTestProject();
        
        // 测试用例1: 完整质量分析
        console.log('\n🔸 测试用例1: 完整质量分析');
        const analysisRequest = {
            projectPath: testProjectPath,
            language: 'javascript',
            includeTests: true,
            includeDependencies: true,
            reportFormat: 'json'
        };
        
        const analysisResult = await qaSystem.analyzeQuality(analysisRequest);
        console.log(`✅ 质量分析完成: 状态=${analysisResult.status}, 耗时=${analysisResult.duration}ms`);
        console.log(`📊 整体质量评分: ${analysisResult.report.metrics.overall.toFixed(1)}`);
        console.log(`🧪 测试覆盖率: ${analysisResult.dashboard.coverage.lines}%`);
        console.log(`🔒 安全评分: ${analysisResult.report.metrics.security.toFixed(1)}`);
        console.log(`📁 生成工件: ${analysisResult.artifacts.length}个`);

        // 测试用例2: 代码质量专项分析
        console.log('\n🔸 测试用例2: 代码质量专项分析');
        const codeQualityReport = await qaSystem.analyzeCodeQuality(testProjectPath, 'javascript');
        console.log(`✅ 代码质量分析: ${codeQualityReport.language}`);
        console.log(`📋 质量问题: ${codeQualityReport.issues.length}个`);
        console.log(`💡 改进建议: ${codeQualityReport.suggestions.length}个`);
        console.log(`📈 质量趋势: ${codeQualityReport.trend.direction}`);
        
        // 显示质量问题详情
        if (codeQualityReport.issues.length > 0) {
            console.log('\n📋 质量问题详情:');
            codeQualityReport.issues.slice(0, 3).forEach(issue => {
                console.log(`  - ${issue.title} (${issue.severity}): ${issue.file}:${issue.line}`);
            });
        }

        // 测试用例3: 测试分析
        console.log('\n🔸 测试用例3: 测试分析');
        const testSuites = await qaSystem.runTests(testProjectPath);
        console.log(`✅ 运行测试套件: ${testSuites.length}个`);
        
        for (const suite of testSuites) {
            const passRate = ((suite.passedTests / suite.totalTests) * 100).toFixed(1);
            console.log(`  - ${suite.name}: ${suite.passedTests}/${suite.totalTests} 通过 (${passRate}%)`);
        }

        // 测试覆盖率分析
        const coverage = await qaSystem.analyzeCoverage(testProjectPath);
        console.log(`📊 详细覆盖率: Lines=${coverage.lines}%, Functions=${coverage.functions}%, Branches=${coverage.branches}%`);

        // 测试用例4: 性能分析
        console.log('\n🔸 测试用例4: 性能分析');
        const performanceReport = await qaSystem.analyzePerformance(testProjectPath, 'development');
        console.log(`✅ 性能分析完成: 环境=${performanceReport.environment}`);
        console.log(`⚡ 响应时间: ${performanceReport.metrics.responseTime.toFixed(1)}ms`);
        console.log(`🎯 吞吐量: ${performanceReport.metrics.throughput.toFixed(0)} req/s`);
        console.log(`💾 内存使用: ${performanceReport.metrics.memoryUsage.toFixed(1)}%`);
        console.log(`🚨 瓶颈数量: ${performanceReport.bottlenecks.length}个`);

        // 显示性能建议
        if (performanceReport.recommendations.length > 0) {
            console.log('\n⚡ 性能优化建议:');
            performanceReport.recommendations.slice(0, 2).forEach(rec => {
                console.log(`  - ${rec.title}: ${rec.description} (预期提升: ${rec.estimatedGain}%)`);
            });
        }

        // 测试用例5: 安全扫描
        console.log('\n🔸 测试用例5: 安全扫描');
        const securityScan = await qaSystem.scanSecurity(testProjectPath, ['dependencies', 'code']);
        console.log(`✅ 安全扫描完成: 风险评分=${securityScan.riskScore}`);
        console.log(`🔒 发现漏洞: ${securityScan.vulnerabilities.length}个`);
        
        // 按严重程度分类漏洞
        const vulnBySeverity = securityScan.vulnerabilities.reduce((acc, vuln) => {
            acc[vuln.severity] = (acc[vuln.severity] || 0) + 1;
            return acc;
        }, {});
        console.log(`🔍 漏洞分布: ${JSON.stringify(vulnBySeverity)}`);

        // 显示高危漏洞
        const criticalVulns = securityScan.vulnerabilities.filter(v => 
            v.severity === 'critical' || v.severity === 'high'
        );
        if (criticalVulns.length > 0) {
            console.log('\n🚨 高危漏洞:');
            criticalVulns.slice(0, 2).forEach(vuln => {
                console.log(`  - ${vuln.title} (${vuln.severity}): ${vuln.solution}`);
            });
        }

        // 测试用例6: 质量门控
        console.log('\n🔸 测试用例6: 质量门控评估');
        const qualityGates = await qaSystem.evaluateQualityGates(testProjectPath);
        console.log(`✅ 评估质量门控: ${qualityGates.length}个`);
        
        for (const gate of qualityGates) {
            const status = gate.status === 'passed' ? '✅' : gate.status === 'failed' ? '❌' : '⚠️';
            console.log(`  ${status} ${gate.name}: ${gate.status}`);
            
            if (gate.status === 'failed') {
                const failedConditions = gate.conditions.filter(c => c.status === 'failed');
                failedConditions.forEach(condition => {
                    console.log(`    - ${condition.errorMessage}`);
                });
            }
        }

        // 测试用例7: 合规性检查
        console.log('\n🔸 测试用例7: 合规性检查');
        const complianceStatus = await qaSystem.checkCompliance('CMMI', testProjectPath);
        console.log(`✅ CMMI合规性: ${complianceStatus.level}, 评分=${complianceStatus.score}`);

        // 测试用例8: 配置管理
        console.log('\n🔸 测试用例8: 配置管理');
        const originalConfig = qaSystem.getConfig();
        console.log(`⚙️ 当前阈值: 覆盖率=${originalConfig.thresholds.testCoverage}%, 安全=${originalConfig.thresholds.security}%`);
        
        // 更新阈值
        await qaSystem.setQualityThresholds({
            testCoverage: 85,
            security: 95,
            codeQuality: 80,
            maintainability: 75,
            reliability: 85,
            performance: 85,
            overallQuality: 80
        });
        
        const updatedConfig = qaSystem.getConfig();
        console.log(`⚙️ 更新阈值: 覆盖率=${updatedConfig.thresholds.testCoverage}%, 安全=${updatedConfig.thresholds.security}%`);

        // 测试用例9: 仪表板和报告
        console.log('\n🔸 测试用例9: 仪表板和报告');
        const dashboard = await qaSystem.getDashboard(testProjectPath);
        console.log(`📈 生成仪表板: 代码行数=${dashboard.overview.linesOfCode}`);
        console.log(`📊 技术债务: ${dashboard.overview.technicalDebt}小时`);
        console.log(`🏆 可维护性: ${dashboard.overview.maintainabilityRating}级`);
        console.log(`🛡️ 可靠性: ${dashboard.overview.reliabilityRating}级`);

        // 生成报告工件
        const reportArtifact = await qaSystem.generateReport(analysisResult.reportId, 'json');
        console.log(`📄 生成报告: ${reportArtifact.format}格式, 大小=${reportArtifact.size}字节`);

        // 测试用例10: 趋势分析
        console.log('\n🔸 测试用例10: 趋势分析');
        
        // 模拟运行多次分析以生成趋势数据
        for (let i = 0; i < 3; i++) {
            await qaSystem.analyzeQuality({
                projectPath: testProjectPath,
                language: 'javascript'
            });
        }
        
        const trends = await qaSystem.getTrends(testProjectPath, 'daily');
        console.log(`📈 趋势数据点: ${trends.length}个`);

        // 测试用例11: 通知系统
        console.log('\n🔸 测试用例11: 通知系统');
        await qaSystem.sendNotification('quality_gate_failed', {
            projectPath: testProjectPath,
            failedGates: ['coverage', 'security'],
            reportId: analysisResult.reportId
        });
        console.log('📢 测试通知发送完成');

        // 测试用例12: 健康状态检查
        console.log('\n🔸 测试用例12: 系统健康状态');
        const healthStatus = await qaSystem.getHealthStatus();
        console.log(`💚 系统状态: ${healthStatus.status}`);
        console.log(`⏱️ 运行时间: ${healthStatus.uptime.toFixed(2)}秒`);
        console.log(`📊 活跃分析: ${healthStatus.activeAnalyses}个`);

        // 清理测试项目
        cleanupTestProject(testProjectPath);

        console.log('\n✅ 质量保证系统测试完成');

        // 输出测试总结
        console.log('\n📊 测试总结:');
        console.log(`- ✅ 质量分析: 整体评分 ${analysisResult.report.metrics.overall.toFixed(1)}/100`);
        console.log(`- ✅ 代码质量: 发现 ${codeQualityReport.issues.length} 个问题`);
        console.log(`- ✅ 测试覆盖: ${coverage.lines}% 代码覆盖率`);
        console.log(`- ✅ 性能分析: ${performanceReport.bottlenecks.length} 个瓶颈`);
        console.log(`- ✅ 安全扫描: ${securityScan.vulnerabilities.length} 个漏洞`);
        console.log(`- ✅ 质量门控: ${qualityGates.filter(g => g.status === 'passed').length}/${qualityGates.length} 通过`);
        console.log(`- ✅ 系统健康: ${healthStatus.status}`);

    } catch (error) {
        console.error('❌ 质量保证系统测试失败:', error);
        throw error;
    }
}

// 创建测试项目
function createTestProject() {
    const testDir = '/tmp/qa-test-project';
    
    if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
        
        // 创建package.json
        const packageJson = {
            name: 'qa-test-project',
            version: '1.0.0',
            description: 'Test project for quality assurance',
            main: 'index.js',
            scripts: {
                test: 'jest',
                start: 'node index.js'
            },
            dependencies: {
                'express': '^4.18.0',
                'lodash': '^4.17.20' // 故意使用有漏洞的版本
            },
            devDependencies: {
                'jest': '^29.0.0'
            }
        };
        
        fs.writeFileSync(
            path.join(testDir, 'package.json'), 
            JSON.stringify(packageJson, null, 2)
        );
        
        // 创建源代码文件
        const sourceCode = `
// index.js - 主要业务逻辑
const express = require('express');
const lodash = require('lodash');

const app = express();

// 这个函数复杂度过高 (测试代码质量检查)
function calculateTotal(items) {
    let total = 0;
    for (let i = 0; i < items.length; i++) {
        if (items[i].active) {
            if (items[i].discount) {
                if (items[i].discount > 0.5) {
                    total += items[i].price * 0.5;
                } else {
                    total += items[i].price * (1 - items[i].discount);
                }
            } else {
                total += items[i].price;
            }
        }
    }
    return total;
}

// 潜在的SQL注入漏洞 (测试安全扫描)
function getUserById(userId) {
    const query = "SELECT * FROM users WHERE id = " + userId;
    return query; // 这里只是返回查询字符串用于测试
}

app.get('/api/users/:id', (req, res) => {
    const query = getUserById(req.params.id);
    res.json({ query });
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});

module.exports = { calculateTotal, getUserById };
        `;
        
        fs.writeFileSync(path.join(testDir, 'index.js'), sourceCode.trim());
        
        // 创建测试文件
        const testCode = `
// __tests__/index.test.js
const { calculateTotal, getUserById } = require('../index');

describe('calculateTotal', () => {
    test('should calculate total for active items', () => {
        const items = [
            { price: 100, active: true },
            { price: 50, active: false },
            { price: 200, active: true, discount: 0.1 }
        ];
        const result = calculateTotal(items);
        expect(result).toBe(280); // 100 + 180
    });
    
    test('should handle empty array', () => {
        expect(calculateTotal([])).toBe(0);
    });
});

describe('getUserById', () => {
    test('should return query string', () => {
        const result = getUserById('123');
        expect(result).toContain('123');
    });
});
        `;
        
        const testDir_ = path.join(testDir, '__tests__');
        fs.mkdirSync(testDir_, { recursive: true });
        fs.writeFileSync(path.join(testDir_, 'index.test.js'), testCode.trim());
        
        console.log(`📁 创建测试项目: ${testDir}`);
    }
    
    return testDir;
}

// 清理测试项目
function cleanupTestProject(projectPath) {
    try {
        if (fs.existsSync(projectPath)) {
            fs.rmSync(projectPath, { recursive: true, force: true });
            console.log(`🗑️ 清理测试项目: ${projectPath}`);
        }
    } catch (error) {
        console.warn(`⚠️ 清理测试项目失败: ${error.message}`);
    }
}

// 保存测试结果
function saveTestResults(results) {
    const outputDir = path.join(process.cwd(), 'test-output', 'quality-assurance-test');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const resultsFile = path.join(outputDir, 'test-results.json');
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    console.log(`📁 测试结果已保存到: ${resultsFile}`);
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
    testQualityAssuranceSystem().catch(error => {
        console.error('测试失败:', error);
        process.exit(1);
    });
}

export { testQualityAssuranceSystem };
