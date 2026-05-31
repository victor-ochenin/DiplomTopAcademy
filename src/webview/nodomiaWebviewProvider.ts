import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

//https://code.visualstudio.com/api/extension-guides/webview?ref=codesphere.ghost.io
//https://code.visualstudio.com/api/references/vscode-api#WebviewView
//https://stackoverflow.com/questions/77978393/visual-studio-code-webview-provider
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

    //Генерируем html
    webviewView.webview.html = this.getHtmlContent(webviewView.webview);

    //Обработка сообщений от UI
    webviewView.webview.onDidReceiveMessage((message) => {
      switch (message.type) {
        case 'ready':
          break; //UI сообщил, что загрузился. Можно отправить начальные данные.
        case 'getWorkspaceState': {
          //Читаем данные из хранилища VS Code
          const state = this.context.workspaceState.get<{ sidePanel: Record<string, unknown> }>('sidePanel');
          //Отправляем данные обратно в UI
          webviewView.webview.postMessage({
            type: 'workspaceState',
            payload: { sidePanel: state ?? {} },
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
