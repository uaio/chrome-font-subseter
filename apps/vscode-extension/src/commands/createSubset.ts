import * as vscode from 'vscode';
import { FontSubseter, FontFormat } from '@font-subseter/core';

/**
 * 处理创建字体子集的命令
 */
export async function handleCreateSubsetCommand(uri?: vscode.Uri): Promise<void> {
  try {
    // 如果没有提供URI，让用户选择文件
    if (!uri) {
      const selectedUris = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectMany: false,
        openLabel: '选择字体文件',
        filters: {
          '字体文件': ['ttf', 'otf', 'woff', 'woff2']
        }
      });

      if (!selectedUris || selectedUris.length === 0) {
        return;
      }
      uri = selectedUris[0];
    }

    // 验证文件类型
    if (!isFontFile(uri)) {
      vscode.window.showErrorMessage('请选择一个有效的字体文件');
      return;
    }

    // 读取文件数据
    const fileData = await vscode.workspace.fs.readFile(uri);

    // 获取字符输入
    const characters = await promptForCharacters();
    if (!characters) {
      return;
    }

    // 获取输出选项
    const options = await getSubsetOptions();
    if (!options) {
      return;
    }

    // 执行子集化
    await performSubsetCreation(uri, fileData, characters, options);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    vscode.window.showErrorMessage(`创建字体子集失败: ${errorMessage}`);
  }
}

/**
 * 验证是否为字体文件
 */
function isFontFile(uri: vscode.Uri): boolean {
  const fontExtensions = ['.ttf', '.otf', '.woff', '.woff2'];
  return fontExtensions.some(ext => uri.path.toLowerCase().endsWith(ext));
}

/**
 * 提示用户输入需要保留的字符
 */
async function promptForCharacters(): Promise<string | undefined> {
  const inputOptions: vscode.InputBoxOptions = {
    prompt: '请输入需要保留的字符',
    placeHolder: '例如: abcdefghijklmnopqrstuvwxyz0123456789',
    value: '',
    validateInput: (value: string) => {
      if (!value || value.trim().length === 0) {
        return '请输入至少一个字符';
      }
      if (value.length > 100000) {
        return '字符数量不能超过100,000个';
      }
      return null;
    }
  };

  return await vscode.window.showInputBox(inputOptions);
}

/**
 * 获取子集化选项
 */
async function getSubsetOptions(): Promise<{
  format: FontFormat;
  preserveMetadata: boolean;
} | undefined> {
  // 获取配置
  const config = vscode.workspace.getConfiguration('fontSubseter');
  const defaultFormat = config.get<FontFormat>('defaultOutputFormat', 'woff2');
  const defaultPreserve = config.get<boolean>('preserveMetadata', true);

  // 格式选择
  const formatItems: vscode.QuickPickItem[] = [
    { label: 'WOFF2', description: '推荐的Web字体格式，压缩率最高', value: 'woff2' },
    { label: 'WOFF', description: '广泛支持的Web字体格式', value: 'woff' },
    { label: 'TTF', description: 'TrueType字体格式', value: 'ttf' },
    { label: 'OTF', description: 'OpenType字体格式', value: 'otf' }
  ];

  const selectedFormat = await vscode.window.showQuickPick(
    formatItems,
    {
      placeHolder: '选择输出格式',
      canPickMany: false
    }
  );

  if (!selectedFormat) {
    return undefined;
  }

  // 是否保留元数据
  const preserveMetadata = await vscode.window.showQuickPick(
    [
      { label: '是', description: '保留字体的元数据信息', value: true },
      { label: '否', description: '移除字体的元数据以减小文件大小', value: false }
    ],
    {
      placeHolder: '是否保留字体元数据？',
      canPickMany: false
    }
  );

  if (!preserveMetadata) {
    return undefined;
  }

  return {
    format: (selectedFormat.value || defaultFormat) as FontFormat,
    preserveMetadata: preserveMetadata.value as boolean
  };
}

/**
 * 执行字体子集化
 */
async function performSubsetCreation(
  sourceUri: vscode.Uri,
  fileData: Uint8Array,
  characters: string,
  options: {
    format: FontFormat;
    preserveMetadata: boolean;
  }
): Promise<void> {
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: '创建字体子集',
      cancellable: false
    },
    async (progress) => {
      // 加载字体
      progress.report({ increment: 20, message: '加载字体文件...' });
      const subseter = new FontSubseter();
      try {
        await subseter.loadFont(fileData.buffer);

        // 创建子集
        progress.report({ increment: 40, message: '处理字符...' });
        const result = await subseter.createSubset({
          characters,
          outputFormat: options.format,
          preserveMetadata: options.preserveMetadata,
          nameSuffix: 'subset'
        });

        // 生成输出文件路径
        const sourcePath = sourceUri.path;
        const pathWithoutExt = sourcePath.substring(0, sourcePath.lastIndexOf('.')) || sourcePath;
        const outputUri = sourceUri.with({
          path: `${pathWithoutExt}_subset.${options.format}`
        });

        // 保存文件
        progress.report({ increment: 80, message: '保存子集文件...' });
        await vscode.workspace.fs.writeFile(outputUri, Buffer.from(result.data));

        // 显示结果
        progress.report({ increment: 100, message: '完成！' });

        const resultMessage = `
原始大小: ${formatFileSize(result.originalSize)}
子集大小: ${formatFileSize(result.subsetSize)}
压缩率: ${result.compressionRate}%
保留字符: ${result.characterCount} 个
`.trim();

        // 显示成功消息
        const action = await vscode.window.showInformationMessage(
          '字体子集创建成功！',
          '查看详情',
          '打开文件'
        );

        if (action === '查看详情') {
          showSubsetResult(resultMessage, outputUri);
        } else if (action === '打开文件') {
          const document = await vscode.workspace.openTextDocument(outputUri);
          vscode.window.showTextDocument(document);
        }
      } finally {
        subseter.dispose();
      }
    }
  );
}

/**
 * 显示子集化结果
 */
function showSubsetResult(message: string, fileUri: vscode.Uri): void {
  const content = `# 字体子集化结果

${message}

文件路径: \`${fileUri.fsPath}\`

---

*由 Font Subseter VSCode 插件生成*
`;

  // 创建并显示结果文档
  vscode.workspace.openTextDocument({
    content,
    language: 'markdown'
  }).then(doc => {
    vscode.window.showTextDocument(doc);
  });
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}