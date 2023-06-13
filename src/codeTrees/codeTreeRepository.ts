import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { FileStat } from '../fileSystem/fileStat';
import { _ } from '../fileSystem/fileUtilities';
import { CodeTree } from './models';

export class CodeTreeRepository {

	public async getCodeTree(): Promise<CodeTree | undefined> {
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
		var file = path.join(soloPath, "scaffold.json");

		if (this.pathExists(file) && workspaceRoot) {
			var codeTree: CodeTree = JSON.parse(fs.readFileSync(file, 'utf-8'));

			return Promise.resolve(codeTree);
		} else {
			return Promise.resolve(undefined);
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
	
	async _stat(path: string): Promise<vscode.FileStat> {
		return new FileStat(await _.stat(path));
	}
}
