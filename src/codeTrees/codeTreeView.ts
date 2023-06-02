import * as vscode from 'vscode';
import { FileSystemProvider } from './fileSystemProvider';

export class CodeTreeView {
	constructor(context: vscode.ExtensionContext) {
		const treeDataProvider = new FileSystemProvider();
		context.subscriptions.push(vscode.window.createTreeView('codeTree', { treeDataProvider }));
		vscode.commands.registerCommand('codeTree.openFile', (resource) => this.openResource(resource));
	}

	private openResource(resource: vscode.Uri): void {
		vscode.window.showTextDocument(resource);
	}
}