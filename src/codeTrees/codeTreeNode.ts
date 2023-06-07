import * as vscode from 'vscode';
import * as path from 'path';

export class CodeTreeNode extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		public readonly uri: vscode.Uri,
		public readonly type: vscode.FileType,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);

		this.tooltip = `${this.label}-${this.type}`;
		this.description = this.label;
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'document.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'document.svg')
	};

	contextValue = this.label;
}
