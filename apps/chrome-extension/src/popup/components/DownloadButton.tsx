import React, { useCallback } from 'react';
import { FontFormat } from '@font-subseter/core';

interface DownloadButtonProps {
  data: ArrayBuffer;
  fileName: string;
  format: FontFormat;
  disabled?: boolean;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  data,
  fileName,
  format,
  disabled = false
}) => {
  const handleDownload = useCallback(() => {
    const mimeType = getFontMimeType(format);
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);

    // 创建下载链接
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // 清理URL
    URL.revokeObjectURL(url);
  }, [data, fileName, format]);

  const formatName = format.toUpperCase();

  return (
    <button
      className="download-button"
      onClick={handleDownload}
      disabled={disabled}
    >
      下载字体子集 ({formatName})
    </button>
  );
};

function getFontMimeType(format: FontFormat): string {
  const mimeTypes = {
    ttf: 'font/ttf',
    otf: 'font/otf',
    woff: 'font/woff',
    woff2: 'font/woff2'
  };
  return mimeTypes[format];
}