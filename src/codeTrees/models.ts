export class CodeTree {

	constructor(
		public name: string,
		public description: string,
		public fsPath: string,
		public children: CodeTreeItem[]
	) {
	}
}

export class CodeTreeItem {

	constructor(
		public name: string,
		public type: string,
		public description: string,
		public children: CodeTreeItem[]
	) {
	}
}
