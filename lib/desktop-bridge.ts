// Helper bridge for desktop environment (WebView2 in WinForms) and web fallbacks.

export type DesktopAction = 'fullscreen' | 'windowed' | 'fit-window' | 'toggle-fullscreen' | 'quit';

declare global {
  interface Window {
    chrome?: {
      webview?: {
        postMessage: (message: string | unknown) => void;
        addEventListener?: (type: string, listener: (event: any) => void) => void;
        removeEventListener?: (type: string, listener: (event: any) => void) => void;
      };
    };
  }
}

export function isDesktopApp(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.chrome?.webview) || process.env.NEXT_PUBLIC_APP_MODE === 'desktop';
}

export function requestDesktopAction(action: DesktopAction): void {
  if (typeof window === 'undefined') return;

  // 1. Direct WebView2 postMessage to WinForms Host
  if (window.chrome?.webview) {
    try {
      window.chrome.webview.postMessage(action);
      return;
    } catch (e) {
      console.warn('Failed to post message to WebView2 host:', e);
    }
  }

  // 2. Browser fallback for web testing
  if (typeof document !== 'undefined') {
    if (action === 'toggle-fullscreen') {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      } else {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else if (action === 'fullscreen') {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else if (action === 'windowed' || action === 'fit-window') {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    } else if (action === 'quit') {
      if (window.confirm('Tutup aplikasi BOTC Desktop?')) {
        window.close();
      }
    }
  }
}

export function onDesktopWindowStateChange(callback: (isFullscreen: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleCustomEvent = (e: Event) => {
    const custom = e as CustomEvent<{ isFullscreen: boolean }>;
    if (typeof custom.detail?.isFullscreen === 'boolean') {
      callback(custom.detail.isFullscreen);
    }
  };

  const handleNativeFullscreen = () => {
    callback(Boolean(document.fullscreenElement));
  };

  window.addEventListener('botc-window-state', handleCustomEvent);
  document.addEventListener('fullscreenchange', handleNativeFullscreen);

  return () => {
    window.removeEventListener('botc-window-state', handleCustomEvent);
    document.removeEventListener('fullscreenchange', handleNativeFullscreen);
  };
}
