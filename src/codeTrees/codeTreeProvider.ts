// Copied from
// https://github.com/ChaunceyKiwi/json-tree-view/blob/master/src/extension.ts
import * as json from "jsonc-parser";
import * as path from "path";
import * as vscode from "vscode";
import { CodeTreeRepository } from "./codeTreeRepository";

export class CodeTreeProvider implements vscode.TreeDataProvider<number> {
	private _onDidChangeTreeData: vscode.EventEmitter<number | null> = new vscode.EventEmitter<number | null>();
	readonly onDidChangeTreeData: vscode.Event<number | null> = this._onDidChangeTreeData.event;

	private tree: json.Node;// | undefined;
	private text: string;

	constructor(private context: vscode.ExtensionContext, private repository: CodeTreeRepository) {
		this.text = "";
		this.tree = { offset: 0, length: 0, type: 'null' };// TODO: check default
	}

	refresh(offset?: number): void {
		// TODO: reload
		if (offset) {
			this._onDidChangeTreeData.fire(offset);
		} else {
			this._onDidChangeTreeData.fire(null);// TODO: check
		}
	}

	async getChildren(offset?: number): Promise<number[]> {
		if (offset && this.tree) {
			const path = json.getLocation(this.text, offset).path;
			const node = json.findNodeAtLocation(this.tree, path);
			return Promise.resolve(this.getChildrenOffsets(node));
		} else {
			this.text = await this.repository.getCodeTree()?? "";
			this.tree = json.parseTree(this.text);
			return this.tree ? this.getChildrenOffsets(this.tree) : [];
		}
	}

	private getChildrenOffsets(node: json.Node): number[] {
		const offsets: number[] = [];
		if(!node || !node.children) 
			return offsets;

		for (const child of node.children) {
			const childPath = json.getLocation(this.text, child.offset).path;
			const childNode = json.findNodeAtLocation(this.tree, childPath);
			if (childNode) {
				offsets.push(childNode.offset);
			}
		}
		return offsets;
	}

	getTreeItem(offset: number): vscode.TreeItem {
		const notFound: vscode.TreeItem = {};

		const path = json.getLocation(this.text, offset).path;
		const valueNode = json.findNodeAtLocation(this.tree, path);
		if (valueNode) {
			let hasChildren =
				valueNode.type === "object" || valueNode.type === "array";
			let treeItem: vscode.TreeItem = new vscode.TreeItem(
				valueNode.value,
				hasChildren
					? vscode.TreeItemCollapsibleState.Collapsed
					: vscode.TreeItemCollapsibleState.None
			);
			
			treeItem.iconPath = this.getIcon(valueNode);
			treeItem.contextValue = valueNode.type;
			return treeItem;
		}
		return notFound;
	}

	private getIcon(node: json.Node): any {
		let nodeType = node.type;
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
