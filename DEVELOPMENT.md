# 开发指南

## 快速开始

### 1. 安装依赖

```bash
# 使用 pnpm 安装所有依赖
pnpm install
```

### 2. 开发模式

```bash
# 启动所有项目的开发模式
pnpm dev

# 或者单独启动某个项目
pnpm dev:core      # 核心库
pnpm dev:chrome    # Chrome 扩展
```

### 3. 构建项目

```bash
# 构建所有项目
pnpm build

# 单独构建
pnpm build:core      # 构建核心库
pnpm build:chrome    # 构建 Chrome 扩展
pnpm build:vscode    # 构建 VSCode 插件
```

## 项目结构

```
font-subseter/
├── packages/
│   └── core/                # 核心字体子集化库
│       ├── src/
│       │   ├── subseter.ts  # 主要功能
│       │   ├── parser.ts    # 字体解析
│       │   ├── types.ts     # 类型定义
│       │   └── utils.ts     # 工具函数
│       └── package.json
├── apps/
│   ├── chrome-extension/    # Chrome 扩展
│   │   ├── src/
│   │   │   ├── popup/       # 弹窗界面 (React)
│   │   │   ├── background/  # 后台脚本
│   │   │   └── content/     # 内容脚本
│   │   └── manifest.json
│   └── vscode-extension/    # VSCode 插件
│       ├── src/
│       │   ├── extension.ts # 插件入口
│       │   └── commands/    # 命令处理
│       └── package.json
└── docs/                    # 文档目录
```

## Chrome 扩展开发

### 加载扩展到 Chrome

1. 运行构建命令：
   ```bash
   pnpm build:chrome
   ```

2. 打开 Chrome 浏览器，访问 `chrome://extensions/`

3. 开启"开发者模式"

4. 点击"加载已解压的扩展程序"，选择 `apps/chrome-extension/dist` 目录

### 开发模式

开发模式下，Vite 会自动重建文件，但需要手动重新加载扩展。

## VSCode 插件开发

### 调试插件

1. 在 VSCode 中打开项目

2. 按 F5 启动调试，会打开新的 Extension Development Host 窗口

3. 在新窗口中测试插件功能

### 打包插件

```bash
# 编译插件
pnpm build:vscode

# 使用 vsce 打包（需要先安装）
npm install -g vsce
vsce package
```

## 核心库开发

### 本地调试

```bash
# 进入核心库目录
cd packages/core

# 开发模式（监听文件变化）
pnpm dev

# 构建库
pnpm build
```

### 测试

```bash
# 运行测试
pnpm test

# 测试覆盖率
pnpm test:coverage
```

## 代码规范

项目使用 ESLint 和 Prettier 进行代码规范管理：

```bash
# 代码检查
pnpm lint

# 自动修复
pnpm lint:fix

# 代码格式化
pnpm format
```

## 版本管理

项目使用 Changesets 进行版本管理：

```bash
# 添加变更记录
pnpm changeset

# 更新版本
pnpm version-packages

# 发布
pnpm release
```