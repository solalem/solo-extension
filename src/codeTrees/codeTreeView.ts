import * as vscode from 'vscode';
//import { CodeTreeProvider } from './codeTreeProvider';
import { CodeTreeProvider } from './codeTreeProvider';
import { CodeTreeRepository } from './codeTreeRepository';

export class CodeTreeView {
	constructor(context: vscode.ExtensionContext) {
		const treeDataProvider = new CodeTreeProvider(context, new CodeTreeRepository());
		context.subscriptions.push(vscode.window.createTreeView('codeTree', { treeDataProvider }));
		vscode.commands.registerCommand('codeTree.openFile', (resource) => this.openResource(resource));
	}

	private openResource(resource: vscode.Uri): void {
		vscode.window.showTextDocument(resource);
	}
}