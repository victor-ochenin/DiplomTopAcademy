import * as vscode from 'vscode';
import { NodomiaWebviewProvider } from './webview/nodomiaWebviewProvider';

export function activate(context: vscode.ExtensionContext) {
	const provider = new NodomiaWebviewProvider(context.extensionUri, context);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('nodomia.sidePanel', provider)
	);
}

export function deactivate() {}
