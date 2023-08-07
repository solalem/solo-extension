import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from "node:os";
import { _ } from '../fileSystem/fileUtilities';
import { Blueprint, CodeTree, CodeTreeItem, Feature, SoloConfig } from './models';
import { FeatureDesign } from '../featureDesigns/models';
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
			var codeTree: CodeTree = JSON.parse(fs.readFileSync(treePath, 'utf-8'));
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

		const configPath = path.join(workspaceRoot, "solo", "config.json");
		if (this.pathExists(configPath)) {
			const configJson = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
			const features = configJson.features.map((f: { name: string, design: string, blueprints: any }) => {
				const blueprints = f.blueprints
					? Object.keys(f.blueprints).map(b => { return new Blueprint(b, f.blueprints[b])})
					: [];
				return new Feature(f.name, f.design, blueprints);	
			});

			return Promise.resolve(new SoloConfig(configJson.name, configJson.description, features));
		} else {
			vscode.window.showInformationMessage('No config file found');
			return Promise.resolve(undefined);
		}
	}

	buildCodeTree(templateDirectory: string, currentTemplate: string, config: SoloConfig, designs: FeatureDesign[]): CodeTreeItem[] {
		var codeTreeItems: CodeTreeItem[] = [];
		// for each feature provided built tree without repeating nodes
		config.features.forEach(feature => {
			// Read the design of this feature
			const design = designs.find(x => x.name === feature.design);
			if(design === undefined)
				return;
				
			feature.blueprints.forEach(blueprint => {
				const absoluteLocation = path.join(templateDirectory, blueprint.name, currentTemplate);
				if (fs.existsSync(absoluteLocation) && !currentTemplate.startsWith('.')) {
					const templatePaths = fs.readdirSync(absoluteLocation, { withFileTypes: true }); 
					templatePaths.filter(x => !x.name.startsWith('.')).forEach(filePath => {
						const childTemplate = path.join(currentTemplate, filePath.name);
						design.items?.forEach(item => {
							const treeItemName = replacePlaceholders(filePath.name, item, design, () => {});
							if(codeTreeItems.find(x => x.name == treeItemName))
								return;
							
							codeTreeItems.push(new CodeTreeItem(
								treeItemName,
								filePath.isDirectory() ? 'folder' : filePath.isFile() ? 'file' : '',
								treeItemName,
								replacePlaceholders(childTemplate, item, design, () => {}),
								path.join(blueprint.name, childTemplate),
								design.id,
								item.name,
								filePath.isDirectory() ? this.buildCodeTree(templateDirectory, childTemplate, config, designs): []));
						});
					});
				}
			})
		});

		return codeTreeItems;
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
		  var exists = fs.existsSync(dirname);
		  if (!exists) {
			fs.mkdir(dirname, { recursive: true }, (err) => 
			{
			  if (err) throw err; 
			})
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
		
		const modulesPath = path.join(workspaceRoot, "solo", "designs");
        if (!fs.existsSync(modulesPath)) {
            fs.mkdir(modulesPath, { recursive: true }, (err) => {
				if (err) throw err; 
			})
        }
        const configFile = path.join(workspaceRoot, "solo", "config.json");
        if (!fs.existsSync(configFile)) {
            fs.writeFileSync(configFile, "{ \"name\":\"test\" }");
        }
        const moduleFile = path.join(workspaceRoot, "solo", "designs", "module1.json");
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
