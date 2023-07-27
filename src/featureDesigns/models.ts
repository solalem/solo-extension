export class FeatureDesign {

	constructor(
		public id: string,
		public name: string,
		public description: string,
		public fsPath: string,
		public items: FeatureDesignItem[] | undefined
	) {
	}
}

export class FeatureDesignItem {

	constructor(
		public name: string,
		public description: string,
	) {
	}
}
