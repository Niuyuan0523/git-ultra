import axios from 'axios';
import chalk from 'chalk';

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface OllamaResponse {
  message: {
    content: string;
  };
}

interface GitHubModelsResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export type AIServiceType = 'deepseek' | 'ollama' | 'github';

/**
 * 调用 AI 生成提交信息
 * @param diff Git差异内容
 * @param serviceType AI 服务类型
 * @returns AI生成的提交信息
 */
export async function generateAICommitMessage(
  diff: string,
  serviceType: AIServiceType = 'github'
): Promise<string | null> {
  if (serviceType === 'ollama') {
    return generateWithOllama(diff);
  } else if (serviceType === 'github') {
    return generateWithGitHub(diff);
  } else {
    return generateWithDeepSeek(diff);
  }
}

/**
 * 使用 DeepSeek AI 生成提交信息
 */
async function generateWithDeepSeek(diff: string): Promise<string | null> {
  try {
    // 从环境变量获取API Key
    const apiKey = process.env.DEEPSEEK_API_KEY;
    
    if (!apiKey) {
      console.error(chalk.red('⚠️  未设置 DEEPSEEK_API_KEY 环境变量'));
      console.log(chalk.yellow('请先设置: export DEEPSEEK_API_KEY=your-api-key'));
      return null;
    }

    const systemPrompt = `你是一个专业的Git提交信息生成助手。请根据代码变更生成符合以下规范的提交信息：

1. 使用 Conventional Commits 规范
2. 格式: <type>(<scope>): <subject>
3. type 包括: feat, fix, docs, style, refactor, test, chore
4. subject 简明扼要，不超过50个字符
5. 如果有必要，添加详细的body说明
6. 使用中文

请只返回提交信息，不要添加任何其他内容。`;

    const userPrompt = `请分析以下代码变更，并生成合适的提交信息：

\`\`\`diff
${diff.substring(0, 3000)}
\`\`\``;

    const response = await axios.post<DeepSeekResponse>(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 200
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 30000
      }
    );

    if (response.data.choices && response.data.choices.length > 0) {
      let commitMessage = response.data.choices[0].message.content.trim();
      
      // 移除可能的代码块标记
      commitMessage = commitMessage.replace(/```[\s\S]*?```/g, '').trim();
      commitMessage = commitMessage.replace(/^`+|`+$/g, '').trim();
      
      return commitMessage;
    }

    return null;
  } catch (error: any) {
    console.error(chalk.red('❌ AI调用失败:'));
    
    if (error.response) {
      console.error(chalk.red(`状态码: ${error.response.status}`));
      console.error(chalk.red(`错误信息: ${error.response.data?.error?.message || '未知错误'}`));
    } else if (error.request) {
      console.error(chalk.red('网络请求失败，请检查网络连接'));
    } else {
      console.error(chalk.red(`错误: ${error.message}`));
    }
    
    return null;
  }
}

/**
 * 使用 Ollama 本地 AI 生成提交信息（免费）
 */
async function generateWithOllama(diff: string): Promise<string | null> {
  try {
    console.log(chalk.cyan('📡 使用本地 Ollama AI 服务...'));

    const systemPrompt = `你是一个专业的Git提交信息生成助手。请根据代码变更生成符合以下规范的提交信息：

1. 使用 Conventional Commits 规范
2. 格式: <type>(<scope>): <subject>
3. type 包括: feat, fix, docs, style, refactor, test, chore
4. subject 简明扼要，不超过50个字符
5. 如果有必要，添加详细的body说明
6. 使用中文

请只返回提交信息，不要添加任何其他内容。`;

    const userPrompt = `请分析以下代码变更，并生成合适的提交信息：

\`\`\`diff
${diff.substring(0, 3000)}
\`\`\``;

    const response = await axios.post<OllamaResponse>(
      'http://localhost:11434/api/chat',
      {
        model: 'llama2',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: false
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    if (response.data.message && response.data.message.content) {
      let commitMessage = response.data.message.content.trim();
      
      // 移除可能的代码块标记
      commitMessage = commitMessage.replace(/```[\s\S]*?```/g, '').trim();
      commitMessage = commitMessage.replace(/^`+|`+$/g, '').trim();
      
      return commitMessage;
    }

    return null;
  } catch (error: any) {
    console.error(chalk.red('❌ Ollama调用失败:'));
    console.error(chalk.yellow('💡 请确保已安装并启动 Ollama'));
    console.error(chalk.yellow('   安装: https://ollama.ai'));
    console.error(chalk.yellow('   启动: ollama serve'));
    console.error(chalk.yellow('   下载模型: ollama pull llama2'));
    
    if (error.code === 'ECONNREFUSED') {
      console.error(chalk.red('无法连接到 Ollama 服务，请确保已启动'));
    }
    
    return null;
  }
}

/**
 * 使用 GitHub Models 生成提交信息（免费）
 */
async function generateWithGitHub(diff: string): Promise<string | null> {
  try {
    console.log(chalk.cyan('🚀 使用 GitHub Models AI 服务（免费）...'));

    // 从环境变量获取 GitHub Token
    const token = process.env.GITHUB_TOKEN;
    
    if (!token) {
      console.error(chalk.red('⚠️  未设置 GITHUB_TOKEN 环境变量'));
      console.log(chalk.yellow('请先设置: export GITHUB_TOKEN=your-github-token'));
      console.log(chalk.yellow('获取方式: https://github.com/settings/tokens'));
      return null;
    }

    const systemPrompt = `你是一个专业的Git提交信息生成助手。请根据代码变更生成符合以下规范的提交信息：

1. 使用 Conventional Commits 规范
2. 格式: <type>(<scope>): <subject>
3. type 包括: feat, fix, docs, style, refactor, test, chore
4. subject 简明扼要，不超过50个字符
5. 如果有必要，添加详细的body说明
6. 使用中文

请只返回提交信息，不要添加任何其他内容。`;

    const userPrompt = `请分析以下代码变更，并生成合适的提交信息：

\`\`\`diff
${diff.substring(0, 3000)}
\`\`\``;

    // 使用 GPT-4o-mini（免费额度）
    const response = await axios.post<GitHubModelsResponse>(
      'https://models.inference.ai.azure.com/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 200
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-ms-use-account-scopes': 'true'
        },
        timeout: 30000
      }
    );

    if (response.data.choices && response.data.choices.length > 0) {
      let commitMessage = response.data.choices[0].message.content.trim();
      
      // 移除可能的代码块标记
      commitMessage = commitMessage.replace(/```[\s\S]*?```/g, '').trim();
      commitMessage = commitMessage.replace(/^`+|`+$/g, '').trim();
      
      console.log(chalk.green('✓ GitHub Models 调用成功'));
      return commitMessage;
    }

    return null;
  } catch (error: any) {
    console.error(chalk.red('❌ GitHub Models 调用失败:'));
    
    if (error.response) {
      console.error(chalk.red(`状态码: ${error.response.status}`));
      console.error(chalk.red(`错误信息: ${error.response.data?.error?.message || '未知错误'}`));
      
      if (error.response.status === 401) {
        console.error(chalk.yellow('💡 请检查 GITHUB_TOKEN 是否正确'));
      }
    } else if (error.request) {
      console.error(chalk.red('网络请求失败，请检查网络连接'));
    } else {
      console.error(chalk.red(`错误: ${error.message}`));
    }
    
    return null;
  }
}
