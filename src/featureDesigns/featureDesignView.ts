import * as vscode from 'vscode';
import { FeatureDesignNode } from './featureDesignNode';
import { FeatureDesignRepository } from './featureDesignRepository';
import { FeatureDesignsProvider } from './featureDesignsProvider';

export class FeatureDesignView {
	constructor(context: vscode.ExtensionContext) {
		const treeDataProvider = new FeatureDesignsProvider(context, new FeatureDesignRepository());
		context.subscriptions.push(vscode.window.createTreeView('featureDesigns', { treeDataProvider }));
		vscode.commands.registerCommand('featureDesigns.openFile', (resource) => this.openResource(resource));
		vscode.commands.registerCommand('featureDesigns.refreshEntry', () => treeDataProvider.refresh());
		vscode.commands.registerCommand('featureDesigns.addEntry', () => vscode.window.showInformationMessage(`Successfully called add entry.`));
		vscode.commands.registerCommand('featureDesigns.editEntry', (node: FeatureDesignNode) => vscode.window.showInformationMessage(`Successfully called edit entry on ${node.label}.`));
		vscode.commands.registerCommand('featureDesigns.deleteEntry', (node: FeatureDesignNode) => vscode.window.showInformationMessage(`Successfully called delete entry on ${node.label}.`));
	}

	private openResource(resource: vscode.Uri): void {
		vscode.window.showTextDocument(resource);
	}
}