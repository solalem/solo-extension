import * as vscode from 'vscode';
import { FeatureDesignsProvider } from './featureDesignsProvider';
import { FeatureDesignNode } from './featureDesignNode';

export class FeatureDesignView {
	constructor(context: vscode.ExtensionContext) {
		const treeDataProvider = new FeatureDesignsProvider();
		context.subscriptions.push(vscode.window.createTreeView('featureDesigns', { treeDataProvider }));
		vscode.commands.registerCommand('featureDesigns.openFile', (resource) => this.openResource(resource));
		//const featureDesignsProvider = new FeatureDesignView(rootPath);
		//vscode.window.registerTreeDataProvider('featureDesigns', featureDesignsProvider);
		vscode.commands.registerCommand('featureDesigns.refreshEntry', () => treeDataProvider.refresh());
		vscode.commands.registerCommand('featureDesigns.addEntry', () => vscode.window.showInformationMessage(`Successfully called add entry.`));
		vscode.commands.registerCommand('featureDesigns.editEntry', (node: FeatureDesignNode) => vscode.window.showInformationMessage(`Successfully called edit entry on ${node.label}.`));
		vscode.commands.registerCommand('featureDesigns.deleteEntry', (node: FeatureDesignNode) => vscode.window.showInformationMessage(`Successfully called delete entry on ${node.label}.`));
		vscode.commands.registerCommand('extension.openPackageOnNpm', moduleName => vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`https://www.npmjs.com/package/${moduleName}`)));
	
	}

	private openResource(resource: vscode.Uri): void {
		vscode.window.showTextDocument(resource);
	}
}