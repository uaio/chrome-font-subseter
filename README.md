# 字体子集化工具 Chrome 插件

一个简单易用的字体子集化工具，帮助您创建只包含所需字符的小字体文件，从而优化网页加载性能。

## 功能特性

- 📁 **字体上传** - 支持上传 TTF、OTF、WOFF、WOFF2 格式的字体文件
- ⚡ **快捷字符** - 提供数字、字母、标点等常用字符集的快捷按钮
- ✏️ **自定义输入** - 支持手动输入需要保留的字符
- ✂️ **生成子集** - 根据输入的字符创建字体子集
- 📊 **压缩统计** - 显示原始字体和子集的大小对比及压缩率
- 💾 **一键下载** - 生成的子集可直接下载使用

## 项目结构

```
chrome-font-subseter/
├── manifest.json        # 插件配置文件
├── popup.html           # 弹窗界面
├── popup.css           # 弹窗样式
├── popup.js            # 弹窗逻辑
├── libs/               # 第三方库
│   ├── opentype.min.js # 字体处理库（需要下载）
│   └── README.md
├── icons/              # 插件图标
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   ├── icon128.png
│   └── README.md
├── .gitignore
└── README.md           # 项目说明
```

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