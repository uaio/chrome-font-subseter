# Chrome 扩展开发指南

## 快速开始 - 实时调试

### 1. 启动开发服务器

首先确保核心库已经构建：

```bash
# 在项目根目录
pnpm build:core
```

然后启动 Chrome 扩展的开发服务器：

```bash
# 方式 1: 在项目根目录
pnpm dev:chrome

# 方式 2: 直接在 chrome-extension 目录
cd apps/chrome-extension
pnpm dev
```

### 2. 在 Chrome 中加载扩展

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启"开发者模式"（右上角开关）
4. 点击"加载已解压的扩展程序"
5. 选择 `apps/chrome-extension` 目录（注意：不是 dist 目录！）

### 3. 享受热重载！

现在当你修改代码时：
- **React 组件**：会自动刷新弹窗界面
- **Background/Content Scripts**：会自动重新加载扩展
- **Manifest.json**：需要手动重新加载扩展

## 开发体验

### Vite Dev Server
- 运行在 `http://localhost:5173`
- 提供快速的热重载
- 支持 TypeScript 和 React 的实时编译

### CRX 插件优势
- 🔥 **热重载**：修改代码立即生效
- ⚡ **快速构建**：Vite 的极速构建体验
- 🛠️ **TypeScript 支持**：完整的类型检查
- 🎨 **React HMR**：保持组件状态的组件热替换

## 常见问题

### Q: 为什么修改后没有生效？
A:
- React 组件会自动刷新
- Background/Content Scripts 可能需要手动刷新扩展
- Manifest.json 修改后必须手动重新加载扩展

### Q: 如何调试？
A:
- **弹窗**：右键点击弹窗 → 检查
- **Background Script**：在 `chrome://extensions/` 中点击"服务工作进程"
- **Content Script**：在对应网页打开开发者工具

### Q: 构建生产版本
A:
```bash
pnpm build:chrome
```

构建后的文件在 `dist` 目录，可以打包发布。

## 项目结构说明

```
apps/chrome-extension/
├── manifest.json          # 扩展配置（CRX 会自动处理）
├── vite.config.ts        # Vite 配置
├── src/
│   ├── popup/            # React 弹窗组件
│   ├── background/       # 后台脚本
│   └── content/          # 内容脚本
├── public/               # 静态资源
└── dist/                 # 构建输出
```

## 调试技巧

1. **Console 日志**：
   - 弹窗中的 console.log 会显示在弹窗的开发者工具中
   - Background 的日志在 `chrome://extensions/` 的服务工作进程中
   - Content Script 的日志在网页的开发者工具中

2. **React DevTools**：
   - 安装 React Developer Tools 扩展
   - 可以在弹窗中使用 React DevTools

3. **网络请求调试**：
   - 在对应环境的 Network 标签页查看

## 性能优化

- 使用 React.memo 优化组件
- 使用 useEffect 的依赖数组
- 避免在 render 中创建新对象

---

**提示**：开发时保持 Vite 开发服务器运行，享受极速的开发体验！