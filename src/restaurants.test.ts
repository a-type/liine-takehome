import { describe, expect, it } from 'vitest';
import { parseHours } from './restaurants.js';

describe('parsing restaurant hours', () => {
	it.todo.each([
		[
			'Mon-Sun 11:00 am - 10 pm',
			[
				/* TODO: what format? */
			],
		],
	])('parses %s into %s', (input, expected) => {
		expect(parseHours(input)).toEqual(expected);
	});
});
