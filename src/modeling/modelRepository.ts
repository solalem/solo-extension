import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { _ } from '../fileSystem/fileUtilities';
import { Model, Entity } from './models';
import { SoloConfig } from '../models';

export class ModelRepository {

	async getModels(config: SoloConfig): Promise<Model[]> {
		const workspaceRoot = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
			? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
		if (!workspaceRoot) {
			vscode.window.showInformationMessage('Empty workspace');
			return Promise.resolve([]);
		}

		const modelsPath = path.join(workspaceRoot, "models");
		if (!_.exists(modelsPath)) {
			vscode.window.showInformationMessage('No modules folder');
			return Promise.resolve([]);
		}

		return config.features
			.map((feature) => {
				const fsPath = path.join(modelsPath, feature.getModelFileName());
                const model: Model = JSON.parse(fs.readFileSync(fsPath, 'utf-8'));
				model.id = feature.getModelId();
				model.fsPath = fsPath;
				return model;
			});
	}
	
	public async getModel(designId: string): Promise<Model | undefined> {
		const workspaceRoot = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
			? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
		if (!workspaceRoot) {
			vscode.window.showInformationMessage('Empty workspace');
			return Promise.resolve(undefined);
		}

		const modelsPath = path.join(workspaceRoot, "models");
		if (!_.exists(modelsPath)) {
			vscode.window.showInformationMessage('No modules folder');
			return Promise.resolve(undefined);
		}
		let fsPath = path.join(modelsPath, designId);
		if (!fsPath.endsWith('.json')) 
			fsPath += '.json';

		if (this.pathExists(fsPath)) {
			const designJson: Model = JSON.parse(fs.readFileSync(fsPath, 'utf-8'));
			designJson.id = designId;
			designJson.fsPath = fsPath;
			return Promise.resolve(designJson);
		} else {
			return Promise.resolve(undefined);
		}
	}
		
	public async saveModel(design: Model): Promise<Model | undefined> {
		const workspaceRoot = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
			? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
		if (!workspaceRoot) {
			vscode.window.showInformationMessage('Empty workspace');
			return Promise.resolve(undefined);
		}

		const modelsPath = path.join(workspaceRoot, "models");
		if (!_.exists(modelsPath)) {
			vscode.window.showInformationMessage('No modules folder');
			return Promise.resolve(undefined);
		}

		const fsPath = path.join(modelsPath, design.id);

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
		const model = await this.getModel(featureDesignId);

		if(model) {
			const entity = model.entities?.find(x => x.name === name);
			if(entity) {
				model.entities?.push(new Entity (entity.name + "-copy", entity.aggregate, entity.description));
				await this.saveModel(model);
			}
		}
	}

	public async deleteItem(name: string, featureDesignId : string) {
		const model = await this.getModel(featureDesignId);

		if(model && model.entities) {
			const index = model.entities.findIndex(x => x.name === name);
			if(index >= 0) {
				model.entities.splice(index, 1);
				await this.saveModel(model);
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
