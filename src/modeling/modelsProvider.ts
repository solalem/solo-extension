import * as vscode from "vscode";
import { ModelRepository } from "./modelRepository";
import { ModelNode } from "./modelNode";
import { Model } from "./models";
import { CodeTreeRepository } from "../codeTrees/codeTreeRepository";

export class ModelsProvider implements vscode.TreeDataProvider<ModelNode> {
	private _onDidChangeTreeData: vscode.EventEmitter<ModelNode | null> = new vscode.EventEmitter<ModelNode | null>();
	readonly onDidChangeTreeData: vscode.Event<ModelNode | null> = this._onDidChangeTreeData.event;

	private models: Model[] = [];

	constructor(
		private context: vscode.ExtensionContext,
		private repository: ModelRepository,
		private codeTreeRepository: CodeTreeRepository) {
		vscode.workspace.onDidChangeTextDocument(e => this.onDocumentChanged(e));
		vscode.workspace.onDidSaveTextDocument((e) => this.onDocumentSaved(e));
		
		vscode.commands.registerCommand('modeling.refresh', (uri) => this.refresh());
		vscode.commands.registerCommand('modeling.openFile', (uri) => this.openFile(uri));
		vscode.commands.registerCommand('modeling.addDesign', () => vscode.window.showInformationMessage(`Successfully called add design.`));
		vscode.commands.registerCommand('modeling.deleteDesign', (design: Model) => vscode.window.showInformationMessage(`Successfully called delete design on ${design.name}.`));
		vscode.commands.registerCommand('modeling.openInDesigner', () => vscode.window.showInformationMessage(`Successfully called open in designer`));
		vscode.commands.registerCommand('modeling.editItem', (node: ModelNode) => this.editItem(node));
		vscode.commands.registerCommand('modeling.duplicateItem', (node: ModelNode) => this.duplicateItem(node));
		vscode.commands.registerCommand('modeling.deleteItem', (node: ModelNode) => this.deleteItem(node));
	}

	refresh(): void {
		this._onDidChangeTreeData.fire(null);
	}

	private onDocumentChanged(changeEvent: vscode.TextDocumentChangeEvent): void {
		// const currentModel = this.models.find(x => x.fsPath === changeEvent.document.uri.fsPath);
		// this.refresh();
	}

	private onDocumentSaved(e: vscode.TextDocument): void {
		this.refresh();
	}

	async getChildren(designNode?: ModelNode): Promise<ModelNode[]> {

		const config = await this.codeTreeRepository.readConfig();
		if(!config) {
			vscode.window.showInformationMessage('Cannot read solo config file');
			return Promise.resolve([]);
		}

		if(!designNode) {
			this.models = await this.repository.getModels(config);
			return this.models.map((i) => (
					new ModelNode(
						i.id,
						i.name,
						"design",
						i.id,
						i.fsPath)
				));
		}

		const currentModel = this.models.find(x => x.id === designNode.modelId);
		if (!currentModel|| !currentModel.entities)
			return Promise.resolve([]);

		if (designNode.type === 'design') { // aggregate roots only
			return currentModel.entities
				.filter(i => i.aggregate === i.name)
				.map((i) => (
					new ModelNode(
						i.name + " (aggregate)",
						i.name,
						"aggregate",
						currentModel.id,
						undefined)
				));
		}
		else if (designNode.type === 'aggregate') { // entities in the aggregate
			return currentModel.entities
				.filter(i => i.aggregate+ " (aggregate)" === designNode.id)
				.map((i) => (
					new ModelNode(
						i.name,
						i.name,
						"item",
						currentModel.id,
						undefined)
				));
		}

		return Promise.resolve([]);
	}

	getTreeItem(designNode: ModelNode): vscode.TreeItem {
		// const notFound: vscode.TreeItem = { label: "todo:none" };
		return designNode;
	}

	private editItem(designNode: ModelNode) {
		const editor = vscode.window.activeTextEditor;
		if(!editor) return null;

		const currentModel = this.models.find(x => x.id === designNode.modelId);
		if (!currentModel|| !currentModel.entities)
			return Promise.resolve([]);

		this.openFile(vscode.Uri.file(currentModel.fsPath));

		const index = currentModel.entities?.findIndex(x => x.name === designNode.label) ?? 0;
		// TODO: this is just a hack. Find a way of getting node Position
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
	
	private duplicateItem(modelNode: ModelNode): void {
		if (modelNode.id && modelNode.modelId) {
			this.repository.duplicateItem(modelNode.id, modelNode.modelId);
			this.refresh();
		}
	}
	
	private deleteItem(modelNode: ModelNode): void {
		if (modelNode.id && modelNode.modelId) {
			this.repository.deleteItem(modelNode.id, modelNode.modelId);
			this.refresh();
		}
	}

	private openFile(resource: vscode.Uri): void {
		vscode.window.showTextDocument(resource);
	}

}
