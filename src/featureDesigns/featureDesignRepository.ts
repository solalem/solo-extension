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

		const designsPath = path.join(workspaceRoot, "design", "modules");
		if (!_.exists(designsPath)) {
			vscode.window.showInformationMessage('No modules folder');
			return Promise.resolve([]);
		}

		var files = await this.readDirectory(designsPath);
		return files
			.map(([file]) => {
				var fsPath = path.join(designsPath, file);
                const design: FeatureDesign = JSON.parse(fs.readFileSync(fsPath, 'utf-8'));
				design.id = file;
				design.fsPath = fsPath;
				return design;
			});
	}
	
	public async getFeatureDesign(designId: string): Promise<FeatureDesign | undefined> {
		const workspaceRoot = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
			? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
		if (!workspaceRoot) {
			vscode.window.showInformationMessage('Empty workspace');
			return Promise.resolve(undefined);
		}

		const designsPath = path.join(workspaceRoot, "design", "modules");
		if (!_.exists(designsPath)) {
			vscode.window.showInformationMessage('No modules folder');
			return Promise.resolve(undefined);
		}
		var fsPath = path.join(designsPath, designId);

		if (this.pathExists(fsPath)) {
			const designJson: FeatureDesign = JSON.parse(fs.readFileSync(fsPath, 'utf-8'));
			designJson.id = designId;
			designJson.fsPath = fsPath;
			return Promise.resolve(designJson);
		} else {
			return Promise.resolve(undefined);
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
