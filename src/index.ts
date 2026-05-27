#!/usr/bin/env node

import { Command } from 'commander';
import { aiCommitCommand } from './commands/ai-commit';
import { commitCommand } from './commands/commit';
import { tagCommand } from './commands/tag';
import { mergeTestCommand } from './commands/merge-test';
import { gitignoreCommand } from './commands/gitignore';
import { pushCommand } from './commands/push';

const program = new Command();

program
  .name('git-ultra')
  .description('Git workflow enhancement tool with AI-powered commit messages')
  .version('1.0.0');

// AI辅助提交命令（默认）
program
  .command('commit')
  .alias('c')
  .description('提交代码，默认使用AI辅助生成提交信息')
  .action(aiCommitCommand);

// AI提交命令（别名）
program
  .command('ai-commit')
  .alias('aic')
  .description('使用 AI 辅助生成提交信息')
  .action(aiCommitCommand);

// 规范化提交
program
  .command('conventional-commit')
  .alias('cc')
  .description('使用 commitizen 规范化提交代码')
  .action(commitCommand);

// 创建标签
program
  .command('tag')
  .description('创建新的版本标签')
  .action(tagCommand);

// 合并到test分支
program
  .command('merge-test')
  .description('将当前分支合并到test分支并推送')
  .action(mergeTestCommand);

// 生成.gitignore
program
  .command('gitignore')
  .alias('gi')
  .description('为当前项目生成 .gitignore 文件')
  .action(gitignoreCommand);

// 智能Push命令
program
  .command('push')
  .alias('p')
  .description('检查文件变更并智能提交（表格展示+AI/常规选择）')
  .action(pushCommand);

program.parse();
