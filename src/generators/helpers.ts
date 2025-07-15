import * as chalk from "chalk";
import * as handlebars from "handlebars";
import { Model, Entity } from "../modeling/models";
import pluralize = require("pluralize");

// replace filename path placeholders using handlebars
export const replacePlaceholders = function (path: string, entity: Entity, model: Model, callback: any) {
  // Handlebars doesn't like \ and / chars in filenames. So temporary replace them with some silly text
  let encodedPath = path.replace(/\\/g, "backslash");
  encodedPath = encodedPath.replace(/\//g, "forwardslash");
  addHelpers();
  const template = handlebars.compile(encodedPath);
  let pathProper = template({ context: model, entity: entity, model: entity });

  pathProper = pathProper.replace(/backslash/g, '\\');
  pathProper = pathProper.replace(/forwardslash/g, '/');
  callback(`Input path ${chalk.yellow(path)} to ${chalk.green(encodedPath)} to ${chalk.green(pathProper)}`);

  pathProper = pathProper.replace(".hbs", "");
  return pathProper;
};

export const addHelpers = function() {
  handlebars.registerHelper("loud", function (aString) {
    return aString.toUpperCase()
  })
  handlebars.registerHelper("louds", function (aString) {
    return pluralize(aString).toUpperCase()
  })
  function camelCase(aString: String) {
    return aString && aString
      .replace(/\s(.)/g, function($1) { return $1.toUpperCase(); })
      .replace(/\s/g,'')
      .replace(/^(.)/, function($1) { return $1.toLowerCase(); });
  }
  handlebars.registerHelper("camel", function (aString) {
    return camelCase(aString);
  })
  handlebars.registerHelper("camels", function (aString) {
    return camelCase(pluralize(aString));
  })
  
  function kebabCase(aString: String) {
    return aString?.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)?.map(x => x.toLowerCase()).join('-');
  }
  handlebars.registerHelper("kebab", function (aString) {
    return kebabCase(aString);
  })
  handlebars.registerHelper("kebabs", function (aString) {
    return kebabCase(pluralize(aString));
  })
  
  function snakeCase(aString: String) {
    return aString?.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)?.map(x => x.toLowerCase()).join('_');
  }
  handlebars.registerHelper("snake", function (aString) {
    return snakeCase(aString);
  })
  handlebars.registerHelper("snakes", function (aString) {
    return snakeCase(pluralize(aString));
  })

  handlebars.registerHelper("plural", function (aString) {
    return pluralize(aString);
  })
  handlebars.registerHelper("escape", function(variable) {
    return variable.replace(/(['"])/g, '\\$1');
  });
  handlebars.registerHelper("if_eq", function(a, b, opts) {
    if (a == b) {
      return opts.fn(this); // TODO: disabled strict mode for now, because it doesn't work 
    } else {
      return opts.inverse(this);
    }
  });

  handlebars.registerHelper("if_not_eq", function(a, b, opts) {
    if (a != b) {
      return opts.fn(this);
    } else {
      return opts.inverse(this);
    }
  });

  handlebars.registerHelper("pascal", function (aString) {
    return pascalCase(aString);
  });

  handlebars.registerHelper("pascals", function (aString) {
    return pascalCase(pluralize(aString));
  });

  function pascalCase(aString) {
    return aString && aString
      .replace(/[-_\s]+/g, ' ') // Replace underscores, hyphens, and spaces with spaces
      .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  handlebars.registerHelper("title", function (aString) {
    return titleCase(aString);
  });

  handlebars.registerHelper("titles", function (aString) {
    return titleCase(pluralize(aString));
  });

  function titleCase(aString) {
    return aString && aString
      .replace(/[-_\s]+/g, ' ') // Replace underscores, hyphens, and spaces with spaces
      .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
      .map(word => word.charAt(0).toUpperCase() + ' ' + word.slice(1).toLowerCase())
      .join('');
  }
};
