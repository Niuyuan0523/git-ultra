# Git Ultra - 智能Git工作流增强工具

一个功能强大的Git命令行工具，集成了AI辅助提交信息生成功能，帮助开发团队提高代码提交效率和质量。

## ✨ 功能特性

- 🤖 **AI辅助提交** - 支持GitHub Models(免费)/DeepSeek AI/Ollama本地AI，自动生成符合规范的提交信息
- 📝 **规范化提交** - 支持Conventional Commits规范的交互式提交
- 🏷️ **版本标签管理** - 便捷的版本标签创建和推送
- 🔀 **分支合并** - 简化的分支合并到test分支工作流
- 📦 **Gitignore生成** - 为不同项目类型生成合适的 .gitignore 模板
- 🚀 **智能Push** - 表格展示文件变更、统计信息，智能选择AI/常规提交
- 🎨 **美观的CLI界面** - 彩色的终端输出和友好的交互体验

## 📦 安装

```bash
# 全局安装
npm install -g @niuyuan/git-ultra

# 或使用yarn
yarn global add @niuyuan/git-ultra
```

## 🔧 配置

### 配置 AI 服务（三选一）

#### 方式 1: GitHub Models（推荐，免费）

```bash
# 1. 创建 GitHub Token
# 访问: https://github.com/settings/tokens
# 生成新 token（不需要勾选权限）

# 2. 设置环境变量
export GITHUB_TOKEN=ghp_your-token-here

# 完成！自动使用 GPT-4o-mini（免费）
```

#### 方式 2: DeepSeek API（付费）

```bash
# Linux/macOS
export DEEPSEEK_API_KEY=your-api-key-here

# Windows PowerShell
$env:DEEPSEEK_API_KEY="your-api-key-here"

# Windows CMD
set DEEPSEEK_API_KEY=your-api-key-here
```

#### 方式 3: Ollama（本地免费）

```bash
# 1. 安装 Ollama
# https://ollama.ai

# 2. 启动服务
ollama serve

# 3. 下载模型
ollama pull llama2

# 完成！自动使用本地 AI
```

## 🚀 使用方法

### 基本命令

```bash
# AI辅助提交（推荐）
git-ultra commit
git-ultra c              # 别名

# AI辅助提交
git-ultra ai-commit
git-ultra aic            # 别名

# 规范化提交
git-ultra conventional-commit
git-ultra cc             # 别名

# 创建版本标签
git-ultra tag

# 合并到test分支
git-ultra merge-test

# 生成.gitignore
git-ultra gitignore
git-ultra gi             # 别名

# 智能Push（表格展示+AI/常规选择）
git-ultra push
git-ultra p              # 别名
```

### 工作流程示例

#### 1. AI辅助提交

```bash
# 修改代码后运行
git-ultra commit

# 工具会：
# 1. 自动检测文件变更
# 2. 分析代码差异
# 3. 调用AI生成提交信息
# 4. 询问是否使用生成的信息
# 5. 自动添加并提交
```

#### 2. 规范化提交

```bash
git-ultra cc

# 交互式选择：
# - 提交类型 (feat, fix, docs, etc.)
# - 影响范围 (scope)
# - 简短描述
# - 详细描述（可选）
```

#### 3. 创建版本标签

```bash
git-ultra tag

# 选择版本更新类型：
# - 补丁版本 (1.0.0 -> 1.0.1)
# - 次要版本 (1.0.0 -> 1.1.0)
# - 主要版本 (1.0.0 -> 2.0.0)
# - 自定义版本
```

#### 4. 合并到test分支

```bash
git-ultra merge-test

# 自动完成：
# 1. 提交当前分支更改
# 2. 切换到test分支
# 3. 合并当前分支
# 4. 推送到远程
# 5. 询问是否切回原分支
```

#### 5. 生成 .gitignore 模板

```bash
git-ultra gitignore

# 交互式选择项目类型：
# - Node.js 项目
# - React 项目
# - Vue 项目
# - Python 项目
# - Java 项目
# - TypeScript 项目
# - 通用模板

# 自动在当前目录生成合适的 .gitignore 文件
```

#### 6. 智能 Push（推荐）

```bash
git-ultra push

# 自动完成：
# 1. 检查当前分支
# 2. 表格展示所有文件变更
# 3. 统计改动（新增/修改/删除文件，插入/删除行数）
# 4. 确认是否提交
# 5. 选择提交方式：
#    - 🤖 AI 辅助提交（支持 DeepSeek 或本地 Ollama）
#    - 📝 常规提交
# 6. 自动提交

# 示例输出：
# 📊 文件变更详情:
#
# ┌────────────────────────────────────────┬───────────┬──────────────┐
# │ 📝 文件改动                            │ 状态       │ 改动统计     │
# ├────────────────────────────────────────┼───────────┼──────────────┤
# │ src/index.ts                           │ 已更新     │ -           │
# ├────────────────────────────────────────┼───────────┼──────────────┤
# │ src/commands/push.ts                   │ 已新增    │ 新增          │
# ├────────────────────────────────────────┼───────────┼──────────────┤
# │ old-file.ts                            │ 已删除    │ 删除          │
# ├────────────────────────────────────────┼───────────┼──────────────┤
# │ 总计改动                                │ 📈        │ +156 -23    │
# ├────────────────────────────────────────┼───────────┼──────────────┤
# │ 请核对当前分支                          │ 📌        │ feature/xxx  │
# └────────────────────────────────────────┴───────────┴──────────────┘
```

## 📋 提交规范

工具遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

### 提交类型

- `feat` - 新功能
- `fix` - 修复bug
- `docs` - 文档变更
- `style` - 代码格式（不影响功能）
- `refactor` - 代码重构
- `test` - 测试相关
- `chore` - 构建工具或辅助工具
- `perf` - 性能优化

### 提交格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

**示例：**

```
feat(user): 添加用户登录功能

实现基于JWT的用户认证系统
- 支持邮箱和密码登录
- 实现token刷新机制

Closes #123
```

## 🔨 开发

```bash
# 克隆项目
git clone <repository-url>
cd git-ultra

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建项目
npm run build

# 监听模式
npm run watch
```

## 📝 本地测试

```bash
# 链接到全局
npm link

# 测试命令
git-ultra commit

# 取消链接
npm unlink
```

## 🌟 高级特性

### AI提交信息生成

AI服务会分析你的代码变更，并自动生成：

- 符合Conventional Commits规范的提交信息
- 准确的提交类型识别
- 合适的影响范围
- 清晰的变更描述

### 智能错误处理

- 合并冲突时提供清晰的指引
- 网络错误时显示详细的错误信息
- 未设置API Key时提供配置提示

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request！

- 📮 反馈

如有问题或建议,请提交[Issue](https://github.com/niuyuan0523/git-ultra/issues)
