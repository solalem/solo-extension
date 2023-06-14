import * as chalk from "chalk";
import * as handlebars from "handlebars";
import { FeatureDesign, FeatureDesignItem } from "../featureDesigns/models";
import pluralize = require("pluralize");

// replace filename path placeholders using handlebars
export const replacePlaceholders = function (path: string, model: FeatureDesignItem, context: FeatureDesign, callback: any) {
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
};

export const addHelpers = function() {
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
