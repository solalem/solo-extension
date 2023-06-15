import { FeatureDesign } from "../featureDesigns/models";

export class CodeTree {
	public children: CodeTreeItem[]

	constructor(
		public name: string,
		public description: string,
		//public fsPath: string,
	) {
		this.children = [];
	}
}

export class CodeTreeItem {

	constructor(
		public name: string,
		public type: string,
		public description: string,
		public destinationPath: string,
		public templatePath: string,
		public designName: string,
		public itemName: string,
		public children: CodeTreeItem[]
	) {
	}
}
