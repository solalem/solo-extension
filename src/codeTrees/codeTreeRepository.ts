import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from "node:os";
import { _ } from '../fileSystem/fileUtilities';
import { CodeTree, CodeTreeItem } from './models';
import { Blueprint, Feature, SoloConfig } from '../models';
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

		const configPath = path.join(workspaceRoot, "solo", "config.json");
		if (this.pathExists(configPath)) {
			const configJson = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
			const features = configJson.features.map((f: { name: string, design: string, blueprint: string }) => {
				return new Feature(f.name, f.design, f.blueprint);	
			});
            const blueprints = configJson.blueprints
                ? Object.keys(configJson.blueprints).map(b => new Blueprint(b, configJson.blueprints[b]))
                : [];
			return Promise.resolve(new SoloConfig(configJson.name, configJson.description, features, blueprints));
		} else {
			vscode.window.showInformationMessage('No config file found');
			return Promise.resolve(undefined);
		}
	}

	buildCodeTree(templateDirectory: string, config: SoloConfig, designs: FeatureDesign[]): CodeTreeItem[] {
		const codeTreeItems: CodeTreeItem[] = [];
		// for each feature provided built tree without repeating nodes
		config.features.forEach(feature => {
			// Read the design of this feature
			const design = designs.find(x => x.id === feature.design);
			if(design === undefined)
				return;
			const blueprint = config.blueprints.find(x => x.name == feature.blueprint);
			if(blueprint === undefined)
				return;
				
			this.buildCodeTreeNode(templateDirectory, blueprint, '', design, codeTreeItems);
		});

		return codeTreeItems;
	}

	private buildCodeTreeNode(
		templateDirectory: string, 
		blueprint: Blueprint, 
		currentTemplateFile: string, 
		design: FeatureDesign, 
		codeTreeItems: CodeTreeItem[]) {
		const absoluteLocation = path.join(templateDirectory, blueprint.name, currentTemplateFile);
		if (fs.existsSync(absoluteLocation) && !currentTemplateFile.startsWith('.')) {
			const templatePaths = fs.readdirSync(absoluteLocation, { withFileTypes: true });
			templatePaths.filter(x => !x.name.startsWith('.')).forEach(filePath => {
				const childTemplate = path.join(currentTemplateFile, filePath.name);
				design.items?.forEach(item => {
					// eslint-disable-next-line @typescript-eslint/no-empty-function
					const treeItemName = replacePlaceholders(filePath.name, item, design, () => { });
					if (codeTreeItems.find(x => x.name == treeItemName))
						return;

					const children: CodeTreeItem[] = [];
					filePath.isDirectory() ? this.buildCodeTreeNode(templateDirectory, blueprint, childTemplate, design, children) : [];
					codeTreeItems.push(new CodeTreeItem(
						treeItemName,
						filePath.isDirectory() ? 'folder' : filePath.isFile() ? 'file' : '',
						treeItemName,
						// eslint-disable-next-line @typescript-eslint/no-empty-function
						replacePlaceholders(childTemplate, item, design, () => { }),
						path.join(blueprint.name, childTemplate),
						design.id,
						item.name,
						children));
				});
			});
		}
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
		
		const modulesPath = path.join(workspaceRoot, "solo", "designs");
        if (!fs.existsSync(modulesPath)) {
            fs.mkdir(modulesPath, { recursive: true }, (err) => {
				if (err) throw err; 
			});
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
