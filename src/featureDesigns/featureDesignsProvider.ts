import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { FeatureDesignNode } from './featureDesignNode';
import { FileStat } from '../fileSystem/fileStat';
import { _ } from '../fileSystem/fileUtilities';

export class FeatureDesignsProvider implements vscode.TreeDataProvider<FeatureDesignNode> {

	private _onDidChangeTreeData: vscode.EventEmitter<FeatureDesignNode | undefined | void> = new vscode.EventEmitter<FeatureDesignNode | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<FeatureDesignNode | undefined | void> = this._onDidChangeTreeData.event;

	constructor() {
		//this._onDidChangeFile = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: FeatureDesignNode): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: FeatureDesignNode): Promise<FeatureDesignNode[]> {
		const workspaceRoot = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
			? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
		if (!workspaceRoot) {
			vscode.window.showInformationMessage('Empty workspace');
			return Promise.resolve([]);
		}

		const soloPath = path.join(workspaceRoot, ".solo");
		if (!_.exists(soloPath)) {
			vscode.window.showInformationMessage('No .solo folder');
			return Promise.resolve([]);
		}

		if (element) {
			return Promise.resolve(this.getItemsInDesign(path.join(soloPath, element.label)));
		} else {
			var files = await this.readDirectory(soloPath);
			return files.map(([name, type]) => (
				new FeatureDesignNode(name, "design", "version", vscode.TreeItemCollapsibleState.Collapsed)
			));
		}

	}

	/**
	 * Given the path to package.json, read all its dependencies and devDependencies.
	 */
	private getItemsInDesign(jsonPath: string): FeatureDesignNode[] {
		const workspaceRoot = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
			? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

		if (this.pathExists(jsonPath) && workspaceRoot) {
			const designJson = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

			return designJson.items.map((i: { name: string; }) => 
				new FeatureDesignNode(i.name, "item", "version", vscode.TreeItemCollapsibleState.Collapsed));
		} else {
			return [];
		}
	}

	async _stat(path: string): Promise<vscode.FileStat> {
		return new FileStat(await _.stat(path));
	}
	
	readDirectory(uri: string): [string, vscode.FileType][] | Thenable<[string, vscode.FileType][]> {
		return this._readDirectory(uri);
	}

	async _readDirectory(uri: string): Promise<[string, vscode.FileType][]> {
		const children = await _.readdir(uri);

		const result: [string, vscode.FileType][] = [];
		for (let i = 0; i < children.length; i++) {
			const child = children[i];
			const stat = await this._stat(path.join(uri, child));
			result.push([child, stat.type]);
		}

		return Promise.resolve(result);
	}

	private pathExists(p: string): boolean {
		try {
			fs.accessSync(p);
		} catch (err) {
			return false;
		}

		return true;
	}
}
