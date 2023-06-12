import * as json from "jsonc-parser";

export class FeatureDesign {
	//public tree: json.Node;
	
	constructor(
		public name: string,
		public description: string,
		public fsPath: string,
		public items: FeatureDesignItem[] | undefined
	) {
		//this.tree = { offset: 0, length: 0, type: 'null' };// TODO: check default
	}
}

export class FeatureDesignItem {

	constructor(
		public name: string,
		public description: string,
	) {
	}
}
