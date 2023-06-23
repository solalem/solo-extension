import * as vscode from "vscode";
import { FeatureDesignRepository } from "./featureDesignRepository";
import { FeatureDesignNode } from "./featureDesignNode";
import { FeatureDesign } from "./models";

export class FeatureDesignsProvider implements vscode.TreeDataProvider<FeatureDesignNode> {
	private _onDidChangeTreeData: vscode.EventEmitter<FeatureDesignNode | null> = new vscode.EventEmitter<FeatureDesignNode | null>();
	readonly onDidChangeTreeData: vscode.Event<FeatureDesignNode | null> = this._onDidChangeTreeData.event;

	private designs: FeatureDesign[] = [];

	constructor(
		private context: vscode.ExtensionContext,
		private repository: FeatureDesignRepository) {
		vscode.workspace.onDidChangeTextDocument(e => this.onDocumentChanged(e));
		vscode.workspace.onDidSaveTextDocument((e) => this.onDocumentSaved(e));
		
		vscode.commands.registerCommand('featureDesigns.openFile', (resource) => this.openResource(resource));
		vscode.commands.registerCommand('featureDesigns.addEntry', () => vscode.window.showInformationMessage(`Successfully called add entry.`));
		vscode.commands.registerCommand('featureDesigns.editEntry', (node: FeatureDesignNode) => vscode.window.showInformationMessage(`Successfully called edit entry on ${node.label}.`));
		vscode.commands.registerCommand('featureDesigns.deleteEntry', (node: FeatureDesignNode) => vscode.window.showInformationMessage(`Successfully called delete entry on ${node.label}.`));
	}

	refresh(featureDesignNode?: FeatureDesignNode): void {
		if (featureDesignNode) {
			this._onDidChangeTreeData.fire(featureDesignNode);
		} else {
			this._onDidChangeTreeData.fire(null);// TODO: check
		}
	}

	private onDocumentChanged(changeEvent: vscode.TextDocumentChangeEvent): void {
		// const currentDesign = this.designs.find(x => x.fsPath === changeEvent.document.uri.fsPath);
		// this.refresh();
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
						i.id)
				));
		}

		const currentDesign = this.designs.find(x => x.id === designNode.filePath);
		if (!currentDesign|| !currentDesign.items)
		 	return Promise.resolve([]);

		if (designNode.type === 'design') {
			return currentDesign.items.map((i) => (
				new FeatureDesignNode(
					i.name,
					"item",
					undefined)
			));
		}

		return Promise.resolve([]);
	}

	getTreeItem(designNode: FeatureDesignNode): vscode.TreeItem {
		// const notFound: vscode.TreeItem = { label: "todo:none" };
		return designNode;
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
	
	private openResource(resource: vscode.Uri): void {
		vscode.window.showTextDocument(resource);
	}

}
