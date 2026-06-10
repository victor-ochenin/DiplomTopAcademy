import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getAllCoursesAsync } from '../data/CourseLoader';

export class NodomiaWebviewProvider implements vscode.WebviewViewProvider {
  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly context: vscode.ExtensionContext
  ) {}

  async resolveWebviewView(webviewView: vscode.WebviewView) {
    try {
      webviewView.webview.options = {
        enableScripts: true,
        localResourceRoots: [this.extensionUri],
      };

      webviewView.webview.html = await this.getHtmlContent(webviewView.webview);
    } catch (err) {
      console.error('Nodomia: failed to initialize webview', err);
      webviewView.webview.html = '<h1>Nodomia: failed to initialize</h1>';
      return;
    }

    webviewView.webview.onDidReceiveMessage(async (message) => {
      try {
        await this.handleMessage(message, webviewView);
      } catch (err) {
        console.error('Nodomia: unhandled error in message handler', err);
      }
    });
  }

  private async handleMessage(
    message: any,
    webviewView: vscode.WebviewView
  ) {
    switch (message.type) {
      case 'ready':
        break;

      case 'getWorkspaceState': {
        let state: Record<string, unknown> = {};
        try {
          const saved = this.context.workspaceState.get<{ sidePanel: Record<string, unknown> }>('sidePanel');
          state = saved?.sidePanel ?? {};
        } catch (err) {
          console.error('Nodomia: failed to read workspace state', err);
        }
        webviewView.webview.postMessage({
          type: 'workspaceState',
          payload: { sidePanel: state },
        });
        break;
      }

      case 'getCourses': {
        try {
          const courses = await getAllCoursesAsync();
          webviewView.webview.postMessage({ type: 'courses', payload: courses });
        } catch (err) {
          console.error('Nodomia: failed to load courses', err);
          webviewView.webview.postMessage({ type: 'courses', payload: [] });
        }
        break;
      }

      default:
        console.warn(`Nodomia: unknown message type: ${(message as any)?.type}`);
    }
  }

  private async getHtmlContent(webview: vscode.Webview): Promise<string> {
    try {
      const htmlPath = path.join(this.extensionUri.fsPath, 'webview-ui', 'index.html');
      const html = await fs.promises.readFile(htmlPath, 'utf-8');

      const mainJsUri = webview.asWebviewUri(
        vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview', 'main.js')
      );
      const mainCssUri = webview.asWebviewUri(
        vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview', 'main.css')
      );

      return html
        .replaceAll('{{mainJsUri}}', mainJsUri.toString())
        .replaceAll('{{mainCssUri}}', mainCssUri.toString())
        .replaceAll('{{cspSource}}', webview.cspSource);
    } catch (err) {
      console.error('Nodomia: failed to read webview index.html', err);
      return '<h1>Nodomia: failed to load UI</h1>';
    }
  }
}
