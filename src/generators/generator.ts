import * as fs from 'fs';
import * as chalk from "chalk";
import * as path from "path";
import * as handlebars from "handlebars";
import { FeatureDesign, Model } from "../featureDesigns/models";
import { CodeTreeItem } from '../codeTrees/models';
import { addHelpers } from './helpers';
import { FeatureDesignRepository } from '../featureDesigns/featureDesignRepository';

export class Generator {

	constructor(private featureDesignRepository: FeatureDesignRepository) {
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
      const context = await this.featureDesignRepository.getFeatureDesign(codeTreeItem.designId);
      if(!context || !context.models) return;

      const item = context?.models?.find(x => x.name === codeTreeItem.itemName);
      if(!item) return;

      this.generateNode(templateDirectory, workspaceDirectory, codeTreeItem, item, context, callback);
    }
  }

  generateNode(
    templateDirectory: string, 
    workspaceDirectory: string, 
    codeTreeItem: CodeTreeItem, 
    model: Model, 
    context: FeatureDesign, 
    callback: any): string | undefined {

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
    const output = template({ context: context, model: model }); 
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