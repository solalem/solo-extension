import * as vscode from 'vscode';
import * as path from 'path';


export class FeatureDesignNode extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		public readonly type: vscode.FileType,
		private readonly version: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);

		this.tooltip = `${this.label}-${this.version}`;
		this.description = this.version;
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'document.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'document.svg')
	};

	contextValue = this.label;
}
