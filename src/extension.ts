'use strict';

import * as vscode from 'vscode';

import { ModelView } from './modeling/modelView';
import { CodeTreeView } from './codeTrees/codeTreeView';

export function activate(context: vscode.ExtensionContext) {
	new CodeTreeView(context);
	new ModelView(context);
}