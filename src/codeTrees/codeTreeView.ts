import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import { CodeTreeProvider } from './codeTreeProvider';
import { CodeTreeRepository } from './codeTreeRepository';
import { FeatureDesignRepository } from '../featureDesigns/featureDesignRepository';

export class CodeTreeView {
	constructor(context: vscode.ExtensionContext) {
		//Create output channel
		let soloOutput = vscode.window.createOutputChannel("Solo");
		const codeTreeRepository = new CodeTreeRepository();

		const treeDataProvider = new CodeTreeProvider(
			context, 
			codeTreeRepository, 
			new FeatureDesignRepository(),
			soloOutput);

		const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
			? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
		const configured = rootPath && fs.existsSync(path.join(rootPath, "design"));
		vscode.commands.executeCommand('setContext', 'solo.configured', configured);
		const newCommand = vscode.commands.registerCommand('solo.new', async () => {
			codeTreeRepository.prepare();
			treeDataProvider.refresh();
		});
		context.subscriptions.push(newCommand);
		
		context.subscriptions.push(vscode.window.createTreeView('codeTree', { treeDataProvider }));
	}
}