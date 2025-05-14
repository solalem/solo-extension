import * as vscode from 'vscode';
import { ModelRepository } from './modelRepository';
import { ModelsProvider } from './modelsProvider';
import { CodeTreeRepository } from '../codeTrees/codeTreeRepository';

export class ModelView {
	constructor(context: vscode.ExtensionContext) {
		const treeDataProvider = new ModelsProvider(context, new ModelRepository(), new CodeTreeRepository());
		context.subscriptions.push(vscode.window.createTreeView('modeling', { treeDataProvider }));
	}
}