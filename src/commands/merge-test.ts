import simpleGit from 'simple-git';
import chalk from 'chalk';
import inquirer from 'inquirer';

const git = simpleGit();

export async function mergeTestCommand(): Promise<void> {
  try {
    console.log(chalk.blue('🔀 合并到test分支'));

    // 获取当前分支
    const status = await git.status();
    const currentBranch = status.current;

    if (!currentBranch) {
      console.log(chalk.red('❌ 无法获取当前分支信息'));
      return;
    }

    console.log(chalk.gray(`当前分支: ${currentBranch}`));

    if (currentBranch === 'test') {
      console.log(chalk.yellow('⚠️  已经在test分支上'));
      return;
    }

    // 确认合并
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `确认将 ${currentBranch} 合并到 test 分支?`,
        default: true
      }
    ]);

    if (!confirm) {
      console.log(chalk.yellow('操作已取消'));
      return;
    }

    // 提交当前分支的更改
    const hasChanges = status.files.length > 0;
    if (hasChanges) {
      console.log(chalk.yellow('\n检测到未提交的更改，正在提交...'));
      await git.add('.');
      await git.commit(`chore: auto commit before merge to test`);
      console.log(chalk.green('✓ 更改已提交'));
    }

    // 切换到test分支
    console.log(chalk.yellow('\n切换到test分支...'));
    await git.checkout('test');
    console.log(chalk.green('✓ 已切换到test分支'));

    // 合并当前分支
    console.log(chalk.yellow(`\n合并 ${currentBranch} 到 test...`));
    try {
      await git.merge([currentBranch]);
      console.log(chalk.green('✓ 合并成功'));
    } catch (error: any) {
      console.error(chalk.red('❌ 合并冲突'));
      console.log(chalk.yellow('请手动解决冲突后继续'));
      
      // 询问是否推送
      const { continueAfterConflict } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'continueAfterConflict',
          message: '解决冲突后是否继续推送到远程?',
          default: false
        }
      ]);

      if (continueAfterConflict) {
        console.log(chalk.yellow('请在解决冲突后手动运行: git push origin test'));
      }
      
      return;
    }

    // 推送到远程
    console.log(chalk.yellow('\n推送到远程test分支...'));
    await git.push('origin', 'test');
    console.log(chalk.green('✓ 推送成功'));

    // 询问是否切回原分支
    const { switchBack } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'switchBack',
        message: `是否切回 ${currentBranch} 分支?`,
        default: true
      }
    ]);

    if (switchBack && currentBranch) {
      await git.checkout(currentBranch);
      console.log(chalk.green(`✓ 已切回 ${currentBranch} 分支`));
    }

    console.log(chalk.green('\n✅ 合并流程完成'));

  } catch (error: any) {
    console.error(chalk.red('❌ 合并失败:'), error.message);
    process.exit(1);
  }
}
