import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import { CodeTreeProvider } from './codeTreeProvider';
import { CodeTreeRepository } from './codeTreeRepository';
import { ModelRepository } from '../modeling/modelRepository';

export class CodeTreeView {
	constructor(context: vscode.ExtensionContext) {
		//Create output channel
		const soloOutput = vscode.window.createOutputChannel("Solo");
		const codeTreeRepository = new CodeTreeRepository();

		const treeDataProvider = new CodeTreeProvider(
			codeTreeRepository, 
			new ModelRepository(),
			soloOutput);

		const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
			? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
		const configured = rootPath && fs.existsSync(path.join(rootPath, "solo.config"));
		vscode.commands.executeCommand('setContext', 'solo.configured', configured);
		const newCommand = vscode.commands.registerCommand('solo.new', async () => {
			codeTreeRepository.prepare();
			treeDataProvider.refresh();
		});
		context.subscriptions.push(newCommand);
		
		context.subscriptions.push(vscode.window.createTreeView('codeTree', { treeDataProvider }));
	}
}