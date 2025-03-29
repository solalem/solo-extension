import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { _ } from '../fileSystem/fileUtilities';
import { FeatureDesign, Model } from './models';
import { SoloConfig } from '../models';

export class FeatureDesignRepository {

	async getFeatureDesigns(config: SoloConfig): Promise<FeatureDesign[]> {
		const workspaceRoot = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
			? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
		if (!workspaceRoot) {
			vscode.window.showInformationMessage('Empty workspace');
			return Promise.resolve([]);
		}

		const designsPath = path.join(workspaceRoot, "solo", "designs");
		if (!_.exists(designsPath)) {
			vscode.window.showInformationMessage('No modules folder');
			return Promise.resolve([]);
		}

		return config.features
			.map((feature) => {
				const fsPath = path.join(designsPath, feature.getDesignFileName());
                const featureDesign: FeatureDesign = JSON.parse(fs.readFileSync(fsPath, 'utf-8'));
				featureDesign.id = feature.model;
				featureDesign.fsPath = fsPath;
				return featureDesign;
			});
	}
	
	public async getFeatureDesign(designId: string): Promise<FeatureDesign | undefined> {
		const workspaceRoot = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
			? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
		if (!workspaceRoot) {
			vscode.window.showInformationMessage('Empty workspace');
			return Promise.resolve(undefined);
		}

		const designsPath = path.join(workspaceRoot, "solo", "designs");
		if (!_.exists(designsPath)) {
			vscode.window.showInformationMessage('No modules folder');
			return Promise.resolve(undefined);
		}
		let fsPath = path.join(designsPath, designId);
		if (!fsPath.endsWith('.json')) 
			fsPath += '.json';

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

		const designsPath = path.join(workspaceRoot, "solo", "designs");
		if (!_.exists(designsPath)) {
			vscode.window.showInformationMessage('No modules folder');
			return Promise.resolve(undefined);
		}

		const fsPath = path.join(designsPath, design.id);

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
			const model = featureDesign.models?.find(x => x.name === name);
			if(model) {
				featureDesign.models?.push(new Model (model.name + "-copy", model.description));
				await this.saveFeatureDesign(featureDesign);
			}
		}
	}

	public async deleteItem(name: string, featureDesignId : string) {
		const featureDesign = await this.getFeatureDesign(featureDesignId);

		if(featureDesign && featureDesign.models) {
			const index = featureDesign.models.findIndex(x => x.name === name);
			if(index >= 0) {
				featureDesign.models.splice(index, 1);
				await this.saveFeatureDesign(featureDesign);
			}
		}
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
