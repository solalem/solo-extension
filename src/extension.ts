'use strict';

import * as vscode from 'vscode';

import { FeatureDesignView } from './featureDesigns/featureDesignView';
import { CodeTreeView } from './codeTrees/codeTreeView';

export function activate(context: vscode.ExtensionContext) {
	const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

	vscode.commands.registerCommand('extension.openPackageOnNpm', moduleName => vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`https://www.npmjs.com/package/${moduleName}`)));

	// Samples of `window.createView`
	new CodeTreeView(context);
	new FeatureDesignView(context);
}