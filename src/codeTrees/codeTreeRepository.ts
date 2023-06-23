import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { _ } from '../fileSystem/fileUtilities';
import { CodeTree, CodeTreeItem } from './models';
import { FeatureDesign } from '../featureDesigns/models';
import { replacePlaceholders } from '../generators/helpers';

export class CodeTreeRepository {

	public async getCodeTree(): Promise<CodeTree | undefined> {
		const workspaceRoot = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
			? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
		if (!workspaceRoot) {
			vscode.window.showInformationMessage('Empty workspace');
			return Promise.resolve(undefined);
		}

		const soloPath = path.join(workspaceRoot, "design");
		if (!fs.existsSync(soloPath)) {
			vscode.window.showInformationMessage('No design folder');
			return Promise.resolve(undefined);
		}
		var file = path.join(soloPath, "tree.json");

		if (fs.existsSync(file) && workspaceRoot) {
			var codeTree: CodeTree = JSON.parse(fs.readFileSync(file, 'utf-8'));
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

		const workspaceRoot = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
			? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
		if (!workspaceRoot) {
			vscode.window.showInformationMessage('Empty workspace');
			return;
		}
		
		const soloPath = path.join(workspaceRoot, "design");
		if(codeTree) {
		  //var destProper = replacePlaceholders(codeTreeItem.destinationPath, model, context, callback);
		  const fsPath = path.join(soloPath, 'tree.json');
		  //path.join(workspaceDirectory, codeTreeItem.destinationPath);
		  const dirname = path.dirname(fsPath);
		  var exists = fs.existsSync(dirname);
		  if (!exists) {
			fs.mkdir(dirname, { recursive: true }, (err) => 
			{
			  if (err) throw err; 
			})
		  }
	
		  fs.writeFileSync(fsPath, JSON.stringify(codeTree)); 
		  callback(`tree.json updated`);   
		}
	  };
	
}
