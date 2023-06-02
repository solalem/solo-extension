'use strict';

import * as vscode from 'vscode';

import { FeatureDesignView } from './featureDesigns/featureDesignView';
import { FeatureDesign } from './featureDesigns/featureDesign';
import { CodeTreeView } from './codeTrees/codeTreeView';

export function activate(context: vscode.ExtensionContext) {
	const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

	// Samples of `window.registerTreeDataProvider`
	const featureDesignsProvider = new FeatureDesignView(rootPath);
	vscode.window.registerTreeDataProvider('featureDesigns', featureDesignsProvider);
	vscode.commands.registerCommand('featureDesigns.refreshEntry', () => featureDesignsProvider.refresh());
	vscode.commands.registerCommand('extension.openPackageOnNpm', moduleName => vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`https://www.npmjs.com/package/${moduleName}`)));
	vscode.commands.registerCommand('featureDesigns.addEntry', () => vscode.window.showInformationMessage(`Successfully called add entry.`));
	vscode.commands.registerCommand('featureDesigns.editEntry', (node: FeatureDesign) => vscode.window.showInformationMessage(`Successfully called edit entry on ${node.label}.`));
	vscode.commands.registerCommand('featureDesigns.deleteEntry', (node: FeatureDesign) => vscode.window.showInformationMessage(`Successfully called delete entry on ${node.label}.`));

	// Samples of `window.createView`
	new CodeTreeView(context);
}