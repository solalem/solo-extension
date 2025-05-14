# Introduction

Design you features easily with JSON and use available code blueprints to generate your codes.

# Development

Clone the repo.

Install npm dependencies.

Open extension development host with F5 or run from Debug tab

In the opened host vs code session, open the `samples` folder

Open vs code `Settings` and update `solo.templateDirectory` to `templates` if not set already. This will use local sample template.

Use the Feature to manage model entities and the Code Tree panel to see the generated code structure from you models based on sample template.

# Extension Usage

Install extension from marketplace. COMING SOON.

## 1. Prepare

Copy sample templates from `samples` to `templates` under directory of your choice (Default is `Documents/templates` under the current user profile). You should change vscode setting for `solo.templateDirectory` to point to the changed location.

> NOTE: This is going to be automated in the future. Something similar to package managers: `solo i <unique_templlate_name> -v <optional_version>`

> The following steps describe the details of setting up solution and models. You can copy files from samples folder if you don't need to follow them.

## 2. Configure Your Solution
Build your solution config and save it as `solo.config` under a folder called `models` in your working directory. This is the main file that controls the whole solution/ project.

```json
{
  "name": "Project X",
  "description": "",
  "features": [
    {
      "name": "Frontend Example",
      "model": "models/model1",
      "implementations": [ { "template": "reactjs-sample" } ]
    }
  ],
  "templates": {
    "reactjs-sample": "1.0"
  }
}
```
## 3. Design Your Feature
Designing a feature is as simple as building class and property definitions. But, you are not limited to following ER design style as long as your code blueprints properly consume them.

Save the following code in a folder called `models` with filename `model1.json`.

```json
{
  "id": "model1",
  "name": "Feature 1",
  "description": "test1",
  "solution": "SoloTest",
  "context": "Feature1",
  "entities": [
    {
      "name": "Order",
      "aggregate": "Order",
      "description": "An order from customer",
      "properties": [
        {
          "name": "Name",
          "description": "Name",
          "type": "String",
          "required": true
        },
        {
          "name": "Status",
          "description": "Status",
          "type": "int"
        },
        {
          "name": "OrderLines",
          "description": "OrderLines",
          "type": "OrderLine",
          "array": true
        },
        {
          "name": "Remarks",
          "description": "Remarks",
          "type": "String"
        }
      ]
    },
    {
      "name": "OrderLine",
      "aggregate": "Order",
      "description": "Item in an order.",
      "properties": [
        {
          "name": "ProductId",
          "description": "String",
          "type": "int"
        },
        {
          "name": "ProductName",
          "description": "Product name at time of ordering",
          "type": "String"
        },
        {
          "name": "Quantity",
          "description": "Quantity",
          "type": "int"
        },
        {
          "name": "UnitPrice",
          "description": "Unit Price",
          "type": "Decimal"
        },
        {
          "name": "OrderId",
          "description": "OrderId",
          "type": "String"
        }
      ]
    }
  ]
}
```

## 3. Open The Solo Explorer
Check out your models in feature design view. You can also see code generator preview as code-tree. Click on Refresh button after changes in model.
