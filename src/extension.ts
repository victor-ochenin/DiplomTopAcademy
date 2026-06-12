import * as vscode from 'vscode';
import { NodomiaWebviewProvider } from './webview/nodomiaWebviewProvider';
import { initCourseLoader } from './data/CourseLoader';

export function activate(context: vscode.ExtensionContext) {
	try {
		//Передаем путь где лежит расширение для того чтобы в будущем понимать где лежат данные
		initCourseLoader(context.extensionPath);
	} catch (err) {
		console.error('Nodomia: failed to initialize course loader', err);
		vscode.window.showErrorMessage(
			'Nodomia: не удалось загрузить данные курсов. Некоторые функции могут быть недоступны.'
		);
	}

	try {
		// Создаем мост между React-фронтендом (который рендерится внутри WebView) и extension host'ом VS Code
		const provider = new NodomiaWebviewProvider(context.extensionUri, context);
		context.subscriptions.push(
			vscode.window.registerWebviewViewProvider('nodomia.sidePanel', provider)
		);
	} catch (err) {
		console.error('Nodomia: failed to register webview provider', err);
		vscode.window.showErrorMessage(
			'Nodomia: не удалось инициализировать интерфейс. Расширение не будет работать.'
		);
	}
}

export function deactivate() {}
