# Introduction

Design you features easily with JSON and use available code blueprints to generate your codes.

# Example

## 1. Prepare Templates
Copy sample templates from `samples` to `templates` under `Documents` folder of the current user profile.

> NOTE: This is going to be automated in the future. Something similar to package managers: `solo i <unique_templlate_name> -v <optional_version>`

## 2. Configure Your Solution
Build your solution config and save it as `config.json` under a folder called `design` in your working directory.
```json
{
    "name": "Project X",
    "description": "",
    "features": [
        {
            "name": "Frontend Example",
            "design": "design1",
            "blueprints": {
                "reactjs-sample": "1.0"
            }
        },
        {
            "name": "Backend Example",
            "design": "design1",
            "blueprints": {
                "aspnet-sample": "1.0"
            }
        }
    ]
}
```
## 3. Design Your Feature
Designing a feature is as simple as building class and property definitions. But you are not limited to following ER design style as long as your code blueprints properly consume them.

While you are in `solo` folder, save the following code in a folder called `designs` with filename `design1.json`.
```json
{
    "id": "design1.json",
    "name": "Feature 1",
    "description": "test1",
    "solution": "SoloTest",
    "context": "Feature1",
    "items": [
        {
            "name": "Foo",
            "properties": [
                {
                    "name": "Id",
                    "type": "int",
                    "description": "id desc"
                },
                {
                    "name": "Name",
                    "type": "string",
                    "description": "name desc"
                }
            ]
        }
    ]
}
```

## 3. Open The Solo Explorer
Check out your designs. You can also see code generator priview as code-tree.
