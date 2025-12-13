import * as vscode from 'vscode';
import { createSubset, FontFormat, validateCharacters } from '@font-subseter/core';

export function activate(context: vscode.ExtensionContext) {
  console.log('Font Subseter 插件已激活');

  // 注册创建字体子集的命令
  const createSubsetCommand = vscode.commands.registerCommand(
    'fontSubseter.createSubset',
    async (resource: vscode.Uri) => {
      try {
        // 如果没有传入资源，让用户选择文件
        if (!resource) {
          const fileUri = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectMany: false,
            openLabel: '选择字体文件',
            filters: {
              '字体文件': ['ttf', 'otf', 'woff', 'woff2']
            }
          });

          if (fileUri && fileUri.length > 0) {
            resource = fileUri[0];
          } else {
            return;
          }
        }

        // 读取字体文件
        const fileData = await vscode.workspace.fs.readFile(resource);

        // 获取需要保留的字符
        const characters = await getCharactersFromUser();
        if (!characters) {
          return;
        }

        // 显示进度条
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: '正在创建字体子集...',
            cancellable: false
          },
          async (progress) => {
            progress.report({ increment: 20, message: '读取字体文件...' });

            // 获取配置
            const config = vscode.workspace.getConfiguration('fontSubseter');
            const outputFormat = config.get<FontFormat>('defaultOutputFormat', 'woff2');
            const preserveMetadata = config.get<boolean>('preserveMetadata', true);

            progress.report({ increment: 40, message: '处理字符...' });

            // 创建子集
            const result = await createSubset(fileData, characters, {
              outputFormat,
              preserveMetadata,
              nameSuffix: 'subset'
            });

            progress.report({ increment: 80, message: '保存文件...' });

            // 选择保存位置
            const saveUri = await vscode.window.showSaveDialog({
              defaultUri: resource.with({
                path: resource.path.replace(/\.[^.]+$/, `_subset.${outputFormat}`)
              }),
              filters: {
                '字体文件': [outputFormat]
              }
            });

            if (saveUri) {
              // 保存子集文件
              await vscode.workspace.fs.writeFile(saveUri, Buffer.from(result.data));

              // 显示结果
              const message = `字体子集创建成功！\n` +
                `原始大小: ${formatFileSize(result.originalSize)}\n` +
                `子集大小: ${formatFileSize(result.subsetSize)}\n` +
                `压缩率: ${result.compressionRate}%\n` +
                `保留字符: ${result.characterCount} 个`;

              vscode.window.showInformationMessage(
                '字体子集创建成功！',
                '查看详情'
              ).then(selection => {
                if (selection === '查看详情') {
                  showResultInNewDocument(message, saveUri);
                }
              });

              // 自动打开新创建的文件
              const document = await vscode.workspace.openTextDocument(saveUri);
              vscode.window.showTextDocument(document);
            }

            progress.report({ increment: 100, message: '完成！' });
          }
        );
      } catch (error) {
        vscode.window.showErrorMessage(
          `创建字体子集失败: ${error instanceof Error ? error.message : '未知错误'}`
        );
      }
    }
  );

  context.subscriptions.push(createSubsetCommand);
}

/**
 * 从用户输入获取需要保留的字符
 */
async function getCharactersFromUser(): Promise<string | undefined> {
  const options: vscode.InputBoxOptions = {
    prompt: '请输入需要保留的字符',
    placeHolder: '例如: abcdefghijklmnopqrstuvwxyz0123456789',
    validateInput: (value) => {
      const errors = validateCharacters(value);
      return errors.length > 0 ? errors[0] : null;
    }
  };

  return await vscode.window.showInputBox(options);
}

/**
 * 在新文档中显示结果
 */
function showResultInNewDocument(message: string, fileUri: vscode.Uri): void {
  const content = `# 字体子集化结果

${message}

文件路径: ${fileUri.fsPath}

---

*由 Font Subseter 插件生成*
`;

  const document = vscode.workspace.openTextDocument({
    content,
    language: 'markdown'
  });

  vscode.window.showTextDocument(document);
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * 插件停用时调用
 */
export function deactivate() {
  console.log('Font Subseter 插件已停用');
}