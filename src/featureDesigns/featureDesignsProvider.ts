import * as json from "jsonc-parser";
import * as path from "path";
import * as vscode from "vscode";
import { FeatureDesignRepository } from "./featureDesignRepository";
import { FeatureDesignNode } from "./featureDesignNode";
import { FeatureDesign } from "./models";

export class FeatureDesignsProvider implements vscode.TreeDataProvider<FeatureDesignNode> {
	private _onDidChangeTreeData: vscode.EventEmitter<FeatureDesignNode | null> = new vscode.EventEmitter<FeatureDesignNode | null>();
	readonly onDidChangeTreeData: vscode.Event<FeatureDesignNode | null> = this._onDidChangeTreeData.event;

	private designs: FeatureDesign[] = [];
	private text: string;

	constructor(
		private context: vscode.ExtensionContext,
		private repository: FeatureDesignRepository) {
		this.text = "";
		vscode.workspace.onDidChangeTextDocument(e => this.onDocumentChanged(e));
		vscode.workspace.onDidSaveTextDocument((e) => this.onDocumentSaved(e));
	}

	refresh(featureDesignNode?: FeatureDesignNode): void {
		if (featureDesignNode) {
			this._onDidChangeTreeData.fire(featureDesignNode);
		} else {
			this._onDidChangeTreeData.fire(null);// TODO: check
		}
	}

	private onDocumentChanged(changeEvent: vscode.TextDocumentChangeEvent): void {
		const currentDesign = this.designs.find(x => x.fsPath === changeEvent.document.uri.fsPath);
	}

	private onDocumentSaved(e: vscode.TextDocument): void {
		this.refresh();
	}

	async getChildren(designNode?: FeatureDesignNode): Promise<FeatureDesignNode[]> {
		if(!designNode) {
			this.designs = await this.repository.getFeatureDesigns();
			return this.designs.map((i) => (
					new FeatureDesignNode(
						i.name,
						"design",
						i.fsPath,
						undefined,
						vscode.TreeItemCollapsibleState.Collapsed)
				));
		}

		const currentDesign = this.designs.find(x => x.fsPath === designNode.jsonFilePath);
		if (!currentDesign|| !currentDesign.items)
		 	return Promise.resolve([]);

		if (designNode.type === 'design') {
			return currentDesign.items.map((i) => (
				new FeatureDesignNode(
					i.name,
					"item",
					undefined,//currentDesign.fsPath,
					undefined,
					vscode.TreeItemCollapsibleState.None)
			));
		}

		return Promise.resolve([]);
	}

	getTreeItem(designNode: FeatureDesignNode): vscode.TreeItem {
		const notFound: vscode.TreeItem = { label: "todo:none" };
		if(!designNode) return notFound;

		if (designNode.jsonFilePath) {
			let treeItem: vscode.TreeItem = new vscode.TreeItem(
				designNode.label,
				vscode.TreeItemCollapsibleState.Collapsed
			);
			treeItem.command = { command: 'featureDesigns.openFile', title: "Open File", arguments: [vscode.Uri.file(designNode.jsonFilePath)], };
			treeItem.contextValue = 'design';
			return treeItem;
		}

		if (designNode.type === 'item') {
			let treeItem: vscode.TreeItem = new vscode.TreeItem(
				designNode.label,
				vscode.TreeItemCollapsibleState.None
			);
			treeItem.contextValue = 'item';
			return treeItem;
		}
		return notFound;
	}

	select(range: vscode.Range) {
		const editor = vscode.window.activeTextEditor;
		if(!editor) return null;

		editor.selection = new vscode.Selection(range.start, range.end);

		// Center the method in the document
		editor.revealRange(range, vscode.TextEditorRevealType.InCenter);

		// Swap the focus to the editor
		vscode.window.showTextDocument(
			editor.document,
			editor.viewColumn,
			false
		);
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
