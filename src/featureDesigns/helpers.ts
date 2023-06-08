
export function ifArrayAInArrayB(A: (string | number)[], B: (string | number)[][]) {
	let A_flatten = A.map(x => x.toString()).join();
	let B_flatten = B.map(x => x.join());

	return withinOf(A_flatten, B_flatten);
}

function withinOf(A: string, B: string[]) {
	for (let i = 0; i < B.length; i++) {
		let A_array = A.split(",");
		let B_sub_array = B[i].split(",");

		/* return true if A_array is a sub array of B_sub_array */
		if (A_array.length <= B_sub_array.length) {
			let j;
			for (j = 0; j < A_array.length; j++) {
				if (A_array[j] !== B_sub_array[j]) {
					break;
				}
			}

			if (j === A_array.length) {
				return true;
			}
		}
	}

	return false;
}