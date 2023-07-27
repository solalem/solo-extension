
export class SoloConfig {

	constructor(
		public name: string,
		public description: string,
		public features: Feature[]
	) {
	}
}

export class Feature {

	constructor(
		public name: string,
		public design: string,
		public blueprints: Blueprint[],
	) {
	}
}

export class Blueprint {

	constructor(
		public name: string,
		public version: string,
	) {
	}
}

export class CodeTree {
	public children: CodeTreeItem[]

	constructor(
		public name: string,
		public description: string,
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
		public designId: string,
		public itemName: string,
		public children: CodeTreeItem[]
	) {
	}
}
