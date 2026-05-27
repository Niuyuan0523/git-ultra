import simpleGit from 'simple-git';
import chalk from 'chalk';
import inquirer from 'inquirer';
import dayjs from 'dayjs';

const git = simpleGit();

export async function tagCommand(): Promise<void> {
  try {
    console.log(chalk.blue('🏷️  创建版本标签'));

    // 获取当前版本标签
    const tags = await git.tags();
    const versionTags = tags.all
      .filter(tag => tag.startsWith('v'))
      .sort((a, b) => {
        const versionA = a.substring(1).split('.').map(Number);
        const versionB = b.substring(1).split('.').map(Number);
        
        for (let i = 0; i < 3; i++) {
          if (versionA[i] !== versionB[i]) {
            return versionB[i] - versionA[i];
          }
        }
        return 0;
      });

    const latestTag = versionTags[0] || 'v0.0.0';
    console.log(chalk.gray(`当前最新标签: ${latestTag}`));

    // 解析版本号
    const versionMatch = latestTag.match(/^v(\d+)\.(\d+)\.(\d+)$/);
    if (!versionMatch) {
      console.error(chalk.red('❌ 版本号格式错误'));
      return;
    }

    const [, major, minor, patch] = versionMatch.map(Number);

    // 选择版本更新类型
    const { updateType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'updateType',
        message: '选择版本更新类型:',
        choices: [
          { name: `补丁版本 (v${major}.${minor}.${patch + 1})`, value: 'patch' },
          { name: `次要版本 (v${major}.${minor + 1}.0)`, value: 'minor' },
          { name: `主要版本 (v${major + 1}.0.0)`, value: 'major' },
          { name: '自定义版本', value: 'custom' }
        ]
      }
    ]);

    let newVersion: string;

    if (updateType === 'custom') {
      const { customVersion } = await inquirer.prompt([
        {
          type: 'input',
          name: 'customVersion',
          message: '输入自定义版本号 (例如: v1.2.3):',
          validate: (input: string) => {
            if (/^v\d+\.\d+\.\d+$/.test(input)) {
              return true;
            }
            return '版本号格式错误，应为: v1.2.3';
          }
        }
      ]);
      newVersion = customVersion;
    } else {
      const [newMajor, newMinor, newPatch] = 
        updateType === 'major' 
          ? [major + 1, 0, 0]
          : updateType === 'minor'
          ? [major, minor + 1, 0]
          : [major, minor, patch + 1];
      
      newVersion = `v${newMajor}.${newMinor}.${newPatch}`;
    }

    console.log(chalk.green(`\n新版本标签: ${newVersion}`));

    // 输入标签说明
    const { message } = await inquirer.prompt([
      {
        type: 'input',
        name: 'message',
        message: '输入标签说明:',
        default: `Release ${newVersion}`
      }
    ]);

    // 确认创建
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `确认创建标签 ${newVersion}?`,
        default: true
      }
    ]);

    if (confirm) {
      // 创建标签
      await git.addAnnotatedTag(newVersion, message);
      console.log(chalk.green(`✓ 标签 ${newVersion} 创建成功`));

      // 询问是否推送
      const { pushTag } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'pushTag',
          message: '是否立即推送到远程?',
          default: true
        }
      ]);

      if (pushTag) {
        await git.pushTags('origin');
        console.log(chalk.green('✓ 标签已推送到远程'));
      }
    }

  } catch (error: any) {
    console.error(chalk.red('❌ 创建标签失败:'), error.message);
    process.exit(1);
  }
}
