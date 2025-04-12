import * as vscode from 'vscode';
import * as path from 'path';

export class FeatureDesignNode extends vscode.TreeItem {

	constructor(
		public readonly id: string,
		public readonly label: string,
		public readonly type: string,
		public readonly modelId: string | undefined,
		public readonly fsPath: string | undefined,
	) {
		super(label);

		this.tooltip = `${this.label} - ${this.type}`;
		//this.description = this.label;
		this.iconPath = this.getIcon();
		this.contextValue = this.type;
		
		this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
		if (type === 'design') {
			this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

			if (fsPath) 
				this.command = { command: 'featureDesigns.openFile', title: "Open File", arguments: [vscode.Uri.file(fsPath)], };
		}
		else if (type === 'item') {
			this.collapsibleState = vscode.TreeItemCollapsibleState.None;

			this.command = { command: 'featureDesigns.editItem', title: "Edit Item", arguments: [this], };
		}
	}
		
	getIcon(): any {
		if (this.type === "item") {
			return {
				light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'list.svg'),
				dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'list.svg')
			};
		}
		else if (this.type === "aggregate") {
			return {
				light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'folder.svg'),
				dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'folder.svg')
			};
		}
		return null;
	}
}
