export class FeatureDesign {

	constructor(
		public id: string,
		public name: string,
		public description: string,
		public fsPath: string,
		public models: Model[] | undefined
	) {
	}
}

export class Model {

	constructor(
		public name: string,
		public aggregate: string,
		public description: string,
	) {
	}
}
