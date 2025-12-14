/**
 * Sandbox 通信管理器
 * 用于在 popup 和 sandbox 页面之间进行安全的通信
 */

export class SandboxCommunicator {
  private iframe: HTMLIFrameElement | null = null;
  private ready = false;
  private pendingRequests = new Map<number, {
    resolve: (value: Uint8Array) => void;
    reject: (error: Error) => void;
  }>();
  private requestId = 0;

  async init(): Promise<void> {
    if (this.ready) return;

    return new Promise((resolve, reject) => {
      // 创建隐藏的 iframe 加载沙盒页面
      this.iframe = document.createElement('iframe');
      this.iframe.src = chrome.runtime.getURL('sandbox.html');
      this.iframe.style.display = 'none';
      document.body.appendChild(this.iframe);

      // 设置超时
      const timeout = setTimeout(() => {
        reject(new Error('Sandbox 初始化超时'));
      }, 5000);

      // 监听沙盒消息
      window.addEventListener('message', (event) => {
        if (event.data.type === 'SANDBOX_READY') {
          clearTimeout(timeout);
          this.ready = true;
          console.log('Sandbox 已准备好');
          resolve();
        } else if (event.data.type === 'SUBSET_RESULT') {
          const { id, success, data, error } = event.data;
          const pending = this.pendingRequests.get(id);
          if (pending) {
            if (success) {
              pending.resolve(new Uint8Array(data));
            } else {
              pending.reject(new Error(error));
            }
            this.pendingRequests.delete(id);
          }
        }
      });
    });
  }

  /**
   * 使用 sandbox 执行字体子集化
   */
  async subset(
    fontBuffer: ArrayBuffer,
    text: string,
    options: {
      format?: string;
      variationAxes?: any;
      preserveNameIds?: number[];
    } = {}
  ): Promise<ArrayBuffer> {
    await this.init();

    return new Promise((resolve, reject) => {
      const id = this.requestId++;
      this.pendingRequests.set(id, {
        resolve: (data) => resolve(data.buffer),
        reject
      });

      // 发送消息给沙盒
      if (this.iframe && this.iframe.contentWindow) {
        this.iframe.contentWindow.postMessage({
          type: 'SUBSET_FONT',
          id,
          fontBuffer: Array.from(new Uint8Array(fontBuffer)), // 转为数组以便传输
          text,
          options,
        }, '*');
      }
    });
  }

  /**
   * 清理资源
   */
  dispose(): void {
    if (this.iframe && this.iframe.parentNode) {
      this.iframe.parentNode.removeChild(this.iframe);
    }
    this.iframe = null;
    this.ready = false;
    this.pendingRequests.clear();
  }
}

// 单例实例
let communicator: SandboxCommunicator | null = null;

export function getSandboxCommunicator(): SandboxCommunicator {
  if (!communicator) {
    communicator = new SandboxCommunicator();
  }
  return communicator;
}