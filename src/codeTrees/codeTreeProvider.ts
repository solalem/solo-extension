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
	private templatesDirectory: string;

	constructor(
		private repository: CodeTreeRepository,
		private featureDesignRepository: FeatureDesignRepository,
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
		
		var config = await this.repository.readConfig();
		if(!config) {
			vscode.window.showInformationMessage('Cannot read solo config file');
			return;
		}

		var designs = await this.featureDesignRepository.getFeatureDesigns(config);
		let newTree = new CodeTree('', '');
		newTree.children = this.repository.buildCodeTree(this.templatesDirectory, '', config, designs);
		if (!newTree.children)
			return undefined;

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
			vscode.window.showInformationMessage('Empty workspace');
			return;
		}
		
		var config = await this.repository.readConfig();
		if(!config) {
			vscode.window.showInformationMessage('Cannot read solo config file');
			return;
		}

		const treeItem = node.tag as CodeTreeItem;
		if(!treeItem) return;
	
		let destinationFolder = workspaceFolder.uri.fsPath;

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
			vscode.window.showInformationMessage('Empty workspace');
			return;
		}
		
		var config = await this.repository.readConfig();
		if(!config) {
			vscode.window.showInformationMessage('Cannot read solo config file');
			return;
		}

		const treeItem = node.tag as CodeTreeItem;
		if(!treeItem) return;

		var design = await this.featureDesignRepository.getFeatureDesign(treeItem.designId);
		if(!design || !design.items) return;

		var item = design?.items?.find(x => x.name === treeItem.itemName);
		if(!item) return;
	
		let destinationFolder = workspaceFolder.uri.fsPath;
		if(isPreview) 
			destinationFolder = path.join(os.tmpdir(), 'solo', workspaceFolder.name, 'previews');

		this.soloOutputChannel.appendLine(`Workspace: ${destinationFolder}`);
		this.soloOutputChannel.appendLine(`Templates loacation: ${this.templatesDirectory}`);
		this.soloOutputChannel.appendLine(`Context path: ${treeItem.designId}`);

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
			
		let destinationPath = path.join(workspaceFolder.uri.fsPath, treeItem.destinationPath);
		let previewPath = path.join(destinationFolder, treeItem.destinationPath);
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
