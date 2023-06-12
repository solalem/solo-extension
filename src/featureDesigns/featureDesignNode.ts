import * as vscode from 'vscode';
import * as path from 'path';

export class FeatureDesignNode extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		public readonly type: string,
		public readonly filePath: string | undefined,
	) {
		super(label);

		this.tooltip = `${this.label} - ${this.type}`;
		this.description = this.label;
		
		this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
		if (type === 'design') {
			this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		}
		else if (type === 'item') {
			this.collapsibleState = vscode.TreeItemCollapsibleState.None;
		}

		if (filePath) {
			this.command = { command: 'featureDesigns.openFile', title: "Open File", arguments: [vscode.Uri.file(filePath)], };
		}
	}

	iconPath = {
		light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'list.svg'),
		dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'list.svg')
	};

	contextValue = this.label;
}
