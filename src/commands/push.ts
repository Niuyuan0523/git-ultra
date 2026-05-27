import simpleGit from 'simple-git';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { table } from 'table';
import { generateAICommitMessage } from '../utils/ai-service';

const git = simpleGit();

interface FileChange {
  path: string;
  index: string;
  working_dir: string;
}

interface ChangeStats {
  totalFiles: number;
  totalInsertions: number;
  totalDeletions: number;
  modifiedFiles: number;
  addedFiles: number;
  deletedFiles: number;
}

export async function pushCommand(): Promise<void> {
  try {
    console.log(chalk.blue('🚀 Git Ultra Push 命令'));
    console.log(chalk.gray('检查文件变更并智能提交\n'));

    // 获取当前分支
    const status = await git.status();
    const currentBranch = status.current;

    if (!currentBranch) {
      console.log(chalk.red('❌ 无法获取当前分支信息'));
      return;
    }

    console.log(chalk.cyan(`📍 当前分支: ${chalk.bold(currentBranch)}`));
    console.log('');

    // 检查文件变更
    if (status.files.length === 0) {
      console.log(chalk.yellow('⚠️  没有检测到文件变更'));
      return;
    }

    // 获取详细的差异统计
    const diffSummary = await git.diffSummary(['--cached']);
    const unstagedDiff = await git.diffSummary();

    // 合并暂存和未暂存的变更统计
    const allFiles = status.files;
    
    // 获取每个文件的详细统计
    const fileChanges: FileChange[] = allFiles.map(file => ({
      path: file.path,
      index: file.index,
      working_dir: file.working_dir,
    }));

    // 获取插入和删除统计
    let totalInsertions = 0;
    let totalDeletions = 0;

    try {
      const diffStat = await git.diff(['--stat']);
      const statMatch = diffStat.match(/(\d+) file[s]? changed(?:, (\d+) insertion[s]?\(\+\))?(?:, (\d+) deletion[s]?\(-\))?/);
      if (statMatch) {
        totalInsertions = parseInt(statMatch[2] || '0');
        totalDeletions = parseInt(statMatch[3] || '0');
      }
    } catch (e) {
      // 忽略统计解析错误
    }

    // 分类文件
    const modifiedFiles = allFiles.filter(f => f.working_dir === 'M' || f.index === 'M').length;
    const addedFiles = allFiles.filter(f => f.working_dir === '??' || f.index === 'A').length;
    const deletedFiles = allFiles.filter(f => f.working_dir === 'D' || f.index === 'D').length;

    const stats: ChangeStats = {
      totalFiles: allFiles.length,
      totalInsertions,
      totalDeletions,
      modifiedFiles,
      addedFiles,
      deletedFiles,
    };

    // 显示文件变更表格
    console.log(chalk.yellow('📊 文件变更详情:'));
    console.log('');

    // 构建表格数据
    const tableData: string[][] = [
      [chalk.bold('📝 文件改动'), chalk.bold('状态'), chalk.bold('改动统计')],
    ];

    // 每个文件一行
    allFiles.forEach(file => {
      let statusText = '';
      let statusColor: (text: string) => string;
      let fileStats = '';

      if (file.working_dir === 'M' || file.index === 'M') {
        statusText = '已更新';
        statusColor = chalk.yellow;
        fileStats = chalk.gray('-');
      } else if (file.working_dir === '??') {
        statusText = '已新增';
        statusColor = chalk.green;
        fileStats = chalk.green('新增');
      } else if (file.working_dir === 'D' || file.index === 'D') {
        statusText = '已删除';
        statusColor = chalk.red;
        fileStats = chalk.red('删除');
      } else if (file.index === 'A') {
        statusText = '已新增';
        statusColor = chalk.green;
        fileStats = chalk.green('新增');
      } else {
        statusText = '已修改';
        statusColor = chalk.gray;
        fileStats = chalk.gray('-');
      }

      tableData.push([
        file.path,
        statusColor(statusText),
        fileStats,
      ]);
    });

    // 总计改动单独一行
    tableData.push([
      chalk.bold('总计改动'),
      chalk.bold('📈'),
      chalk.bold(`${chalk.green(`+${stats.totalInsertions}`)} ${chalk.red(`-${stats.totalDeletions}`)}`),
    ]);

    // 核对当前分支单独一行
    tableData.push([
      chalk.bold('请核对当前分支'),
      chalk.bold('📌'),
      chalk.bold.cyan(currentBranch),
    ]);

    const tableOutput = table(tableData, {
      border: {
        topBody: '─',
        topJoin: '┬',
        topLeft: '┌',
        topRight: '┐',
        bottomBody: '─',
        bottomJoin: '┴',
        bottomLeft: '└',
        bottomRight: '┘',
        bodyLeft: '│',
        bodyRight: '│',
        bodyJoin: '│',
        joinBody: '─',
        joinLeft: '├',
        joinRight: '┤',
        joinJoin: '┼',
      },
      columns: {
        0: { alignment: 'left', width: 40 },
        1: { alignment: 'left' },
        2: { alignment: 'left' },
      },
    });

    console.log(tableOutput);


    // 确认是否继续
    const { confirmContinue } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmContinue',
        message: `确认提交 ${stats.totalFiles} 个文件的变更？`,
        default: true,
      },
    ]);

    if (!confirmContinue) {
      console.log(chalk.yellow('操作已取消'));
      return;
    }

    // 选择提交方式
    const { submitType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'submitType',
        message: '选择提交方式:',
        choices: [
          { name: '🤖 AI 辅助提交（推荐）', value: 'ai' },
          { name: '📝 常规提交', value: 'conventional' },
        ],
      },
    ]);

    if (submitType === 'ai') {
      // AI 辅助提交
      await handleAICommit(stats);
    } else {
      // 常规提交
      await handleConventionalCommit();
    }

  } catch (error: any) {
    console.error(chalk.red('❌ 操作失败:'), error.message);
    process.exit(1);
  }
}

async function handleAICommit(stats: ChangeStats): Promise<void> {
  console.log(chalk.cyan('\n🧠 正在调用 AI 分析代码变更...'));

  // 获取差异内容
  const diff = await git.diff();

  if (!diff || diff.trim() === '') {
    console.log(chalk.yellow('⚠️  没有可用的差异内容'));
    return;
  }

  console.log(chalk.gray('AI 正在分析中，请稍候...\n'));

  // 调用 AI 生成提交信息
  const commitMessage = await generateAICommitMessage(diff);

  if (!commitMessage) {
    console.log(chalk.red('❌ AI 生成提交信息失败'));
    console.log(chalk.yellow('是否切换到常规提交？'));
    
    const { switchToConventional } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'switchToConventional',
        message: '切换到常规提交？',
        default: true,
      },
    ]);

    if (switchToConventional) {
      await handleConventionalCommit();
    }
    return;
  }

  console.log(chalk.green('✓ AI 生成的提交信息:'));
  console.log(chalk.yellow(`\n${commitMessage}\n`));

  // 询问是否使用
  const { useMessage } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'useMessage',
      message: '是否使用此提交信息？',
      default: true,
    },
  ]);

  let finalMessage = commitMessage;

  if (!useMessage) {
    const { customMessage } = await inquirer.prompt([
      {
        type: 'input',
        name: 'customMessage',
        message: '请输入自定义提交信息:',
        validate: (input: string) => input.trim() !== '' || '提交信息不能为空',
      },
    ]);
    finalMessage = customMessage;
  }

  // 执行提交
  await git.add('.');
  await git.commit(finalMessage);
  console.log(chalk.green('\n✅ 代码已成功提交'));
}

async function handleConventionalCommit(): Promise<void> {
  console.log(chalk.cyan('\n📝 常规提交模式'));

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
        { name: '⚡️ perf - 性能优化', value: 'perf' },
      ],
    },
  ]);

  // 输入影响范围
  const { scope } = await inquirer.prompt([
    {
      type: 'input',
      name: 'scope',
      message: '输入影响范围 (可选):',
      default: '',
    },
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
      },
    },
  ]);

  // 输入详细描述
  const { body } = await inquirer.prompt([
    {
      type: 'input',
      name: 'body',
      message: '输入详细描述 (可选):',
      default: '',
    },
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
      default: true,
    },
  ]);

  if (confirm) {
    await git.add('.');
    await git.commit(commitMessage);
    console.log(chalk.green('✅ 代码已成功提交'));
  }
}
