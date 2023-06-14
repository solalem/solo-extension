import * as fs from 'fs';
import * as chalk from "chalk";
import * as path from "path";
import * as handlebars from "handlebars";
import { FeatureDesign, FeatureDesignItem } from "../featureDesigns/models";
import { CodeTreeItem } from '../codeTrees/models';
import { addHelpers, replacePlaceholders } from './helpers';

export class Generator {

  // generate files based on template folder given
  generate(templatesDirectory: string, workspaceDirectory: string, codeTreeItem: CodeTreeItem, model: FeatureDesignItem, context: FeatureDesign, callback: any): void {
    var templateFile = path.join(templatesDirectory, codeTreeItem.templatePath);

    var exists = fs.existsSync(templateFile);
    if (!exists) 
      return;

    var stats = fs.statSync(templateFile);
    
    var isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
      var destProper = replacePlaceholders(codeTreeItem.destinationPath, model, context, callback);
      // Does it exist?
      var destExists = fs.existsSync(destProper);
      if(!destExists) {
        fs.mkdirSync(destProper);
      }
      callback(`Checking templates in folder ${chalk.green(templateFile)}`);   
      // Go one level deeper
      codeTreeItem.children.forEach(function(this: Generator, child) {
        this.generate(templatesDirectory, workspaceDirectory, child, model, context, callback);
      });
    } else {
    
      // execute the compiled template and write to new file
      var output = this.generateNode(templatesDirectory, workspaceDirectory, codeTreeItem, model, context, callback);
      if(output) {
        var destProper = replacePlaceholders(codeTreeItem.destinationPath, model, context, callback);
        fs.writeFileSync(destProper, output); 
        callback(`File created ${chalk.green(destProper)}`);   
      }
    }
  };

  generateNode(
    templatesDirectory: string, 
    workspaceDirectory: string, 
    codeTreeItem: CodeTreeItem, 
    model: FeatureDesignItem, 
    context: FeatureDesign, 
    callback: any): string | undefined {

    var templateFile = path.join(templatesDirectory, codeTreeItem.templatePath);

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
      var destProper = replacePlaceholders(codeTreeItem.destinationPath, model, context, callback);
      const fsPath = path.join(workspaceDirectory, destProper);
      const dirname = path.dirname(fsPath);
      var exists = fs.existsSync(dirname);
      if (!exists) {
        fs.mkdir(dirname, { recursive: true }, (err) => 
        {
          if (err) throw err; 
        })
      }

      fs.writeFileSync(fsPath, output); 
      callback(`File created ${chalk.green(destProper)}`);   
    }

    return output;
  };

}