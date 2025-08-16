import * as fs from 'fs';
import * as chalk from "chalk";
import * as path from "path";
import * as handlebars from "handlebars";
import { Model, Entity } from "../modeling/models";
import { CodeTreeItem } from '../codeTrees/models';
import { addHelpers } from './helpers';
import { ModelRepository } from '../modeling/modelRepository';

export class Generator {

	constructor(private modelRepository: ModelRepository) {
	}

  // generate files based on template folder given
  async generateFolder(templateDirectory: string, workspaceDirectory: string, codeTreeItem: CodeTreeItem, callback: any): Promise<void> {
    const templatePath = path.join(templateDirectory, codeTreeItem.templatePath);
    const exists = fs.existsSync(templatePath);
    if (!exists) {
      callback(`Template file ${templatePath} not found`);
      return;
    }

    const stats = fs.statSync(templatePath);
    
    const isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
      const destinationPath = path.join(workspaceDirectory, codeTreeItem.destinationPath);
      const destExists = fs.existsSync(destinationPath);
      if(!destExists) 
      {
        fs.mkdir(destinationPath, { recursive: true }, (err) => 
        {
          if (err) throw err; 
        });
      }
      
      // Go one level deeper
      codeTreeItem.children.forEach(async (child) => {
        await this.generateFolder(templateDirectory, workspaceDirectory, child, callback);
      });

    } else {
      const model = await this.modelRepository.getModelByFilename(codeTreeItem.modelPath);
      if(!model || !model.entities) return;

      const item = model?.entities?.find(x => x.name === codeTreeItem.itemName);
      if(!item) return;

      this.generateNode(templateDirectory, workspaceDirectory, codeTreeItem, item, model, callback);
    }
  }

  generateNode(
    templateDirectory: string, 
    workspaceDirectory: string, 
    codeTreeItem: CodeTreeItem, 
    entity: Entity, 
    model: Model, 
    callback: any): string | undefined {
      callback(`Generating. ${codeTreeItem.templatePath} for ${codeTreeItem.destinationPath}`);   

    const templateFile = path.join(templateDirectory, codeTreeItem.templatePath);

    const templateExists = fs.existsSync(templateFile);
    if (!templateExists) 
    {
      callback(`Error: Template file not found. ${templateFile}`);   
      return undefined;
    }

    // Read Handlebar template 
    const data = fs.readFileSync(templateFile);
    if (!data) 
      return undefined;
    //  if (error) throw error;
    // compile the template
    addHelpers();
    const template = handlebars.compile(data.toString());

    // execute the compiled template 
    const output = template({ context: model, model: entity, entity: entity }); 
    if(output) {
      const fsPath = path.join(workspaceDirectory, codeTreeItem.destinationPath);
      const dirname = path.dirname(fsPath);
      const dirExists = fs.existsSync(dirname);
      if (!dirExists) {
        fs.mkdir(dirname, { recursive: true }, (err) => 
        {
          if (err) throw err; 
        });
      }

      fs.writeFileSync(fsPath, output); 
      callback(`File created ${chalk.green(codeTreeItem.destinationPath)}`);   
    }

    return output;
  }
}