// Content script for Chrome Extension
// 这里可以添加页面内容脚本，如检测页面中的字体等

console.log('字体子集化工具 Content Script 已加载');

// 可以在这里添加页面字体检测功能
function detectPageFonts() {
  const elements = document.querySelectorAll('*');
  const fontFamilies = new Set();

  elements.forEach(el => {
    const computedStyle = window.getComputedStyle(el);
    const fontFamily = computedStyle.fontFamily;
    if (fontFamily && fontFamily !== 'initial') {
      fontFamilies.add(fontFamily);
    }
  });

  return Array.from(fontFamilies);
}

// 发送检测到的字体到popup
chrome.runtime.sendMessage({
  type: 'PAGE_FONTS',
  fonts: detectPageFonts()
});