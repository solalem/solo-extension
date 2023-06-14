import * as fs from 'fs';
import * as chalk from "chalk";
import * as path from "path";
import * as handlebars from "handlebars";
import * as pluralize from "pluralize";
import { FeatureDesign, FeatureDesignItem } from "./featureDesigns/models";
import { CodeTreeItem } from './codeTrees/models';

// replace filename path placeholders using handlebars
const replacePlaceholders = function(path: string, model: FeatureDesignItem, context: FeatureDesign, callback: any) {
  // Handlebars doesn't like \ and / chars in filenames. So temporary replace them with some silly text
  var encodedPath = path.replace(/\\/g, "backslash");
  encodedPath = encodedPath.replace(/\//g, "forwardslash");
  addHelpers();
  var template = handlebars.compile(encodedPath);
  var pathProper = template({ context: context, model: model });

  pathProper = pathProper.replace(/backslash/g, '\\');
  pathProper = pathProper.replace(/forwardslash/g, '/');
  callback(`Input path ${chalk.yellow(path)} to ${chalk.green(encodedPath)} to ${chalk.green(pathProper)}`);   

  pathProper = pathProper.replace(".hbs", "");
  return pathProper;
}

// generate files based on template folder given
const generate = function(templatesDirectory: string, workspaceDirectory: string, codeTreeItem: CodeTreeItem, model: FeatureDesignItem, context: FeatureDesign, callback: any) {
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
    codeTreeItem.children.forEach(function(child) {
      generate(templatesDirectory, workspaceDirectory, child, model, context, callback);
    });
  } else {
   
    // execute the compiled template and write to new file
    var output = generateNode(templatesDirectory, workspaceDirectory, codeTreeItem, model, context, callback);
    if(output) {
      var destProper = replacePlaceholders(codeTreeItem.destinationPath, model, context, callback);
      fs.writeFileSync(destProper, output); 
      callback(`File created ${chalk.green(destProper)}`);   
    }
  }
};

const generateNode = function(
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
    //, (error, data) => {
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
  //});
  //return undefined;
};

const listTemplates = function(location: string) {
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
            listTemplates(c)))));
    })
  }
  return templates;
}

const addHelpers = function() {
  handlebars.registerHelper("loud", function (aString: string) {
    return aString.toUpperCase()
  })
  handlebars.registerHelper("camel", function (aString: string) {
    return aString
      .replace(/\s(.)/g, function($1) { return $1.toUpperCase(); })
      .replace(/\s/g,'')
      .replace(/^(.)/, function($1) { return $1.toLowerCase(); });
  })
  handlebars.registerHelper("kebab", function (aString: string) {
    return aString &&
      aString
        .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
        ?.map(x => x.toLowerCase())
        .join('-');
  })
  handlebars.registerHelper("plural", function (aString: string) {
    return pluralize(aString);
  })
  handlebars.registerHelper("escape", function(variable: string) {
    return variable.replace(/(['"])/g, '\\$1');
  });
  // handlebars.registerHelper("if_eq", function(a, b, opts) {
  //   if (a == b) {
  //       return opts.fn(this);
  //   } else {
  //       return opts.inverse(this);
  //   }
  //});
}

export { listTemplates, generate, generateNode }