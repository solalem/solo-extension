import * as vscode from 'vscode';
import { CodeTreeProvider } from './codeTreeProvider';
import { CodeTreeProvider2 } from './codeTreeProvider2';

export class CodeTreeView {
	constructor(context: vscode.ExtensionContext) {
		const treeDataProvider = new CodeTreeProvider2(context);
		context.subscriptions.push(vscode.window.createTreeView('codeTree', { treeDataProvider }));
		vscode.commands.registerCommand('codeTree.openFile', (resource) => this.openResource(resource));
	}

	private openResource(resource: vscode.Uri): void {
		vscode.window.showTextDocument(resource);
	}
}