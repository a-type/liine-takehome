import { describe, expect, it } from 'vitest';
import {
	createRestaurantLookupTable,
	lookupRestaurantsByTime,
} from './lookup.ts';

describe('creating a time lookup table', () => {
	it('expands day and time ranges to multiple entries', () => {
		const table = createRestaurantLookupTable([
			{
				name: 'Figulina',
				hours: [
					{
						days: [1, 2, 3, 6],
						startTimeMinutes: 12 * 60,
						endTimeMinutes: 22 * 60,
					},
					{
						days: [0],
						startTimeMinutes: 12 * 60,
						endTimeMinutes: 15 * 60 + 30,
					},
				],
			},
		]);
		expect(table[0][12 * 60 - 1]).toBeFalsy();
		expect(table[0][12 * 60]).toEqual(['Figulina']);
		expect(table[0][12 * 60 + 1]).toEqual(['Figulina']);
		expect(table[0][15 * 60 + 30]).toEqual(['Figulina']);
		// no entry at Sun 15:31
		expect(table[0][15 * 60 + 31]).toBeFalsy();
		// total the entries for Sun
		expect(table[0].filter((entry) => entry).length).toEqual(
			// + 1 (fenceposting) -- includes the start minute
			// i.e. if you were open from 1:00 to 1:05, you'd have 6 entries
			// 1:00, 1:01, 1:02, 1:03, 1:04, 1:05
			15 * 60 + 30 - 12 * 60 + 1,
		);

		// check a sample of the other days
		expect(table[1][12 * 60]).toEqual(['Figulina']);
		expect(table[1][22 * 60]).toEqual(['Figulina']);
		expect(table[1][22 * 60 + 1]).toBeFalsy();
		expect(table[2][12 * 60]).toEqual(['Figulina']);
		expect(table[2][22 * 60]).toEqual(['Figulina']);
		expect(table[2][22 * 60 + 1]).toBeFalsy();
	});

	it('handles overlapping ranges from different restaurants', () => {
		const table = createRestaurantLookupTable([
			{
				name: 'Figulina',
				hours: [
					{
						days: [1, 2, 3, 6],
						startTimeMinutes: 12 * 60,
						endTimeMinutes: 22 * 60,
					},
					{
						days: [0],
						startTimeMinutes: 12 * 60,
						endTimeMinutes: 15 * 60 + 30,
					},
				],
			},
			{
				name: 'Standard',
				hours: [
					{
						days: [2, 3, 4, 5, 6],
						startTimeMinutes: 10 * 60,
						endTimeMinutes: 21 * 60,
					},
					{
						days: [0],
						startTimeMinutes: 12 * 60 + 30,
						endTimeMinutes: 17 * 60 + 30,
					},
				],
			},
		]);
		// Note: multi-entry ordering is not defined, but in practice follows
		// the order of the input data.
		expect(table[0][12 * 60]).toEqual(['Figulina']);
		expect(table[0][15 * 60 + 30]).toEqual(['Figulina', 'Standard']);
		expect(table[0][17 * 60 + 30]).toEqual(['Standard']);
		expect(table[1][12 * 60]).toEqual(['Figulina']);
		expect(table[2][12 * 60]).toEqual(['Figulina', 'Standard']);
	});
});

describe('finding restaurants for a given time', () => {
	const table = createRestaurantLookupTable([
		{
			name: 'Figulina',
			hours: [
				{
					days: [1, 2, 3, 6],
					startTimeMinutes: 12 * 60,
					endTimeMinutes: 22 * 60,
				},
				{
					days: [0],
					startTimeMinutes: 12 * 60,
					endTimeMinutes: 15 * 60 + 30,
				},
			],
		},
		{
			name: 'Standard',
			hours: [
				{
					days: [2, 3, 4, 5, 6],
					startTimeMinutes: 10 * 60,
					endTimeMinutes: 23 * 60 + 59,
				},
				{
					days: [0],
					startTimeMinutes: 12 * 60 + 30,
					endTimeMinutes: 17 * 60 + 30,
				},
			],
		},
		// overlap midnight
		{
			name: 'Brodeto',
			hours: [
				{
					days: [1],
					startTimeMinutes: 19 * 60,
					endTimeMinutes: 24 * 60,
				},
				{
					days: [2],
					startTimeMinutes: 0,
					endTimeMinutes: 1 * 60,
				},
			],
		},
		// end exactly at midnight
		{
			name: 'Stanbury',
			hours: [
				{
					days: [0],
					startTimeMinutes: 22 * 60,
					endTimeMinutes: 24 * 60,
				},
				{
					days: [1],
					startTimeMinutes: 0,
					endTimeMinutes: 0,
				},
			],
		},
	]);
	it('returns correct results matching multiple restaurants', () => {
		const result = lookupRestaurantsByTime(
			table,
			// Wed 12:00
			new Date('2025-05-14T12:00:00Z'),
		);
		expect(result).toEqual(['Figulina', 'Standard']);
	});
	it('returns correct results matching a single restaurant', () => {
		const result = lookupRestaurantsByTime(
			table,
			// Mon 13:00
			new Date('2025-05-12T13:00:00Z'),
		);
		expect(result).toEqual(['Figulina']);
	});
	it('returns empty array when no restaurants are open', () => {
		const result = lookupRestaurantsByTime(
			table,
			// Mon 00:00
			new Date('2025-05-16T00:00:00Z'),
		);
		expect(result).toEqual([]);
	});
	it('handles boundary times between minutes', () => {
		const result = lookupRestaurantsByTime(
			table,
			// Mon 22:00:05 (Figulina closes at 22:00)
			new Date('2025-05-12T22:00:05Z'),
		);
		expect(result).toEqual(['Brodeto']);
	});
	it('handles boundary times at 11:59', () => {
		const result = lookupRestaurantsByTime(
			table,
			// Sat 11:59:30 (Standard closes at 11:59)
			new Date('2025-05-17T23:59:30Z'),
		);
		expect(result).toEqual([]);
		// but just to check, 11:59:00 is ok
		const result2 = lookupRestaurantsByTime(
			table,
			// Sat 11:59:00 (Standard closes at 11:59)
			new Date('2025-05-17T23:59:00Z'),
		);
		expect(result2).toEqual(['Standard']);
	});
	it('handles boundary times at midnight', () => {
		const result = lookupRestaurantsByTime(
			table,
			// Tue 00:00:00 (Brodeto is open through midnight)
			new Date('2025-05-13T00:00:00Z'),
		);
		expect(result).toEqual(['Brodeto']);
	});
	it('handles ranges that end at midnight', () => {
		const result = lookupRestaurantsByTime(
			table,
			// Mon 00:00:00 (Stanbury is open up to midnight)
			new Date('2025-05-12T00:00:00Z'),
		);
		expect(result).toEqual(['Stanbury']);
		// also check the prior minute
		const result2 = lookupRestaurantsByTime(
			table,
			// Sun 23:59:00
			new Date('2025-05-11T23:59:00Z'),
		);
		expect(result2).toEqual(['Stanbury']);
		// and the next minute
		const result3 = lookupRestaurantsByTime(
			table,
			// Mon 00:01:00
			new Date('2025-05-12T00:01:00Z'),
		);
		expect(result3).toEqual([]);
		// and a few seconds after midnight
		const result4 = lookupRestaurantsByTime(
			table,
			// Mon 00:00:05
			new Date('2025-05-12T00:00:05Z'),
		);
		expect(result4).toEqual([]);
	});
});
