import simpleGit from 'simple-git';
import chalk from 'chalk';
import inquirer from 'inquirer';

const git = simpleGit();

export async function commitCommand(): Promise<void> {
  try {
    console.log(chalk.blue('📝 规范化提交模式'));
    console.log(chalk.gray('使用 Conventional Commits 规范\n'));

    // 获取git状态
    const status = await git.status();
    
    if (status.files.length === 0) {
      console.log(chalk.yellow('⚠️  没有检测到文件变更'));
      return;
    }

    // 选择提交类型
    const { commitType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'commitType',
        message: '选择提交类型:',
        choices: [
          { name: '✨ feat - 新功能', value: 'feat' },
          { name: '🐛 fix - 修复bug', value: 'fix' },
          { name: '📚 docs - 文档变更', value: 'docs' },
          { name: '🎨 style - 代码格式', value: 'style' },
          { name: '♻️  refactor - 代码重构', value: 'refactor' },
          { name: '🧪 test - 测试相关', value: 'test' },
          { name: '🔧 chore - 构建/工具', value: 'chore' },
          { name: '⚡️ perf - 性能优化', value: 'perf' }
        ]
      }
    ]);

    // 输入影响范围
    const { scope } = await inquirer.prompt([
      {
        type: 'input',
        name: 'scope',
        message: '输入影响范围 (可选):',
        default: ''
      }
    ]);

    // 输入提交主题
    const { subject } = await inquirer.prompt([
      {
        type: 'input',
        name: 'subject',
        message: '输入简短描述 (不超过50字符):',
        validate: (input: string) => {
          if (input.trim().length === 0) {
            return '描述不能为空';
          }
          if (input.length > 50) {
            return '描述不能超过50个字符';
          }
          return true;
        }
      }
    ]);

    // 输入详细描述
    const { body } = await inquirer.prompt([
      {
        type: 'input',
        name: 'body',
        message: '输入详细描述 (可选):',
        default: ''
      }
    ]);

    // 构建提交信息
    const scopePart = scope ? `(${scope})` : '';
    let commitMessage = `${commitType}${scopePart}: ${subject}`;
    
    if (body) {
      commitMessage += `\n\n${body}`;
    }

    console.log(chalk.green('\n✓ 提交信息:'));
    console.log(chalk.yellow(`\n${commitMessage}\n`));

    // 确认提交
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: '确认提交?',
        default: true
      }
    ]);

    if (confirm) {
      await git.add('.');
      await git.commit(commitMessage);
      console.log(chalk.green('✓ 代码已成功提交'));
    }

  } catch (error: any) {
    console.error(chalk.red('❌ 提交失败:'), error.message);
    process.exit(1);
  }
}
