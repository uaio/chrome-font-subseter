# 快速开始指南

## 1. 安装依赖

```bash
pnpm install
```

## 2. 构建核心库

```bash
pnpm build:core
```

## 3. 启动 Chrome 扩展开发

```bash
pnpm dev:chrome
```

## 4. 在 Chrome 中加载扩展

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `apps/chrome-extension/dist` 目录

## 5. 开始开发

现在你可以：
- 修改 `apps/chrome-extension/src/popup/` 中的 React 组件
- 修改 `apps/chrome-extension/src/background/` 中的后台脚本
- 修改 `apps/chrome-extension/src/content/` 中的内容脚本

所有修改都会自动重新加载！

## 调试技巧

- **弹窗**：右键点击扩展图标 → 检查
- **Background Script**：`chrome://extensions/` → 点击"服务工作进程"
- **Content Script**：任意网页 → F12 打开开发者工具

## 常见问题

如果遇到问题，试试：
```bash
# 清理并重新安装
pnpm clean
rm -rf node_modules .pnpm-store
pnpm install

# 重新构建
pnpm build:core
```