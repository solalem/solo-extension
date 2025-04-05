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

	getDesignFileName(): string {
		return this.model + ".json";
	}
}

export class Template {

	constructor(
		public name: string,
		public version: string,
	) {
	}
}
