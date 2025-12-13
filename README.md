# Font Subseter

字体子集化工具 - 创建字体子集，减小文件大小，提升网页性能。

## 项目结构

这是一个基于 pnpm workspace 的 monorepo 项目，包含以下子项目：

```
font-subseter/
├── packages/
│   └── core/                # 字体子集化核心库
├── apps/
│   ├── chrome-extension/    # Chrome 扩展 (React + Vite)
│   └── vscode-extension/    # VSCode 插件
├── pnpm-workspace.yaml      # pnpm workspace 配置
├── package.json             # 根项目配置
└── tsconfig.json            # TypeScript 项目引用配置
```

## 核心功能

- ✅ 支持 TTF、OTF、WOFF、WOFF2 格式
- ✅ 自定义需要保留的字符
- ✅ 实时预览字体效果
- ✅ 多种输出格式选择
- ✅ 显示压缩率和文件大小对比
- ✅ 友好的用户界面

## 安装

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### 安装依赖

```bash
# 安装所有依赖
pnpm install

# 或者
pnpm install:all
```

## 开发

### 开发模式

```bash
# 同时启动所有项目的开发模式
pnpm dev

# 单独启动核心库开发
pnpm dev:core

# 单独启动 Chrome 扩展开发
pnpm dev:chrome
```

### 构建

```bash
# 构建所有项目
pnpm build

# 单独构建
pnpm build:core      # 构建核心库
pnpm build:chrome    # 构建 Chrome 扩展
pnpm build:vscode    # 构建 VSCode 插件
```

### 代码质量

```bash
# 代码检查
pnpm lint

# 类型检查
pnpm typecheck

# 运行测试
pnpm test

# 清理构建产物
pnpm clean
```

## 子项目详情

### @font-subseter/core

核心字体子集化库，提供字体解析和子集化功能。

主要特性：
- 基于 opentype.js 进行字体解析
- 支持提取指定字符的子集
- 提供完整的 TypeScript 类型定义
- 可在浏览器和 Node.js 环境中使用

### Chrome 扩展

基于 React + Vite 的 Chrome 扩展，提供图形化的字体子集化工具。

功能特点：
- 拖拽上传字体文件
- 实时字符输入和统计
- 字体预览功能
- 多格式输出支持
- 显示压缩率统计

### VSCode 插件

VSCode 编辑器插件，可以直接在编辑器中创建字体子集。

功能特点：
- 右键菜单支持
- 命令面板支持
- 配置选项
- 结果预览

## 安装方法

1. 克隆或下载此项目
2. 下载 opentype.js 库：
   - 访问 https://github.com/opentypejs/opentype.js
   - 下载 `opentype.min.js` 文件到 `libs/` 目录
   - 或使用 CDN 版本修改 `popup.html` 中的引用
3. 打开Chrome浏览器，进入 `chrome://extensions/`
4. 开启"开发者模式"
5. 点击"加载已解压的扩展程序"
6. 选择项目文件夹

## 使用方法

1. 点击Chrome工具栏中的字体子集化工具图标
2. 上传字体文件：
   - 点击上传区域或直接拖拽字体文件
   - 支持 TTF、OTF、WOFF、WOFF2 格式
3. 选择需要的字符：
   - 使用快捷按钮添加常用字符集
   - 或手动在文本框中输入字符
4. 点击"生成字体子集"
5. 查看压缩统计信息
6. 点击"下载字体子集"保存生成的文件

## 技术实现

### 字体检测

插件通过以下方式检测字体：

1. 扫描所有DOM元素的 `font-family` 属性
2. 使用 `document.fonts` API 获取已加载的字体信息
3. 分析页面文本内容，提取所有使用的字符

### 子集生成

字体子集化流程：

1. 收集页面中实际使用的字符
2. 使用字符集生成字体子集
3. 优化生成的子集文件
4. 提供下载功能

## 开发计划

### 第一阶段 - 基础功能
- [x] 创建插件基础结构
- [x] 实现字体检测功能
- [x] 创建基础UI界面
- [ ] 实现基础的子集生成逻辑

### 第二阶段 - 功能增强
- [ ] 集成字体子集化API（如 font-spider）
- [ ] 添加Unicode范围选择
- [ ] 实现WebFont格式支持
- [ ] 添加性能分析功能

### 第三阶段 - 高级功能
- [ ] 支持WOFF2格式优化
- [ ] 添加CDN缓存功能
- [ ] 实现自动化工作流
- [ ] 添加团队协作功能

## 贡献指南

欢迎提交Issue和Pull Request！

### 开发环境设置

1. 克隆项目
2. 在Chrome中加载插件
3. 修改代码后需要重新加载插件

### 代码规范

- 使用ES6+语法
- 遵循Chrome扩展开发最佳实践
- 添加适当的注释

## 许可证

MIT License

## 相关资源

- [Chrome Extension Development Guide](https://developer.chrome.com/docs/extensions/)
- [Font Subsetter Tools](https://github.com/googlefonts/fontsubber)
- [WOFF2 Converter](https://github.com/google/woff2)
- [Unicode Character Ranges](https://unicode.org/charts/)