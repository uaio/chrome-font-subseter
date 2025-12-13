import React, { useEffect, useRef, useState } from 'react';
import { FontFormat } from '@font-subseter/core';

interface FontPreviewProps {
  fontUrl: string;
  characters: string;
  format: FontFormat;
}

export const FontPreview: React.FC<FontPreviewProps> = ({
  fontUrl,
  characters,
  format
}) => {
  const [fontName, setFontName] = useState<string>('');
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!fontUrl) return;

    // 创建唯一的字体名称
    const uniqueFontName = `PreviewFont_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setFontName(uniqueFontName);

    // 创建字体样式
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: '${uniqueFontName}';
        src: url('${fontUrl}') format('${format}');
      }
    `;
    document.head.appendChild(style);

    // 清理函数
    return () => {
      document.head.removeChild(style);
    };
  }, [fontUrl, format]);

  const previewText = characters || '字体预览 Font Preview';

  return (
    <div className="font-preview">
      <h3>预览</h3>
      <div
        ref={previewRef}
        className="preview-text"
        style={{
          fontFamily: fontName ? `'${fontName}', monospace` : 'monospace'
        }}
      >
        {previewText}
      </div>
    </div>
  );
};