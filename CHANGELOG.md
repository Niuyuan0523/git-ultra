# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.0.0] - 2026-05-27

### ✨ Features

* **🤖 AI 辅助提交**
  - 支持 GitHub Models（免费，GPT-4o-mini）
  - 支持 DeepSeek AI
  - 支持 Ollama 本地 AI
  - 自动生成符合 Conventional Commits 规范的提交信息

* **🚀 智能 Push 命令**
  - 表格展示文件变更详情
  - 统计插入/删除行数
  - 智能选择 AI/常规提交
  - 分支核对提示

* **📝 规范化提交**
  - 交互式提交类型选择
  - 支持 scope 和 body 输入
  - 8 种预设提交类型

* **📦 Gitignore 生成**
  - 7 种项目模板（Node/React/Vue/Python/Java/TS/通用）
  - 交互式生成

* **🏷️ 版本标签管理**
  - 智能版本号推算
  - 支持 patch/minor/major
  - 一键推送到远程

* **🔀 分支合并工具**
  - 简化合并到 test 分支流程
  - 冲突检测和指引

### 🛠 Technical

* TypeScript 实现
* 使用 Commander.js 构建 CLI
* 使用 simple-git 操作 Git
* 使用 table 库美化表格输出
* 配置 engines 要求 Node.js >= 16.0.0
