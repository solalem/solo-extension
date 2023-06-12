import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { FileStat } from '../fileSystem/fileStat';
import { _ } from '../fileSystem/fileUtilities';
import { FeatureDesign, FeatureDesignItem } from './models';

export class FeatureDesignRepository {

	async getFeatureDesigns(): Promise<FeatureDesign[]> {
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

		var files = await this.readDirectory(soloPath);
		return files.filter(([fsPath]) => 
			fsPath
			.includes(".feature.json"))
			.map(([name, type, fsPath]) => {
				let design = new FeatureDesign(name, "description", fsPath, undefined);
				this.getItemsInDesign(name)
				.then((items) => {
					design.items = items;
				}); 
				return design;
			});
	}

	public async getDesignText(designName: string): Promise<string | undefined> {
		const workspaceRoot = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
			? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
		if (!workspaceRoot) {
			vscode.window.showInformationMessage('Empty workspace');
			return Promise.resolve(undefined);
		}

		const soloPath = path.join(workspaceRoot, ".solo");
		if (!_.exists(soloPath)) {
			vscode.window.showInformationMessage('No .solo folder');
			return Promise.resolve(undefined);
		}
		var file = path.join(soloPath, designName);

		if (this.pathExists(file)) {
			return fs.readFileSync(file, 'utf-8');
		} else {
			return Promise.resolve(undefined);
		}
	}
	
	public async getItemsInDesign(designName: string): Promise<FeatureDesignItem[]> {
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
		var file = path.join(soloPath, designName);

		if (this.pathExists(file)) {
			const designJson = JSON.parse(fs.readFileSync(file, 'utf-8'));

			return designJson.items.map((i: { name: string; description: string; }) => 
				new FeatureDesignItem(i.name, i.description));
		} else {
			return Promise.resolve([]);
		}
	}
	
	readDirectory(uri: string): [string, vscode.FileType, string][] | Thenable<[string, vscode.FileType, string][]> {
		return this._readDirectory(uri);
	}

	async _readDirectory(uri: string): Promise<[string, vscode.FileType, string][]> {
		const children = await _.readdir(uri);

		const result: [string, vscode.FileType, string][] = [];
		for (let i = 0; i < children.length; i++) {
			const child = children[i];
			const fsPath = path.join(uri, child);
			const stat = await this._stat(fsPath);
			result.push([child, stat.type, fsPath]);
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
	
	async _stat(path: string): Promise<vscode.FileStat> {
		return new FileStat(await _.stat(path));
	}
}
