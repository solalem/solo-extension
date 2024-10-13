export class SoloConfig {

	constructor(
		public name: string,
		public description: string,
		public features: Feature[],
		public blueprints: Blueprint[]
	) {
	}
}

export class Feature {

	constructor(
		public name: string,
		public design: string,
		public blueprint: string,
	) {
	}

	getDesignFileName(): string {
		return this.design + ".json";
	}
}

export class Blueprint {

	constructor(
		public name: string,
		public version: string,
	) {
	}
}
