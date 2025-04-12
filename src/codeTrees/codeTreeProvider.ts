import * as vscode from "vscode";
import * as os from "node:os";
import * as fs from 'fs';
import { CodeTreeRepository } from "./codeTreeRepository";
import { CodeTreeNode } from "./codeTreeNode";
import { CodeTree, CodeTreeItem } from "./models";
import { ModelRepository } from "../modeling/modelRepository";
import { Generator } from "../generators/generator";
import path = require("path");

export class CodeTreeProvider implements vscode.TreeDataProvider<CodeTreeNode> {
	private _onDidChangeTreeData: vscode.EventEmitter<CodeTreeNode | null> = new vscode.EventEmitter<CodeTreeNode | null>();
	readonly onDidChangeTreeData: vscode.Event<CodeTreeNode | null> = this._onDidChangeTreeData.event;

	private codeTree: CodeTree | undefined;
	private templatesDirectory: string;

	constructor(
		private repository: CodeTreeRepository,
		private featureDesignRepository: ModelRepository,
		private soloOutputChannel: vscode.OutputChannel) {
		vscode.commands.registerCommand('codeTree.previewFile', (node) => this.generateFile(node));
		vscode.commands.registerCommand('codeTree.generateFile', (node) => this.generateFile(node, false));
		vscode.commands.registerCommand('codeTree.generateFolder', (node) => this.generateFolder(node));
		vscode.commands.registerCommand('codeTree.refresh', () => this.refresh());
		
		this.templatesDirectory = vscode.workspace.getConfiguration('solo').get('templatesDirectory', './');
		vscode.workspace.onDidChangeConfiguration(() => {
			this.templatesDirectory = vscode.workspace.getConfiguration('solo').get('templatesDirectory', './');
		});
	}

	async refresh(): Promise<void> {
		this.codeTree = await this.rebuildCodeTree();
		// vscode.window.showInformationMessage('Got new tree');
		this._onDidChangeTreeData.fire(null);
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
			this.codeTree = 
				await this.repository.getCodeTree() ?? 
				await this.rebuildCodeTree();

			if (!this.codeTree) return [];

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

	private async rebuildCodeTree(): Promise<CodeTree | undefined> {
		
		const config = await this.repository.readConfig();
		if(!config) {
			vscode.window.showErrorMessage('Cannot read solo config file');
			return;
		}

		const designs = await this.featureDesignRepository.getModels(config);

		const newTree = new CodeTree('', '');
		newTree.children = this.repository.buildCodeTree(this.templatesDirectory, config, designs);
		if (!newTree.children){
			vscode.window.showInformationMessage(`Tree building resulted empty.`);
			return undefined;
		}
		// vscode.window.showInformationMessage(`Tree building resulted ${newTree.children.length} items.`);
		
		// Save
		this.repository.save(
			newTree, 
			(x: string) => this.soloOutputChannel.appendLine(x));
		return newTree;
	}
	
	private async generateFolder(node: CodeTreeNode): Promise<void> {
		const workspaceFolder = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
			? vscode.workspace.workspaceFolders[0] : undefined;
		if (!workspaceFolder?.uri.path) {
			vscode.window.showErrorMessage('Empty workspace');
			return;
		}
		
		const config = await this.repository.readConfig();
		if(!config) {
			vscode.window.showErrorMessage('Cannot read solo config file');
			return;
		}

		const treeItem = node.tag as CodeTreeItem;
		if(!treeItem) return;
	
		const destinationFolder = workspaceFolder.uri.fsPath;

		this.soloOutputChannel.appendLine(`Workspace: ${destinationFolder}`);
		this.soloOutputChannel.appendLine(`Templates loacation: ${this.templatesDirectory}`);

		const generator = new Generator(this.featureDesignRepository);
		generator.generateFolder(
			this.templatesDirectory, 
			destinationFolder,
			treeItem, 
			(message: string) => { 
				this.soloOutputChannel.appendLine(message);
			});
	}

	private async generateFile(node: CodeTreeNode, isPreview = true): Promise<void> {
		const workspaceFolder = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
			? vscode.workspace.workspaceFolders[0] : undefined;
		if (!workspaceFolder?.uri.path) {
			vscode.window.showErrorMessage('Empty workspace');
			return;
		}
		
		const config = await this.repository.readConfig();
		if(!config) {
			vscode.window.showErrorMessage('Cannot read solo config file');
			return;
		}

		const treeItem = node.tag as CodeTreeItem;
		if(!treeItem) return;

		const design = await this.featureDesignRepository.getModel(treeItem.modelId);
		if(!design || !design.entities) return;

		const item = design?.entities?.find(x => x.name === treeItem.itemName);
		if(!item) return;
	
		let destinationFolder = workspaceFolder.uri.fsPath;
		if(isPreview) 
			destinationFolder = path.join(os.tmpdir(), 'solo', workspaceFolder.name, 'previews');

		this.soloOutputChannel.appendLine(`Workspace: ${destinationFolder}`);
		this.soloOutputChannel.appendLine(`Templates loacation: ${this.templatesDirectory}`);
		this.soloOutputChannel.appendLine(`Model path: ${treeItem.modelId}`);

		const generator = new Generator(this.featureDesignRepository);
		generator.generateNode(
			this.templatesDirectory, 
			destinationFolder,
			treeItem, 
			item,
			design, 
			(message: string) => { 
				this.soloOutputChannel.appendLine(message);
			});
			
		const destinationPath = path.join(workspaceFolder.uri.fsPath, treeItem.destinationPath);
		const previewPath = path.join(destinationFolder, treeItem.destinationPath);
		if (fs.existsSync(previewPath))
		{
			// Compare if destination has file
			if (fs.existsSync(destinationPath))
				await vscode.commands.executeCommand("vscode.diff", vscode.Uri.file(destinationPath), vscode.Uri.file(previewPath));
			else
				await vscode.window.showTextDocument(vscode.Uri.file(previewPath));
		}
	}
}
