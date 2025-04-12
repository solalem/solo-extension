import * as vscode from 'vscode';
import * as os from "node:os";
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
				: vscode.TreeItemCollapsibleState.None;
		
		const workspaceFolder = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
			? vscode.workspace.workspaceFolders[0] : undefined;
		
		var filePath = path.join(os.tmpdir(), 'solo', workspaceFolder.name, 'previews', (this.tag as CodeTreeItem)?.destinationPath);
		this.resourceUri = vscode.Uri.file(filePath);
		this.contextValue = this.type;
		
		if (this.type === "file") {
			this.command = { command: 'codeTree.previewFile', title: "Preview File", arguments: [this], };
		}
	}
}

