import * as vscode from "vscode";
import { CodeTreeRepository } from "./codeTreeRepository";
import { CodeTreeNode } from "./codeTreeNode";
import { CodeTree, CodeTreeItem } from "./models";
import { FeatureDesignRepository } from "../featureDesigns/featureDesignRepository";
import { generate, generateNode } from "../generator";
import path = require("path");
import { _ } from "../fileSystem/fileUtilities";

export class CodeTreeProvider implements vscode.TreeDataProvider<CodeTreeNode> {
	private _onDidChangeTreeData: vscode.EventEmitter<CodeTreeNode | null> = new vscode.EventEmitter<CodeTreeNode | null>();
	readonly onDidChangeTreeData: vscode.Event<CodeTreeNode | null> = this._onDidChangeTreeData.event;

	private codeTree: CodeTree | undefined;
	private templateDirectory: string;

	constructor(private context: vscode.ExtensionContext, 
		private repository: CodeTreeRepository,
		private featureDesignRepository: FeatureDesignRepository,
		private soloOutputChannel: vscode.OutputChannel) {
		vscode.commands.registerCommand('codeTree.previewFile', (resource) => this.previewFile(resource));
		
		this.templateDirectory = vscode.workspace.getConfiguration('solo').get('templateDirectory', './');
		vscode.workspace.onDidChangeConfiguration(() => {
			this.templateDirectory = vscode.workspace.getConfiguration('solo').get('templateDirectory', './');
		});
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
					i.children ? 'folder': 'file',
					i)
			));
		} else {
			this.codeTree = await this.repository.getCodeTree();
			if (!this.codeTree || !this.codeTree.children) 
				return [];

			return this.codeTree.children.map((i) => (
				new CodeTreeNode(
					i.name, 
					i.children ? 'folder': 'file',
					i)
			));
		}
	}

	getTreeItem(codeTreeNode: CodeTreeNode): vscode.TreeItem {
		return codeTreeNode;
	}

	private async previewFile(node: CodeTreeNode): Promise<void> {
		const workspaceRoot = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
			? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
		if (!workspaceRoot) {
			vscode.window.showInformationMessage('Empty workspace');
			return;
		}
		
		const soloPath = path.join(workspaceRoot, ".solo");
		if (!_.exists(soloPath)) {
			vscode.window.showInformationMessage('No .solo folder');
			return;
		}

		//const templatesPath = nconf.get("templatesPath") ?? this.templatePath("");
		const treeItem = node.tag as CodeTreeItem;
		if(!treeItem) return;

		this.soloOutputChannel.appendLine(`Workspace: ${workspaceRoot}`);
		this.soloOutputChannel.appendLine(`Templates path: ${this.templateDirectory}`);
		this.soloOutputChannel.appendLine(`Context path: ${treeItem.designName}`);

		var context = await this.featureDesignRepository.getFeatureDesign(treeItem.designName);
		if(!context || !context.items) return;

		var item = context?.items?.find(x => x.name === treeItem.itemName);
		if(!item) return;

		generateNode(
			this.templateDirectory, 
			path.join(soloPath, 'previews'),
			treeItem, 
			item,
			context, 
			(message: string) => { 
				//Write to output.
				this.soloOutputChannel.appendLine(message);
			});
			
		const previewPath = vscode.Uri.file(path.join(soloPath, 'previews', treeItem.destinationPath));
		await vscode.window.showTextDocument(previewPath);
	}
}
