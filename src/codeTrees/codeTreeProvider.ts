import * as vscode from "vscode";
import * as os from "node:os";
import * as fs from 'fs';
import { CodeTreeRepository } from "./codeTreeRepository";
import { CodeTreeNode } from "./codeTreeNode";
import { CodeTree, CodeTreeItem } from "./models";
import { FeatureDesignRepository } from "../featureDesigns/featureDesignRepository";
import { Generator } from "../generators/generator";
import path = require("path");

export class CodeTreeProvider implements vscode.TreeDataProvider<CodeTreeNode> {
	private _onDidChangeTreeData: vscode.EventEmitter<CodeTreeNode | null> = new vscode.EventEmitter<CodeTreeNode | null>();
	readonly onDidChangeTreeData: vscode.Event<CodeTreeNode | null> = this._onDidChangeTreeData.event;

	private codeTree: CodeTree | undefined;
	private templateDirectory: string;

	constructor(private context: vscode.ExtensionContext, 
		private repository: CodeTreeRepository,
		private featureDesignRepository: FeatureDesignRepository,
		private soloOutputChannel: vscode.OutputChannel) {
		vscode.commands.registerCommand('codeTree.previewFile', (resource) => this.generateFile(resource));
		vscode.commands.registerCommand('codeTree.generateFile', (resource) => this.generateFile(resource, false));
		vscode.commands.registerCommand('codeTree.refresh', (resource) => this.refresh(resource));
		
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
					i.type,
					i)
			));
		} else {
			this.codeTree = await this.repository.getCodeTree();
			if(!this.codeTree) {
				var designs = await this.featureDesignRepository.getFeatureDesigns();
				this.codeTree = new CodeTree('', '');
				this.codeTree.children = await this.repository.buildCodeTree(this.templateDirectory, 'e2e', designs);
				if (!this.codeTree.children) 
					return [];

				// Save
				this.repository.save(
					this.codeTree, 
					(x: string) => this.soloOutputChannel.appendLine(x));
			}

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

	private async generateFile(node: CodeTreeNode, isPreview = true): Promise<void> {
		const workspaceFolder = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
			? vscode.workspace.workspaceFolders[0] : undefined;
		if (!workspaceFolder?.uri.path) {
			vscode.window.showInformationMessage('Empty workspace');
			return;
		}
		
		const soloPath = path.join(workspaceFolder.uri.fsPath, "design");
		if (!fs.existsSync(soloPath)) {
			vscode.window.showInformationMessage('No design folder');
			return;
		}

		//const templatesPath = nconf.get("templatesPath") ?? this.templatePath("");
		const treeItem = node.tag as CodeTreeItem;
		if(!treeItem) return;

		this.soloOutputChannel.appendLine(`Workspace: ${workspaceFolder.uri.fsPath}`);
		this.soloOutputChannel.appendLine(`Templates path: ${this.templateDirectory}`);
		this.soloOutputChannel.appendLine(`Context path: ${treeItem.designId}`);

		var context = await this.featureDesignRepository.getFeatureDesign(treeItem.designId);
		if(!context || !context.items) return;

		var item = context?.items?.find(x => x.name === treeItem.itemName);
		if(!item) return;
	
		let destinationFolder = workspaceFolder.uri.fsPath;
		if(isPreview) 
			destinationFolder = path.join(os.tmpdir(), 'solo', workspaceFolder.name, 'previews');
		
		const generator = new Generator();
		generator.generateNode(
			this.templateDirectory, 
			destinationFolder,
			treeItem, 
			item,
			context, 
			(message: string) => { 
				//Write to output.
				this.soloOutputChannel.appendLine(message);
			});
			
		let previewPath = path.join(destinationFolder, treeItem.destinationPath);
		if (fs.existsSync(previewPath))
			await vscode.window.showTextDocument(vscode.Uri.file(previewPath));
	}
}
