#!/bin/bash

# 构建脚本 - 用于打包Chrome扩展

echo "开始构建Chrome扩展..."

# 创建构建目录
rm -rf build
mkdir -p build

# 复制必要文件
echo "复制文件..."
cp manifest.json build/
cp popup.html build/
cp popup.css build/
cp popup.js build/
cp -r icons build/

# 创建zip文件
echo "创建压缩包..."
cd build
zip -r ../chrome-font-subseter-v1.0.0.zip *
cd ..

echo "构建完成！文件：chrome-font-subseter-v1.0.0.zip"