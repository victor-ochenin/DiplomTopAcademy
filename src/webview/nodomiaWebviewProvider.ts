import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getAllCourses } from '../data/CourseLoader';

export class NodomiaWebviewProvider implements vscode.WebviewViewProvider {
  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly context: vscode.ExtensionContext
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    webviewView.webview.html = this.getHtmlContent(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((message) => {
      switch (message.type) {
        case 'ready':
          break;
        case 'getWorkspaceState': {
          const state = this.context.workspaceState.get<{ sidePanel: Record<string, unknown> }>('sidePanel');
          webviewView.webview.postMessage({
            type: 'workspaceState',
            payload: { sidePanel: state ?? {} },
          });
          break;
        }
        case 'getCourses': {
          const courses = getAllCourses();
          webviewView.webview.postMessage({
            type: 'courses',
            payload: courses,
          });
          break;
        }
      }
    });
  }

  private getHtmlContent(webview: vscode.Webview): string {
    let html: string;
    try {
      const htmlPath = path.join(this.extensionUri.fsPath, 'webview-ui', 'index.html');
      html = fs.readFileSync(htmlPath, 'utf-8');
    } catch (error) {
      console.error('Nodomia: failed to read webview index.html', error);
      return '<h1>Nodomia: failed to load UI</h1>';
    }

    const mainJsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview', 'main.js')
    );

    html = html.replaceAll('{{mainJsUri}}', mainJsUri.toString());
    html = html.replaceAll('{{cspSource}}', webview.cspSource);

    return html;
  }
}
