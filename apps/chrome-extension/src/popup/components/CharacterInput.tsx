import React, { useCallback, useMemo } from 'react';

interface CharacterInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const CharacterInput: React.FC<CharacterInputProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const stats = useMemo(() => {
    const uniqueChars = [...new Set(value)];
    return {
      total: value.length,
      unique: uniqueChars.length
    };
  }, [value]);

  const handleQuickAdd = useCallback((chars: string) => {
    const currentChars = value;
    const combinedChars = currentChars + chars;
    const uniqueChars = [...new Set(combinedChars)].join('');
    onChange(uniqueChars);
  }, [value, onChange]);

  const handleClear = useCallback(() => {
    onChange('');
  }, [onChange]);

  const quickCharSets = [
    { label: '字母', chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz' },
    { label: '数字', chars: '0123456789' },
    { label: '中文', chars: '汉字测试常用字' },
    { label: '标点', chars: '，。！？；：""\'\'（）【】《》' }
  ];

  return (
    <div className="character-input">
      <label htmlFor="char-input">需要保留的字符：</label>
      <textarea
        id="char-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="输入需要保留的字符..."
      />

      <div className="char-stats">
        <span>字符数：{stats.total}</span>
        <span>唯一字符：{stats.unique}</span>
      </div>

      <div className="char-actions">
        <button
          className="clear-button"
          onClick={handleClear}
          disabled={disabled || !value}
        >
          清空
        </button>
      </div>

      <div className="quick-char-sets">
        <p>快速添加：</p>
        <div className="char-buttons">
          {quickCharSets.map((set) => (
            <button
              key={set.label}
              className="char-btn"
              onClick={() => handleQuickAdd(set.chars)}
              disabled={disabled}
            >
              {set.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};