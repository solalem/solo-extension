import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from "node:os";
import { _ } from '../fileSystem/fileUtilities';
import { CodeTree, CodeTreeItem } from './models';
import { FeatureDesign } from '../featureDesigns/models';
import { replacePlaceholders } from '../generators/helpers';

export class CodeTreeRepository {

	public async getCodeTree(): Promise<CodeTree | undefined> {
		const workspaceFolder = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
			? vscode.workspace.workspaceFolders[0] : undefined;
		if (!workspaceFolder?.uri.path) {
			vscode.window.showInformationMessage('Empty workspace');
			return;
		}

		const soloPath = path.join(workspaceFolder.uri.fsPath, "design");
		if (!fs.existsSync(soloPath)) {
			vscode.window.showInformationMessage('No design folder');
			return Promise.resolve(undefined);
		}

		const treePath = path.join(os.tmpdir(), 'solo', workspaceFolder.name, 'tree.json');
		if (fs.existsSync(treePath)) {
			var codeTree: CodeTree = JSON.parse(fs.readFileSync(treePath, 'utf-8'));
			return Promise.resolve(codeTree);
		} else {
			return Promise.resolve(undefined);
		}
	}

	buildCodeTree(templatesDirectory: string, location: string, designs: FeatureDesign[]): CodeTreeItem[] {
		const absoluteLocation = path.join(templatesDirectory, location);
		var codeTreeItems: CodeTreeItem[] = [];
		if (fs.existsSync(absoluteLocation) && !location.startsWith('.')) {
			var templatePaths = fs.readdirSync(absoluteLocation, { withFileTypes: true });
			templatePaths.filter(x => !x.name.startsWith('.')).forEach(filePath => {
				const childLocation = path.join(location, filePath.name);
				// for each design provided built tree without repeating nodes
				designs.forEach(design => {
					design.items?.forEach(item => {
						const treeItemName = replacePlaceholders(filePath.name, item, design, () => {});
						if(codeTreeItems.find(x => x.name == treeItemName))
							return;
						
						codeTreeItems.push(new CodeTreeItem(
							treeItemName,
							filePath.isDirectory() ? 'folder' : filePath.isFile() ? 'file' : '',
							treeItemName,
      						replacePlaceholders(childLocation, item, design, () => {}),
							childLocation,
							design.id,
							item.name,
							filePath.isDirectory() ? this.buildCodeTree(templatesDirectory, childLocation, designs): []));
					});
				});
			})
		}
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
		
		const modulesPath = path.join(workspaceRoot, "design", "modules");
        if (!fs.existsSync(modulesPath)) {
            fs.mkdir(modulesPath, { recursive: true }, (err) => {
				if (err) throw err; 
			})
        }
        const configFile = path.join(workspaceRoot, "design", "config.json");
        if (!fs.existsSync(configFile)) {
            fs.writeFileSync(configFile, "{ \"name\":\"test\" }");
        }
        const moduleFile = path.join(workspaceRoot, "design", "modules", "module1.json");
        if (!fs.existsSync(moduleFile)) {
            fs.writeFileSync(moduleFile, "{ \"name\":\"test\", \"items\": [] }");
        }
	}
	
}
