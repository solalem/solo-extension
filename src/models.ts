import * as path from "path";

export class SoloConfig {

	constructor(
		public name: string,
		public description: string,
		public features: Feature[],
		public templates: Template[]
	) {
	}
}

export class Feature {

	constructor(
		public name: string,
		public model: string,
		public implementations: Implementation[],
	) {
	}

    getModelFileName(): string {
        const fileName = path.basename(this.model);
        return fileName.endsWith('.json') ? fileName : fileName + ".json";
    }
}

export class Implementation {

	constructor(
		public template: string,
		public workingDirectory: string,
	) {
	}
}

export class Template {

	constructor(
		public name: string,
		public version: string,
	) {
	}
}
