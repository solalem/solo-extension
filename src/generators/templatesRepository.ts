import * as fs from 'fs';
import * as path from 'path';
import { _ } from '../fileSystem/fileUtilities';
import { CodeTreeItem } from '../codeTrees/models';

export class TemplatesRepository {

	listTemplates(templatesDirectory: string, location: string) {
		const absoluteLocation = path.toNamespacedPath(path.join(templatesDirectory, location));
		var codeTreeItems: CodeTreeItem[] = [];
		if (fs.existsSync(absoluteLocation)) {
			var templateFiles = fs.readdirSync(absoluteLocation, { withFileTypes: true });

			templateFiles.filter(x => x.name.startsWith('.')).forEach(filename => {
				const childLocation = path.join(location, filename.name);
				codeTreeItems.push(
					new CodeTreeItem(
						filename.name,
						filename.isDirectory() ? 'folder' : filename.isFile() ? 'file' : '',
						filename.name,
						'',
						childLocation,
						'',
						'',
						this.listTemplates(templatesDirectory, childLocation)));
			})
		}
		return codeTreeItems;
	}
}
