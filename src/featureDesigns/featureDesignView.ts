import * as vscode from 'vscode';
import { FeatureDesignRepository } from './featureDesignRepository';
import { FeatureDesignsProvider } from './featureDesignsProvider';
import { CodeTreeRepository } from '../codeTrees/codeTreeRepository';

export class FeatureDesignView {
	constructor(context: vscode.ExtensionContext) {
		const treeDataProvider = new FeatureDesignsProvider(context, new FeatureDesignRepository(), new CodeTreeRepository());
		context.subscriptions.push(vscode.window.createTreeView('featureDesigns', { treeDataProvider }));
	}
}