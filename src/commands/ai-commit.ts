import simpleGit from 'simple-git';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { generateAICommitMessage } from '../utils/ai-service';

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

    // 调用AI生成提交信息
    console.log(chalk.cyan('🧠 正在调用AI生成提交信息...\n'));
    const commitMessage = await generateAICommitMessage(diff);

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
