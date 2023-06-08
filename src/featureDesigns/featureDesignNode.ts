import * as vscode from 'vscode';
import * as path from 'path';


export class FeatureDesignNode extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		public readonly type: string,
		public readonly jsonFilePath: string | undefined,
		public readonly jsonOffset: number | undefined,
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
