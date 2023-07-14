export class FeatureDesign {

	constructor(
		public name: string,
		public description: string,
		public id: string,
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
