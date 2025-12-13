// Background script for Chrome Extension
// 这里可以添加后台任务，如监听标签页更新等

chrome.runtime.onInstalled.addListener(() => {
  console.log('字体子集化工具已安装');
});

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 处理来自popup的消息
  console.log('收到消息:', message);
});

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // 可以在这里检测页面中的字体使用情况
  if (changeInfo.status === 'complete') {
    // console.log('页面加载完成:', tab.url);
  }
});