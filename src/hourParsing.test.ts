import { describe, expect, it } from 'vitest';
import {
	expandDayRange,
	extractDay,
	extractDayRange,
	extractDayRanges,
	extractNumber,
	extractTime,
	extractTimeRange,
	parseHourRange,
	parseHours,
} from './hourParsing.ts';

describe('parsing restaurant hours', () => {
	it.each([
		[
			'Mon-Wed 11:00 am - 10 pm',
			[
				{
					days: [1, 2, 3],
					startTimeMinutes: 11 * 60,
					endTimeMinutes: 22 * 60,
				},
			],
		],
		[
			'Mon-Thu, Sun 11:30 am - 9 pm  / Fri-Sat 11:30 am - 10 pm',
			[
				{
					days: [1, 2, 3, 4, 0],
					startTimeMinutes: 11 * 60 + 30,
					endTimeMinutes: 21 * 60,
				},
				{
					days: [5, 6],
					startTimeMinutes: 11 * 60 + 30,
					endTimeMinutes: 22 * 60,
				},
			],
		],
		[
			'Mon-Thu 11 am - 10 pm  / Fri-Sat 10 am - 10:30 pm  / Sun 11 am - 11 pm',
			[
				{
					days: [1, 2, 3, 4],
					startTimeMinutes: 11 * 60,
					endTimeMinutes: 22 * 60,
				},
				{
					days: [5, 6],
					startTimeMinutes: 10 * 60,
					endTimeMinutes: 22 * 60 + 30,
				},
				{
					days: [0],
					startTimeMinutes: 11 * 60,
					endTimeMinutes: 23 * 60,
				},
			],
		],
		// special case - midnight wrap
		[
			'Sat-Sun 11 pm - 3 am / M, W, F 7 pm - 1 am',
			[
				{
					days: [6, 0],
					startTimeMinutes: 23 * 60,
					endTimeMinutes: 24 * 60,
				},
				{
					days: [0, 1],
					startTimeMinutes: 0,
					endTimeMinutes: 3 * 60,
				},
				{
					days: [1, 3, 5],
					startTimeMinutes: 19 * 60,
					endTimeMinutes: 24 * 60,
				},
				{
					days: [2, 4, 6],
					startTimeMinutes: 0,
					endTimeMinutes: 1 * 60,
				},
			],
		],
	])('parses %s', (input, expected) => {
		expect(parseHours(input)).toEqual(expected);
	});
});

describe('extracting numbers', () => {
	it.each([
		['11:00', 11, ':00'],
		['1 am', 1, ' am'],
	])('extracts %s into %d and %s', (input, expected, rest) => {
		const [number, rest2] = extractNumber(input);
		expect(number).toEqual(expected);
		expect(rest2).toEqual(rest);
	});
});

describe('extracting time', () => {
	it.each([
		['11:00 am', 11 * 60, ''],
		['1:30 pm', 13 * 60 + 30, ''],
		['1 am', 1 * 60, ''],
		['2:30 pm - 3:30 pm', 14 * 60 + 30, ' - 3:30 pm'],
		['10 pm', 22 * 60, ''],
		['12 am', 0, ''],
		['12:30 am', 30, ''],
		['12 pm', 12 * 60, ''],
	])('extracts %s into %d and %s', (input, expected, rest) => {
		const [time, rest2] = extractTime(input);
		expect(time).toEqual(expected);
		expect(rest2).toEqual(rest);
	});
});

describe('extracting time ranges', () => {
	it.each([
		['11:00 am - 10 pm', [11 * 60, 22 * 60], ''],
		['1:30 pm - 3:30 pm', [13 * 60 + 30, 15 * 60 + 30], ''],
		['1 am - 2 am', [1 * 60, 2 * 60], ''],
	])('extracts %s into %s and %s', (input, expected, rest) => {
		const [timeRange, rest2] = extractTimeRange(input);
		expect(timeRange).toEqual(expected);
		expect(rest2).toEqual(rest);
	});
});

describe('extracting days', () => {
	it.each([
		['Mon', 1, ''],
		['Mon-Fri', 1, '-Fri'],
		['Wednesday', 3, ''],
		['Tues-Sat', 2, '-Sat'],
	])('extracts %s into %s and %s', (input, expected, rest) => {
		const [days, rest2] = extractDay(input);
		expect(days).toEqual(expected);
		expect(rest2).toEqual(rest);
	});
});

describe('extracting day ranges', () => {
	it.each([
		['Mon-Wed', [1, 3], ''],
		['Mon-Fri', [1, 5], ''],
		['Wed-Sun', [3, 0], ''],
		['Sat', [6, 6], ''],
	])('extracts %s into %s and %s', (input, expected, rest) => {
		const [days, rest2] = extractDayRange(input);
		expect(days).toEqual(expected);
		expect(rest2).toEqual(rest);
	});
});

describe('extracting multiple day ranges', () => {
	it.each([
		[
			'Mon-Wed, Fri-Sun',
			[
				[1, 3],
				[5, 0],
			],
			'',
		],
		[
			'Mon-Fri, Sat',
			[
				[1, 5],
				[6, 6],
			],
			'',
		],
		[
			'Sun, Mon-Wed',
			[
				[0, 0],
				[1, 3],
			],
			'',
		],
		['Thurs-Fri 11:30 pm', [[4, 5]], '11:30 pm'],
	])('extracts %s into %s and %s', (input, expected, rest) => {
		const [ranges, rest2] = extractDayRanges(input);
		expect(ranges).toEqual(expected);
		expect(rest2).toEqual(rest);
	});
});

describe('parsing an hour range', () => {
	it.each([
		[
			'Mon-Sun 11 am - 10 pm',
			[
				{
					days: [1, 2, 3, 4, 5, 6, 0],
					startTimeMinutes: 11 * 60,
					endTimeMinutes: 22 * 60,
				},
			],
		],
		[
			'Sun-Mon, Wed 5 pm - 10 pm',
			[
				{
					days: [0, 1, 3],
					startTimeMinutes: 17 * 60,
					endTimeMinutes: 22 * 60,
				},
			],
		],
		[
			'Mon, Wed-Sun 11 am - 10 pm',
			[
				{
					days: [1, 3, 4, 5, 6, 0],
					startTimeMinutes: 11 * 60,
					endTimeMinutes: 22 * 60,
				},
			],
		],
		// special case: time range wraps around midnight
		[
			'Mon-Sun 11 pm - 3 am',
			[
				{
					days: [1, 2, 3, 4, 5, 6, 0],
					startTimeMinutes: 23 * 60,
					endTimeMinutes: 24 * 60,
				},
				{
					days: [2, 3, 4, 5, 6, 0, 1],
					startTimeMinutes: 0,
					endTimeMinutes: 3 * 60,
				},
			],
		],
	])('parses %s into %s', (input, expected) => {
		expect(parseHourRange(input)).toEqual(expected);
	});
});

describe('expanding a day range', () => {
	it.each([
		[
			[1, 3],
			[1, 2, 3],
		],
		[
			[3, 5],
			[3, 4, 5],
		],
		[
			[5, 1],
			[5, 6, 0, 1],
		],
		[
			[3, 0],
			[3, 4, 5, 6, 0],
		],
	] as [[number, number], number[]][])(
		'expands %s into %s',
		(input, expected) => {
			expect(expandDayRange(input)).toEqual(expected);
		},
	);
});
