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
		public templates: string[],
	) {
	}

	getModelId(): string {
		const fileName = this.getModelFileName();
		return fileName.endsWith('.json') ? fileName.slice(0, -5) : fileName;
	}

    getModelFileName(): string {
        const fileName = path.basename(this.model);
        return fileName.endsWith('.json') ? fileName : fileName + ".json";
    }
}

export class Template {

	constructor(
		public name: string,
		public version: string,
	) {
	}
}
