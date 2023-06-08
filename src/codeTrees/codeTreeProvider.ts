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
	private tree: json.Node;// | undefined;
	private text: string;

	constructor(private context: vscode.ExtensionContext, private repository: CodeTreeRepository) {
		this.text = "";
		this.tree = { offset: 0, length: 0, type: 'null' };// TODO: check default
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
		if (codeTreeNode && this.tree) {
			// const path = json.getLocation(this.text, offset).path;
			// const node = json.findNodeAtLocation(this.tree, path);
			// return Promise.resolve(this.getChildrenOffsets(node));
			if (!codeTreeNode || !codeTreeNode.tag.children) 
				return [];

			return codeTreeNode.tag.children.map((i) => (
				new CodeTreeNode(
					i.name, 
					i.type,
					i,
					vscode.TreeItemCollapsibleState.Collapsed)
			));
		} else {
			this.codeTree = await this.repository.getCodeTree();
			//this.tree = json.parseTree(this.text);
			if (!this.codeTree || !this.codeTree.children) 
				return [];

			return this.codeTree.children.map((i) => (
				new CodeTreeNode(
					i.name, 
					i.type,
					i,
					vscode.TreeItemCollapsibleState.Collapsed)
			));
			//return this.tree ? this.getChildrenOffsets(this.tree) : [];
		}
	}

	getTreeItem(codeTreeNode: CodeTreeNode): vscode.TreeItem {
		const notFound: vscode.TreeItem = {};

		// const path = json.getLocation(this.text, offset).path;
		// const valueNode = json.findNodeAtLocation(this.tree, path);
		if (codeTreeNode) {
			// let hasChildren =
			// 	valueNode.type === "object" || valueNode.type === "array";
			let treeItem: vscode.TreeItem = new vscode.TreeItem(
				codeTreeNode.label,
				codeTreeNode.type === 'folder'
					? vscode.TreeItemCollapsibleState.Collapsed
					: vscode.TreeItemCollapsibleState.None
			);
			
			treeItem.iconPath = this.getIcon(codeTreeNode);
			treeItem.contextValue = codeTreeNode.type;
			return treeItem;
		}
		return notFound;
	}

	private getIcon(node: CodeTreeNode): any {
		let nodeType = node.type;
        if (nodeType === "folder") {
            return {
                light: this.context.asAbsolutePath(path.join("resources", "light", "folder.svg")),
                dark: this.context.asAbsolutePath(path.join("resources", "dark", "folder.svg"))
            };
        }
        if (nodeType === "file") {
            return {
                light: this.context.asAbsolutePath(path.join("resources", "light", "document.svg")),
                dark: this.context.asAbsolutePath(path.join("resources", "dark", "document.svg"))
            };
        }
		if (nodeType === "boolean") {
			return {
				light: this.context.asAbsolutePath(
					path.join("resources", "light", "boolean.svg")
				),
				dark: this.context.asAbsolutePath(
					path.join("resources", "dark", "boolean.svg")
				)
			};
		}
		if (nodeType === "string") {
			return {
				light: this.context.asAbsolutePath(
					path.join("resources", "light", "string.svg")
				),
				dark: this.context.asAbsolutePath(
					path.join("resources", "dark", "string.svg")
				)
			};
		}
		if (nodeType === "number") {
			return {
				light: this.context.asAbsolutePath(
					path.join("resources", "light", "number.svg")
				),
				dark: this.context.asAbsolutePath(
					path.join("resources", "dark", "number.svg")
				)
			};
		}

		if (nodeType === "object" || nodeType === "array") {
			return {
				light: this.context.asAbsolutePath(
					path.join("resources", "light", "list.svg")
				),
				dark: this.context.asAbsolutePath(
					path.join("resources", "dark", "list.svg")
				)
			};
		}

		return null;
	}
}
