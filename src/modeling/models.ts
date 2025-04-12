export class Model {

	constructor(
		public id: string,
		public name: string,
		public description: string,
		public fsPath: string,
		public entities: Entity[] | undefined
	) {
	}

	// For backward compatibility with old templates
	public models = this.entities;
}

export class Entity {

	constructor(
		public name: string,
		public aggregate: string,
		public description: string,
	) {
	}
}
