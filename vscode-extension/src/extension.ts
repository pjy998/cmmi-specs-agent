import * as vscode from 'vscode';

/**
 * 最简单的 Chat + 大模型验证
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('🚀 开始验证 Chat + 大模型功能');

  // 创建 Chat 参与者
  const participant = vscode.chat.createChatParticipant('cmmi.test', async (request, context, stream, token) => {
    console.log('📨 收到用户请求:', request.prompt);
    
    stream.markdown('🤖 正在调用大模型...\n\n');
    
    try {
      // 尝试调用 GitHub Copilot 模型
      const models = await vscode.lm.selectChatModels({ vendor: 'copilot' });
      
      if (models.length === 0) {
        stream.markdown('❌ 没有可用的 Copilot 模型\n');
        stream.markdown('💡 请确保已安装并登录 GitHub Copilot\n');
        return;
      }
      
      console.log('✅ 找到模型:', models[0].name);
      const model = models[0];
      
      // 发送请求到大模型
      const response = await model.sendRequest([
        vscode.LanguageModelChatMessage.User(`请简短回答：${request.prompt}`)
      ], {}, token);
      
      // 流式输出响应
      stream.markdown('### 🧠 大模型回复：\n\n');
      for await (const fragment of response.text) {
        stream.markdown(fragment);
      }
      stream.markdown('\n\n---\n✅ **这是真实的大模型响应**');
      
    } catch (error) {
      console.error('❌ 大模型调用失败:', error);
      stream.markdown(`❌ 大模型调用失败: ${error}\n\n`);
      
      // 降级到硬编码响应
      stream.markdown('### 📝 本地分析（降级）：\n\n');
      stream.markdown(`您的问题是: "${request.prompt}"\n\n`);
      stream.markdown('这是硬编码的回复，说明大模型不可用。\n');
      stream.markdown('\n---\n⚠️ **这是硬编码响应**');
    }
  });
  
  participant.iconPath = new vscode.ThemeIcon('robot');
  context.subscriptions.push(participant);
  
  console.log('✅ Chat 参与者 @cmmi.test 已注册');
}

export function deactivate() {
  console.log('👋 扩展已停用');
}
