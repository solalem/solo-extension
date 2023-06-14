import * as fs from 'fs';
import * as path from 'path';
import { _ } from '../fileSystem/fileUtilities';
import { CodeTreeItem } from '../codeTrees/models';

export class TemplatesRepository {

	listTemplates(location: string) {
		var exists = fs.existsSync(location);
		var templates: CodeTreeItem[] = [];
		if (exists) {
		  var parents = fs.readdirSync(location);
	  
		  parents.forEach(parent => {
			const fsPath = path.join(location, parent);
			var children = fs.readdirSync(fsPath);
			templates.push(
			  new CodeTreeItem(
				parent, 
				'description', 
				'./destination', 
				fsPath,
				'design',
				'item', 
				children.map((c) => new CodeTreeItem(
				  c,
				  'description', 
				  './destination', 
				  fsPath,
				  'design',
				  'item',
				  this.listTemplates(c)))));
		  })
		}
		return templates;
	  }
}
