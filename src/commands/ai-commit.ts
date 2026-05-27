import simpleGit from 'simple-git';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { generateAICommitMessage, AIServiceType } from '../utils/ai-service';

const git = simpleGit();

export async function aiCommitCommand(): Promise<void> {
  try {
    console.log(chalk.blue('🤖 AI辅助提交模式'));
    console.log(chalk.gray('正在分析代码变更...\n'));

    // 获取git状态
    const status = await git.status();
    
    if (status.files.length === 0) {
      console.log(chalk.yellow('⚠️  没有检测到文件变更'));
      return;
    }

    console.log(chalk.green(`✓ 检测到 ${status.files.length} 个文件变更\n`));

    // 获取未暂存的变更
    const diff = await git.diff();
    
    if (!diff || diff.trim() === '') {
      console.log(chalk.yellow('⚠️  没有未暂存的变更'));
      return;
    }

    // 智能检测可用的 AI 服务
    const githubToken = process.env.GITHUB_TOKEN;
    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    
    // 检查 Ollama（通过检测服务是否运行）
    let ollamaAvailable = false;
    try {
      const axios = require('axios');
      const response = await axios.get('http://localhost:11434/api/tags', { timeout: 2000 });
      if (response.status === 200) {
        ollamaAvailable = true;
      }
    } catch (e) {
      ollamaAvailable = false;
    }

    // 构建可用服务列表
    const availableServices: Array<{ name: string; value: AIServiceType }> = [];
    
    if (githubToken) {
      availableServices.push({ name: '🚀 GitHub Models (免费，推荐)', value: 'github' });
    }
    
    if (deepseekKey) {
      availableServices.push({ name: '💰 DeepSeek API (付费)', value: 'deepseek' });
    }
    
    if (ollamaAvailable) {
      availableServices.push({ name: '🏠 Ollama 本地 (免费)', value: 'ollama' });
    }

    // 没有可用服务
    if (availableServices.length === 0) {
      console.error(chalk.red('❌ 未检测到可用的 AI 服务'));
      console.log(chalk.yellow('\n💡 请配置以下任一服务：'));
      console.log(chalk.cyan('\n方式 1: GitHub Models（推荐，免费）'));
      console.log(chalk.gray('   $env:GITHUB_TOKEN="ghp_your-token"'));
      console.log(chalk.cyan('\n方式 2: DeepSeek API（付费）'));
      console.log(chalk.gray('   $env:DEEPSEEK_API_KEY="sk_your-key"'));
      console.log(chalk.cyan('\n方式 3: Ollama（本地免费）'));
      console.log(chalk.gray('   1. 安装: https://ollama.ai'));
      console.log(chalk.gray('   2. 启动: ollama serve'));
      console.log(chalk.gray('   3. 下载模型: ollama pull llama2'));
      return;
    }

    // 智能选择：只有一个服务时直接使用，多个时才让用户选择
    let selectedService: AIServiceType;
    
    if (availableServices.length === 1) {
      selectedService = availableServices[0].value;
      console.log(chalk.cyan(`🤖 自动选择: ${availableServices[0].name}`));
    } else {
      const { aiService } = await inquirer.prompt([
        {
          type: 'list',
          name: 'aiService',
          message: '检测到多个 AI 服务，请选择:',
          choices: availableServices
        }
      ]);
      selectedService = aiService;
    }

    // 调用AI生成提交信息
    console.log(chalk.cyan('\n🧠 正在调用AI生成提交信息...\n'));
    const commitMessage = await generateAICommitMessage(diff, selectedService);

    if (!commitMessage) {
      console.log(chalk.red('❌ AI生成提交信息失败'));
      return;
    }

    console.log(chalk.green('✓ AI生成的提交信息:'));
    console.log(chalk.yellow(`\n${commitMessage}\n`));

    // 询问用户是否使用此提交信息
    const { useMessage } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'useMessage',
        message: '是否使用此提交信息？',
        default: true
      }
    ]);

    if (!useMessage) {
      // 允许用户自定义提交信息
      const { customMessage } = await inquirer.prompt([
        {
          type: 'input',
          name: 'customMessage',
          message: '请输入自定义提交信息:',
          validate: (input: string) => input.trim() !== '' || '提交信息不能为空'
        }
      ]);

      // 添加所有变更
      await git.add('.');
      
      // 使用自定义信息提交
      await git.commit(customMessage);
      console.log(chalk.green('✓ 代码已成功提交'));
      return;
    }

    // 添加所有变更
    await git.add('.');
    
    // 使用AI生成的信息提交
    await git.commit(commitMessage);
    console.log(chalk.green('✓ 代码已成功提交'));

  } catch (error: any) {
    console.error(chalk.red('❌ 提交失败:'), error.message);
    process.exit(1);
  }
}
