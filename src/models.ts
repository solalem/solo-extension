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
		public options: Options,
		public templateOptions: TemplateOption[],
	) {
	}

	getDesignFileName(): string {
		return this.model + ".json";
	}
}

export class Options {

	constructor(
		public includes: string,
		public excludes: string,
	) {
	}
}

export class TemplateOption {

	constructor(
		public name: string,
		public includes: string,
		public excludes: string,
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
