import path = require("node:path");

export class Model {

	constructor(
		public name: string,
		public description: string,
		public module: string,
		public fsPath: string,
		public entities: Entity[] | undefined
	) {
	}

    getModelFileName(): string {
        const fileName = path.basename(this.name);
        return fileName.endsWith('.json') ? fileName : fileName + ".json";
    }
}

export class Entity {

	constructor(
		public name: string,
		public aggregate: string,
		public description: string,
	) {
	}
}
