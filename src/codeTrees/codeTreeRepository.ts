import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from "node:os";
import { _ } from '../fileSystem/fileUtilities';
import { CodeTree, CodeTreeItem } from './models';
import { Template, Feature, SoloConfig } from '../models';
import { Model } from '../modeling/models';
import { replacePlaceholders } from '../generators/helpers';

export class CodeTreeRepository {

	async getCodeTree(): Promise<CodeTree | undefined> {
		const workspaceFolder = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
			? vscode.workspace.workspaceFolders[0] : undefined;
		if (!workspaceFolder?.uri.path) {
			vscode.window.showInformationMessage('Empty workspace');
			return;
		}

		const treePath = path.join(os.tmpdir(), 'solo', workspaceFolder.name, 'tree.json');
		if (fs.existsSync(treePath)) {
			const codeTree: CodeTree = JSON.parse(fs.readFileSync(treePath, 'utf-8'));
			return Promise.resolve(codeTree);
		} else {
			return Promise.resolve(undefined);
		}
	}
	
	async readConfig(): Promise<SoloConfig | undefined> {
		const workspaceRoot = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
			? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
		if (!workspaceRoot) {
			vscode.window.showInformationMessage('Empty workspace');
			return Promise.resolve(undefined);
		}

		const configPath = path.join(workspaceRoot, "solo.config");
		if (this.pathExists(configPath)) {
			const configJson = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
			const features = configJson.features.map((f: { name: string, model: string, implementations: any[] }) => {
				return new Feature(f.name, f.model, f.implementations);
			});
            const templates = configJson.templates
                ? Object.keys(configJson.templates).map(b => new Template(b, configJson.templates[b]))
                : [];
			return Promise.resolve(new SoloConfig(configJson.name, configJson.description, features, templates));
		} else {
			vscode.window.showInformationMessage('No config file found');
			return Promise.resolve(undefined);
		}
	}

	buildCodeTree(templateDirectory: string, config: SoloConfig, models: Model[]): CodeTreeItem[] {
		const codeTreeItems: CodeTreeItem[] = [];
		// for each feature provided built tree without repeating nodes
		config.features?.forEach(feature => {
			// Read the model of this feature
			const model = models.find(x => x.id === feature.getModelId());
			if(model === undefined) {
				vscode.window.showErrorMessage('No model found: '+ feature.name);
				return;
			}

			feature.implementations.forEach(t => {
				
				const template = config.templates.find(x => x.name == t.template);
				// vscode.window.showInformationMessage('Template: '+ template?.name + ' model: ' + model?.name);
				if(template === undefined)
					return;
				this.buildCodeTreeNode(templateDirectory, template, '', model, codeTreeItems);
			});

		});

		return codeTreeItems;
	}

	private buildCodeTreeNode(
		templateDirectory: string, 
		template: Template, 
		currentTemplateFile: string, 
		model: Model, 
		codeTreeItems: CodeTreeItem[]) {
		const absoluteLocation = path.join(templateDirectory, template.name, currentTemplateFile);
		//vscode.window.showInformationMessage('Template to read: '+ absoluteLocation);

		if (!fs.existsSync(absoluteLocation) || currentTemplateFile.startsWith('.')) {
			vscode.window.showInformationMessage('Template not found or path starts with dot. Returning...');
			return;
		}

		const templatePaths = fs.readdirSync(absoluteLocation, { withFileTypes: true });
		templatePaths?.filter(x => !x.name.startsWith('.'))?.forEach(filePath => {

			const childTemplate = path.join(currentTemplateFile, filePath.name);
			model.entities?.forEach(item => {
				// eslint-disable-next-line @typescript-eslint/no-empty-function
				const treeItemName = replacePlaceholders(filePath.name, item, model, () => { });
				if (codeTreeItems.find(x => x.name == treeItemName))
					return;

				const children: CodeTreeItem[] = [];
				filePath.isDirectory() ? this.buildCodeTreeNode(templateDirectory, template, childTemplate, model, children) : [];
				codeTreeItems.push(new CodeTreeItem(
					treeItemName,
					filePath.isDirectory() ? 'folder' : filePath.isFile() ? 'file' : '',
					treeItemName,
					// eslint-disable-next-line @typescript-eslint/no-empty-function
					replacePlaceholders(childTemplate, item, model, () => { }),
					path.join(template.name, childTemplate),
					model.id,
					item.name,
					children));
			});
		});
	}

	save(codeTree: CodeTree, callback: any) {
		const workspaceFolder = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
			? vscode.workspace.workspaceFolders[0] : undefined;
		if (!workspaceFolder?.uri.path) {
			vscode.window.showInformationMessage('Empty workspace');
			return;
		}
		
		if(codeTree) {
            const treePath = path.join(os.tmpdir(), 'solo', workspaceFolder.name, 'tree.json');
            const dirname = path.dirname(treePath);
            const exists = fs.existsSync(dirname);
            if (!exists) {
                fs.mkdir(dirname, { recursive: true }, (err) => 
                {
                if (err) throw err; 
                });
            }
        
            fs.writeFileSync(treePath, JSON.stringify(codeTree)); 
            callback(`tree.json updated`);   
		}
	}

	prepare() {
		const workspaceRoot = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
			? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
		if (!workspaceRoot) {
			vscode.window.showInformationMessage('Empty workspace');
			return;
		}
		
		const modulesPath = path.join(workspaceRoot, "models");
        if (!fs.existsSync(modulesPath)) {
            fs.mkdir(modulesPath, { recursive: true }, (err) => {
				if (err) throw err; 
			});
        }
        const configFile = path.join(workspaceRoot, "solo.config");
        if (!fs.existsSync(configFile)) {
            fs.writeFileSync(configFile, "{ \"name\":\"test\" }");
        }
        const moduleFile = path.join(workspaceRoot, "models", "module1.json");
        if (!fs.existsSync(moduleFile)) {
            fs.writeFileSync(moduleFile, "{ \"name\":\"test\", \"items\": [] }");
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
