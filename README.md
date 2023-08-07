# Introduction

Design you features easily with JSON and use available code blueprints to generate your codes.

# Example

## 1. Configure Your Solution
Build your solution config and save it as `config.json` under a folder called `design` in your working directory.
```json
{
    "name": "Project X",
    "description": "",
    "features": [
        {
            "name": "Frontend Example",
            "design": "Feature 1",
            "blueprints": {
                "reactjs": "1.0"
            }
        },
        {
            "name": "Backend Example",
            "design": "Feature 1",
            "blueprints": {
                "aspnet-rest": "1.0"
            }
        }
    ]
}
```
## 2. Design Your Feature
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
