import * as vscode from 'vscode';
import { FeatureDesignRepository } from './featureDesignRepository';
import { FeatureDesignsProvider } from './featureDesignsProvider';

export class FeatureDesignView {
	constructor(context: vscode.ExtensionContext) {
		const treeDataProvider = new FeatureDesignsProvider(context, new FeatureDesignRepository());
		context.subscriptions.push(vscode.window.createTreeView('featureDesigns', { treeDataProvider }));
	}
}