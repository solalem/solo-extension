import * as vscode from 'vscode';
import { CodeTreeProvider } from './codeTreeProvider';
import { CodeTreeRepository } from './codeTreeRepository';
import { FeatureDesignRepository } from '../featureDesigns/featureDesignRepository';

export class CodeTreeView {
	constructor(context: vscode.ExtensionContext) {
		//Create output channel
		let soloOutput = vscode.window.createOutputChannel("Solo");
		
		const treeDataProvider = new CodeTreeProvider(
			context, 
			new CodeTreeRepository(), 
			new FeatureDesignRepository(),
			soloOutput);
		context.subscriptions.push(vscode.window.createTreeView('codeTree', { treeDataProvider }));
	}
}