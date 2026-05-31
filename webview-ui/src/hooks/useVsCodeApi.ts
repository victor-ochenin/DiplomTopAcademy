import { useCallback, useEffect } from 'react';
import type { WebviewMessage, ExtensionMessage } from '../types/messages';

interface VsCodeApi {
  postMessage(message: WebviewMessage): void;
  getState(): Record<string, unknown> | undefined;
  setState(state: Record<string, unknown>): void;
}

declare function acquireVsCodeApi(): VsCodeApi;

let api: VsCodeApi | undefined;

function getVsCodeApi(): VsCodeApi {
  if (!api) {
    api = acquireVsCodeApi();
  }
  return api;
}

export function useVsCodeApi(onMessage?: (message: ExtensionMessage) => void) {
  const vscode = getVsCodeApi();

  useEffect(() => {
    if (!onMessage) {
      return;
    }

    const listener = (event: MessageEvent) => {
      onMessage(event.data as ExtensionMessage);
    };

    window.addEventListener('message', listener);

    return () => {
      window.removeEventListener('message', listener);
    };
  }, [onMessage]);

  return {
    postMessage: useCallback((message: WebviewMessage) => {
      vscode.postMessage(message);
    }, [vscode]),
    
    getState: useCallback(() => {
      return vscode.getState();
    }, [vscode]),

    setState: useCallback((state: Record<string, unknown>) => {
      vscode.setState(state);
    }, [vscode]),
  };
}
