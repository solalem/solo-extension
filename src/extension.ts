'use strict';

import * as vscode from 'vscode';

import { FeatureDesignView } from './featureDesigns/featureDesignView';
import { CodeTreeView } from './codeTrees/codeTreeView';

export function activate(context: vscode.ExtensionContext) {
	new CodeTreeView(context);
	new FeatureDesignView(context);
}