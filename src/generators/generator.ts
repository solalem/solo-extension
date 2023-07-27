import * as fs from 'fs';
import * as chalk from "chalk";
import * as path from "path";
import * as handlebars from "handlebars";
import { FeatureDesign, FeatureDesignItem } from "../featureDesigns/models";
import { CodeTreeItem } from '../codeTrees/models';
import { addHelpers } from './helpers';
import { FeatureDesignRepository } from '../featureDesigns/featureDesignRepository';

export class Generator {

	constructor(private featureDesignRepository: FeatureDesignRepository) {
	}

  // generate files based on template folder given
  async generateFolder(templateDirectory: string, workspaceDirectory: string, codeTreeItem: CodeTreeItem, callback: any): Promise<void> {
    var templatePath = path.join(templateDirectory, codeTreeItem.templatePath);
    var exists = fs.existsSync(templatePath);
    if (!exists) {
      callback(`Template file ${templatePath} not found`);
      return;
    }

    var stats = fs.statSync(templatePath);
    
    var isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
      var destinationPath = path.join(workspaceDirectory, codeTreeItem.destinationPath);
      var destExists = fs.existsSync(destinationPath);
      if(!destExists) 
      {
        fs.mkdir(destinationPath, { recursive: true }, (err) => 
        {
          if (err) throw err; 
        })
      }
      
      // Go one level deeper
      codeTreeItem.children.forEach(async (child) => {
        await this.generateFolder(templateDirectory, workspaceDirectory, child, callback);
      });

    } else {
      var context = await this.featureDesignRepository.getFeatureDesign(codeTreeItem.designId);
      if(!context || !context.items) return;

      var item = context?.items?.find(x => x.name === codeTreeItem.itemName);
      if(!item) return;

      this.generateNode(templateDirectory, workspaceDirectory, codeTreeItem, item, context, callback);
    }
  };

  generateNode(
    templateDirectory: string, 
    workspaceDirectory: string, 
    codeTreeItem: CodeTreeItem, 
    model: FeatureDesignItem, 
    context: FeatureDesign, 
    callback: any): string | undefined {

    var templateFile = path.join(templateDirectory, codeTreeItem.templatePath);

    var exists = fs.existsSync(templateFile);
    if (!exists) 
    {
      callback(`Error: Template file not found. ${templateFile}`);   
      return undefined;
    }

    // Read Handlebar template 
    var data = fs.readFileSync(templateFile);
    if (!data) 
      return undefined;
    //  if (error) throw error;
    // compile the template
    addHelpers();
    var template = handlebars.compile(data.toString());

    // execute the compiled template 
    var output = template({ context: context, model: model }); 
    if(output) {
      const fsPath = path.join(workspaceDirectory, codeTreeItem.destinationPath);
      const dirname = path.dirname(fsPath);
      var exists = fs.existsSync(dirname);
      if (!exists) {
        fs.mkdir(dirname, { recursive: true }, (err) => 
        {
          if (err) throw err; 
        })
      }

      fs.writeFileSync(fsPath, output); 
      callback(`File created ${chalk.green(codeTreeItem.destinationPath)}`);   
    }

    return output;
  };

}