import React from 'react';
import { FontFormat } from '@font-subseter/core';

interface SubsetOptionsProps {
  format: FontFormat;
  onFormatChange: (format: FontFormat) => void;
  disabled?: boolean;
}

export const SubsetOptions: React.FC<SubsetOptionsProps> = ({
  format,
  onFormatChange,
  disabled = false
}) => {
  const formats: { value: FontFormat; label: string }[] = [
    { value: 'woff2', label: 'WOFF2 (推荐)' },
    { value: 'woff', label: 'WOFF' },
    { value: 'ttf', label: 'TTF' },
    { value: 'otf', label: 'OTF' }
  ];

  return (
    <div className="format-options">
      <label>输出格式：</label>
      {formats.map((fmt) => (
        <div key={fmt.value} className="format-option">
          <input
            type="radio"
            id={fmt.value}
            name="format"
            value={fmt.value}
            checked={format === fmt.value}
            onChange={(e) => onFormatChange(e.target.value as FontFormat)}
            disabled={disabled}
          />
          <label htmlFor={fmt.value}>{fmt.label}</label>
        </div>
      ))}
    </div>
  );
};