import * as vscode from "vscode";
import { FeatureDesignRepository } from "./featureDesignRepository";
import { FeatureDesignNode } from "./featureDesignNode";
import { FeatureDesign } from "./models";
import { CodeTreeRepository } from "../codeTrees/codeTreeRepository";

export class FeatureDesignsProvider implements vscode.TreeDataProvider<FeatureDesignNode> {
	private _onDidChangeTreeData: vscode.EventEmitter<FeatureDesignNode | null> = new vscode.EventEmitter<FeatureDesignNode | null>();
	readonly onDidChangeTreeData: vscode.Event<FeatureDesignNode | null> = this._onDidChangeTreeData.event;

	private designs: FeatureDesign[] = [];

	constructor(
		private context: vscode.ExtensionContext,
		private repository: FeatureDesignRepository,
		private codeTreeRepository: CodeTreeRepository) {
		vscode.workspace.onDidChangeTextDocument(e => this.onDocumentChanged(e));
		vscode.workspace.onDidSaveTextDocument((e) => this.onDocumentSaved(e));
		
		vscode.commands.registerCommand('featureDesigns.refresh', (uri) => this.refresh());
		vscode.commands.registerCommand('featureDesigns.openFile', (uri) => this.openFile(uri));
		vscode.commands.registerCommand('featureDesigns.addDesign', () => vscode.window.showInformationMessage(`Successfully called add design.`));
		vscode.commands.registerCommand('featureDesigns.deleteDesign', (design: FeatureDesign) => vscode.window.showInformationMessage(`Successfully called delete design on ${design.name}.`));
		vscode.commands.registerCommand('featureDesigns.openInDesigner', () => vscode.window.showInformationMessage(`Successfully called open in designer`));
		vscode.commands.registerCommand('featureDesigns.editItem', (node: FeatureDesignNode) => this.editItem(node));
		vscode.commands.registerCommand('featureDesigns.duplicateItem', (node: FeatureDesignNode) => this.duplicateItem(node));
		vscode.commands.registerCommand('featureDesigns.deleteItem', (node: FeatureDesignNode) => this.deleteItem(node));
	}

	refresh(): void {
		this._onDidChangeTreeData.fire(null);
	}

	private onDocumentChanged(changeEvent: vscode.TextDocumentChangeEvent): void {
		// const currentDesign = this.designs.find(x => x.fsPath === changeEvent.document.uri.fsPath);
		// this.refresh();
	}

	private onDocumentSaved(e: vscode.TextDocument): void {
		this.refresh();
	}

	async getChildren(designNode?: FeatureDesignNode): Promise<FeatureDesignNode[]> {

		const config = await this.codeTreeRepository.readConfig();
		if(!config) {
			vscode.window.showInformationMessage('Cannot read solo config file');
			return Promise.resolve([]);
		}

		if(!designNode) {
			this.designs = await this.repository.getFeatureDesigns(config);
			return this.designs.map((i) => (
					new FeatureDesignNode(
						i.id,
						i.name,
						"design",
						i.id,
						i.fsPath)
				));
		}

		const currentDesign = this.designs.find(x => x.id === designNode.designId);
		if (!currentDesign|| !currentDesign.items)
			return Promise.resolve([]);

		if (designNode.type === 'design') {
			return currentDesign.items.map((i) => (
				new FeatureDesignNode(
					i.name,
					i.name,
					"item",
					currentDesign.id,
					undefined)
			));
		}

		return Promise.resolve([]);
	}

	getTreeItem(designNode: FeatureDesignNode): vscode.TreeItem {
		// const notFound: vscode.TreeItem = { label: "todo:none" };
		return designNode;
	}

	private editItem(designNode: FeatureDesignNode) {
		const editor = vscode.window.activeTextEditor;
		if(!editor) return null;

		const currentDesign = this.designs.find(x => x.id === designNode.designId);
		if (!currentDesign|| !currentDesign.items)
			return Promise.resolve([]);

		this.openFile(vscode.Uri.file(currentDesign.fsPath));

		const index = currentDesign.items?.findIndex(x => x.name === designNode.label) ?? 0;
		// TODO: this is just a hack. Find a way og getting node Position
        const range = new vscode.Range(new vscode.Position(7 + index * 3, 0), new vscode.Position(7 + index * 3, 0));
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
	
	private duplicateItem(featureDesignNode: FeatureDesignNode): void {
		if (featureDesignNode.id && featureDesignNode.designId) {
			this.repository.duplicateItem(featureDesignNode.id, featureDesignNode.designId);
			this.refresh();
		}
	}
	
	private deleteItem(featureDesignNode: FeatureDesignNode): void {
		if (featureDesignNode.id && featureDesignNode.designId) {
			this.repository.deleteItem(featureDesignNode.id, featureDesignNode.designId);
			this.refresh();
		}
	}

	private openFile(resource: vscode.Uri): void {
		vscode.window.showTextDocument(resource);
	}

}
