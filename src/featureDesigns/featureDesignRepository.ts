import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
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
		
	public async saveFeatureDesign(design: FeatureDesign): Promise<FeatureDesign | undefined> {
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

		var fsPath = path.join(designsPath, design.id);

		if (this.pathExists(fsPath)) {
			fs.writeFileSync(fsPath, JSON.stringify(design, function(key, val) {
				if (key !== "fsPath")
					return val;
			}, 4));
			return Promise.resolve(design);
		} else {
			return Promise.resolve(undefined);
		}
	}
	
	public async duplicateItem(name: string, featureDesignId : string) {
		const featureDesign = await this.getFeatureDesign(featureDesignId);

		if(featureDesign) {
			let item = featureDesign.items?.find(x => x.name === name);
			if(item) {
				featureDesign.items?.push(new FeatureDesignItem (item.name + "-copy", item.description));
				await this.saveFeatureDesign(featureDesign);
			}
		}
	}

	public async deleteItem(name: string, featureDesignId : string) {
		const featureDesign = await this.getFeatureDesign(featureDesignId);

		if(featureDesign && featureDesign.items) {
			let index = featureDesign.items.findIndex(x => x.name === name);
			if(index >= 0) {
				featureDesign.items.splice(index, 1);
				await this.saveFeatureDesign(featureDesign);
			}
		}
	}

	private readDirectory(uri: string): [string, string][] | Thenable<[string, string][]> {
		return this._readDirectory(uri);
	}

	private async _readDirectory(uri: string): Promise<[string, string][]> {
		const children = await _.readdir(uri);

		const result: [string, string][] = [];
		for (let i = 0; i < children.length; i++) {
			const child = children[i];
			const fsPath = path.join(uri, child);
			result.push([child, fsPath]);
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
