import * as vscode from 'vscode';
import * as path from 'path';
import { CodeTree, CodeTreeItem } from './models';

export class CodeTreeNode extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly type: string,
		public readonly tag: CodeTreeItem | CodeTree,
	) {
		super(label);

		this.tooltip = `${this.label} - ${this.type}`;
		//this.description = this.label;

		this.collapsibleState = this.type === 'folder'
				? vscode.TreeItemCollapsibleState.Collapsed
				: vscode.TreeItemCollapsibleState.None
		
		this.iconPath = this.getIcon();
		this.contextValue = this.type;
		
		if (this.type === "file") {
			this.command = { command: 'codeTree.previewFile', title: "Preview File", arguments: [this], };
		}
	}
	
	getIcon(): any {
        if (this.type === "file") {
            return {
				light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'document.svg'),
				dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'document.svg')
			};
        }
		return null;
	}
}

