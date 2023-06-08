// Copied from
// https://github.com/ChaunceyKiwi/json-tree-view/blob/master/src/extension.ts
import * as json from "jsonc-parser";
import * as path from "path";
import * as vscode from "vscode";
import { ifArrayAInArrayB } from "./helpers";
import { FeatureDesignRepository } from "./featureDesignRepository";
import { FeatureDesignNode } from "./featureDesignNode";
import { FeatureDesign } from "./models";

export class FeatureDesignsProvider implements vscode.TreeDataProvider<FeatureDesignNode> {
	private _onDidChangeTreeData: vscode.EventEmitter<FeatureDesignNode | null> = new vscode.EventEmitter<FeatureDesignNode | null>();
	readonly onDidChangeTreeData: vscode.Event<FeatureDesignNode | null> = this._onDidChangeTreeData.event;

	private designs: FeatureDesign[] = [];
	private currentDesign: FeatureDesign |undefined;
	
	private tree: json.Node;
	private text: string;
	private editor: vscode.TextEditor | undefined;
	private autoRefresh: boolean;
	private error_paths: (string | number)[][] = [];

	constructor(
		private context: vscode.ExtensionContext,
		private repository: FeatureDesignRepository) {
		this.text = "";
		this.editor = vscode.window.activeTextEditor;
		this.autoRefresh = true;
		this.tree = { offset: 0, length: 0, type: 'null' };// TODO: check default
		
		vscode.window.onDidChangeActiveTextEditor(() =>
			this.onActiveEditorChanged()
		);
		vscode.workspace.onDidChangeTextDocument(e => this.onDocumentChanged(e));
		vscode.workspace.onDidSaveTextDocument(() => this.onDocumentSaved());
		vscode.workspace.onDidChangeConfiguration(() => {
			this.autoRefresh = vscode.workspace
				.getConfiguration("jsonTreeView")
				.get("autorefresh") ?? true;
		});
		this.onActiveEditorChanged();
	}

	refresh(offset?: FeatureDesignNode): void {
		this.updateErrorPath();
		this.parseTree();
		if (offset) {
			this._onDidChangeTreeData.fire(offset);
		} else {
			this._onDidChangeTreeData.fire(null);// TODO: check
		}
	}

	reveal(node: FeatureDesignNode): void {
		if(!this.editor || !node.jsonOffset) return;

		const path = json.getLocation(this.text, node.jsonOffset).path;
		let propertyNode = json.findNodeAtLocation(this.tree, path);
		const range = new vscode.Range(
			this.editor.document.positionAt(propertyNode.offset),
			this.editor.document.positionAt(propertyNode.offset + propertyNode.length)
		);

		this.editor.selection = new vscode.Selection(range.start, range.end);

		// Center the method in the document
		this.editor.revealRange(range);

		// Swap the focus to the editor
		vscode.window.showTextDocument(
			this.editor.document,
			this.editor.viewColumn,
			false
		);
	}

	revealWithKey(node: FeatureDesignNode): void {
		if(!this.editor || !node.jsonOffset) return;
	
		const path = json.getLocation(this.text, node.jsonOffset).path;
		let propertyNode = json.findNodeAtLocation(this.tree, path);

		let inverseOffset = 0;
		if (propertyNode.parent?.type !== "array" && propertyNode.parent?.children) {
			let parentKeyLength = propertyNode.parent.children[0].value.length;
			inverseOffset = parentKeyLength + 4; // including 2("), 1(:), and 1 space
		}

		const range = new vscode.Range(
			this.editor.document.positionAt(propertyNode.offset - inverseOffset),
			this.editor.document.positionAt(propertyNode.offset + propertyNode.length)
		);

		this.editor.selection = new vscode.Selection(range.start, range.end);

		if (propertyNode.type !== "object") {
			// Center the method in the document
			this.editor.revealRange(range);
		}

		// Swap the focus to the editor
		vscode.window.showTextDocument(
			this.editor.document,
			this.editor.viewColumn,
			false
		);
	}

	private onActiveEditorChanged(): void {
		if (vscode.window.activeTextEditor) {
			if (vscode.window.activeTextEditor.document.uri.scheme === "file") {
				const enabled =
					vscode.window.activeTextEditor.document.languageId === "json" ||
					vscode.window.activeTextEditor.document.languageId === "jsonc";
				vscode.commands.executeCommand(
					"setContext",
					"jsonTreeViewEnabled",
					enabled
				);
				if (enabled) {
					this.refresh();
				}
			}
		} else {
			vscode.commands.executeCommand(
				"setContext",
				"jsonTreeViewEnabled",
				false
			);
		}
	}

	private onDocumentChanged(changeEvent: vscode.TextDocumentChangeEvent): void {
		if (
			this.autoRefresh &&
			this.editor &&
			changeEvent.document.uri.toString() ===
			this.editor.document.uri.toString()
		) {
			for (const change of changeEvent.contentChanges) {
				const path = json.getLocation(
					this.text,
					this.editor.document.offsetAt(change.range.start)
				).path;
				path.pop();
				const node = path.length
					? json.findNodeAtLocation(this.tree, path)
					: void 0;
				this.parseTree();
				this._onDidChangeTreeData.fire(node ? new FeatureDesignNode("todo:", "todo:", undefined, node.offset, vscode.TreeItemCollapsibleState.None) : null);
			}
		}
	}

	private onDocumentSaved(): void {
		this.refresh();
	}

	private parseTree(): void {
		this.text = "";
		this.tree = { offset: 0, length: 0, type: 'null' };
		this.editor = vscode.window.activeTextEditor;
		if (this.editor && this.editor.document) {
			this.text = this.editor.document.getText();
			this.tree = json.parseTree(this.text);
		}
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
		
		if (!this.editor || !this.editor.document) 
			return Promise.resolve([]);
		var path = this.editor.document.uri.fsPath;
		if(!path.includes(".feature.json"))
			return Promise.resolve([]);
		this.currentDesign = this.designs.find(x => x.fsPath === path);
		if (!this.currentDesign) {
			return Promise.resolve([]);
		} 

		if (designNode.jsonOffset) {
			const path = json.getLocation(this.text, designNode.jsonOffset).path;
			const node = json.findNodeAtLocation(this.tree, path);
			return this.getChildrenOffsets(node);
		} else {
			return Promise.resolve(
				this.tree ? this.getChildrenOffsets(this.tree) : []
			);
		}
	}

	private getChildrenOffsets(node: json.Node): FeatureDesignNode[] {
		const offsets: FeatureDesignNode[] = [];
		if(!node || !node.children) 
			return offsets;
		for (const child of node.children) {
			const childPath = json.getLocation(this.text, child.offset).path;
			const childNode = json.findNodeAtLocation(this.tree, childPath);
			if (childNode) {
				offsets.push(new FeatureDesignNode("todo:name", "json", undefined, childNode.offset, vscode.TreeItemCollapsibleState.Collapsed));
			}
		}
		return offsets;
	}

	getTreeItem(designNode: FeatureDesignNode): vscode.TreeItem {
		const notFound: vscode.TreeItem = { label: "todo:none" };
		if(!this.editor || !designNode) return notFound;

		if (designNode.jsonFilePath) {
			let treeItem: vscode.TreeItem = new vscode.TreeItem(
				designNode.label,
				vscode.TreeItemCollapsibleState.Collapsed
			);
			treeItem.command = { command: 'featureDesigns.openFile', title: "Open File", arguments: [vscode.Uri.file(designNode.jsonFilePath)], };
			treeItem.contextValue = 'design';
			return treeItem;
		}

		if(!this.editor || !designNode.jsonOffset) return notFound;
		const path = json.getLocation(this.text, designNode.jsonOffset).path;
		const valueNode = json.findNodeAtLocation(this.tree, path);
		if (valueNode) {
			let hasChildren =
				valueNode.type === "object" || valueNode.type === "array";
			let treeItem: vscode.TreeItem = new vscode.TreeItem(
				this.getLabel(valueNode),
				hasChildren
					? vscode.TreeItemCollapsibleState.Collapsed
					: vscode.TreeItemCollapsibleState.None
			);

			if (!hasChildren) {
				treeItem.command = {
					command: "extension.openJsonSelection",
					title: "",
					arguments: [
						new vscode.Range(
							this.editor.document.positionAt(valueNode.offset),
							this.editor.document.positionAt(
								valueNode.offset + valueNode.length
							)
						)
					]
				};
			}

			/* If tree item's path is in error paths, assign it an error icon */
			if (ifArrayAInArrayB(path, this.error_paths)) {
				treeItem.iconPath = this.getErrorIcon();
			} else {
				treeItem.iconPath = this.getIcon(valueNode);
			}

			treeItem.contextValue = valueNode.type;
			return treeItem;
		}
		return notFound;
	}

	select(range: vscode.Range) {
		if(!this.editor) return null;
	
		this.editor.selection = new vscode.Selection(range.start, range.end);

		// Center the method in the document
		this.editor.revealRange(range, vscode.TextEditorRevealType.InCenter);

		// Swap the focus to the editor
		vscode.window.showTextDocument(
			this.editor.document,
			this.editor.viewColumn,
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

	private getErrorIcon(): any {
		return {
			light: this.context.asAbsolutePath(
				path.join("resources", "light", "error.svg")
			),
			dark: this.context.asAbsolutePath(
				path.join("resources", "dark", "error.svg")
			)
		};
	}

	private getLabel(node: json.Node): string {
		if(!this.editor) return "";
		if(!node) return "";

		if (node.parent && node.parent.type === "array") {
	
			let parentKey = node.parent.parent?.children ? node.parent.parent.children[0].value.toString(): "";
			let config = vscode.workspace.getConfiguration().jsonTreeView;

			if (node.children &&
				config.customizedViewActivated &&
				config.customizedViewMapping !== undefined &&
				parentKey in config.customizedViewMapping
			) {
				let key: string = config.customizedViewMapping[parentKey];
				for (let i = 0; i < node.children.length; i++) {
					if (!node.children[i]) return "";

					const grandChildren = node.children[i].children;
					if (!grandChildren) return "";

					if (node.children && 
						grandChildren[0].value === key) {
						return grandChildren[1].value.toString();
					}
				}
			} else {
				if (!node.parent.children) return "";
				let prefix = parentKey + " " + node.parent.children?.indexOf(node).toString();

				if (node.type === "object") {
					return prefix;
				}
				if (node.type === "array") {
					return prefix + " [" + node.children?.length + "]";
				}

				return node.value.toString();
			}
		} else {
			if (!node.parent?.children) return "";
			const property = node.parent.children[0].value.toString();
			if (node.type === "array" || node.type === "object") {
				if (node.type === "object") {
					return property;
				}
				if (node.type === "array") {
					return property + " [" + node.children?.length + "]";
				}
			}
			const value = this.editor.document.getText(
				new vscode.Range(
					this.editor.document.positionAt(node.offset),
					this.editor.document.positionAt(node.offset + node.length)
				)
			);
			return `${property}: ${value}`;
		}

		return "";
	}

	private updateErrorPath() {
		//if(!vscode.window.activeTextEditor) return;

		this.error_paths = [];

		let diagnostics = vscode.languages.getDiagnostics();
		for (let i = 0; i < diagnostics.length; i++) {
			if (
				diagnostics[i][0]["fsPath"] ===
				vscode.window.activeTextEditor?.document.fileName
			) {
				let error = diagnostics[i][1];
				this.error_paths = error.map(
					(x: any) => {
						if(!vscode.window.activeTextEditor || !this.editor) return [];

						return json.getLocation(
							vscode.window.activeTextEditor.document.getText(),
							this.editor.document.offsetAt(x["range"]["end"])
						).path
					}
				);
			}
		}
	}
}
