import * as json from "jsonc-parser";
import * as path from "path";
import * as vscode from "vscode";
import { CodeTreeRepository } from "./codeTreeRepository";
import { CodeTreeNode } from "./codeTreeNode";
import { CodeTree } from "./models";

export class CodeTreeProvider implements vscode.TreeDataProvider<CodeTreeNode> {
	private _onDidChangeTreeData: vscode.EventEmitter<CodeTreeNode | null> = new vscode.EventEmitter<CodeTreeNode | null>();
	readonly onDidChangeTreeData: vscode.Event<CodeTreeNode | null> = this._onDidChangeTreeData.event;

	private codeTree: CodeTree | undefined;

	constructor(private context: vscode.ExtensionContext, private repository: CodeTreeRepository) {
	}

	refresh(offset?: CodeTreeNode): void {
		// TODO: reload
		if (offset) {
			this._onDidChangeTreeData.fire(offset);
		} else {
			this._onDidChangeTreeData.fire(null);// TODO: check
		}
	}

	async getChildren(codeTreeNode?: CodeTreeNode): Promise<CodeTreeNode[]> {
		if (codeTreeNode) {
			if (!codeTreeNode || !codeTreeNode.tag.children) 
				return [];

			return codeTreeNode.tag.children.map((i) => (
				new CodeTreeNode(
					i.name, 
					i.type,
					i)
			));
		} else {
			this.codeTree = await this.repository.getCodeTree();
			if (!this.codeTree || !this.codeTree.children) 
				return [];

			return this.codeTree.children.map((i) => (
				new CodeTreeNode(
					i.name, 
					i.type,
					i)
			));
		}
	}

	getTreeItem(codeTreeNode: CodeTreeNode): vscode.TreeItem {
		return codeTreeNode;
	}

}
