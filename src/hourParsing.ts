export type HourRange = {
	days: number[];
	startTimeMinutes: number;
	endTimeMinutes: number;
};

/**
 * Parses a raw hours string into an array of range representations.
 */
export function parseHours(hours: string): HourRange[] {
	const dayGroups = splitDayGroups(hours);
	return dayGroups.map((group) => parseHourRange(group));
}

/**
 * Splits groups of unrelated hour ranges into separate strings.
 * e.g. "Mon-Sat 11 am - 11 pm  / Sun 11 am - 10 pm" ->
 * 	"Mon-Sat 11 am - 11 pm", "Sun 11 am - 10 pm"
 */
function splitDayGroups(source: string): string[] {
	return source.split('/').map((group) => group.trim());
}

/**
 * Parses a single hour range string into a range representation.
 */
export function parseHourRange(source: string): HourRange {
	const [dayRanges, hours] = extractDayRanges(source);
	const [hourRange] = extractTimeRange(hours);
	const allDays = dayRanges.flatMap(expandDayRange);
	return {
		days: allDays,
		startTimeMinutes: hourRange[0],
		endTimeMinutes: hourRange[1],
	};
}

/**
 * Expands a day range into an array of encompassed days.
 */
export function expandDayRange([start, end]: [number, number]): number[] {
	if (start <= end) {
		return Array.from({ length: end - start + 1 }, (_, i) => start + i);
	} else {
		// wrap around
		return [
			...Array.from({ length: 7 - start }, (_, i) => (start + i) % 7),
			...Array.from({ length: end + 1 }, (_, i) => i % 7),
		];
	}
}

/**
 * Extracts a list of day ranges from the beginning of a string.
 * Returns the day ranges and the rest of the string.
 */
export function extractDayRanges(source: string): [[number, number][], string] {
	const ranges: [number, number][] = [];
	let rest = source;
	// we could encounter an arbitrary number of comma separated day ranges,
	// keep extracting until we reach a number
	while (rest.length > 0 && !/\d/.test(rest[0])) {
		const [range, rest2] = extractDayRange(rest);
		ranges.push(range);
		rest = consumeLeadingWhitespace(rest2);
		// comma means keep looking for ranges
		if (rest[0] === ',') {
			rest = consumeLeadingWhitespace(rest.slice(1));
		} else {
			// otherwise we can go ahead and break out
			break;
		}
	}
	return [ranges, rest];
}

/**
 * Extracts a day range from the beginning of a string.
 * Returns the start and end days of the week (0-6) and the rest of the string.
 */
export function extractDayRange(source: string): [[number, number], string] {
	let [startDay, rest] = extractDay(source);
	rest = consumeLeadingWhitespace(rest);
	if (rest[0] !== '-') {
		// single day
		return [[startDay, startDay], rest];
	}
	const [endDay, rest2] = extractDay(rest.slice(1));
	return [[startDay, endDay], rest2];
}

/**
 * Extracts a day from the beginning of a string.
 * Returns the day of the week (0-6) and the rest of the string.
 */
export function extractDay(source: string): [number, string] {
	const word = /^[a-zA-Z]+/;
	const match = source.match(word);
	if (!match) {
		throw new Error(`Invalid day abbreviation: ${source}`);
	}
	const day = match[0].toLowerCase();
	const dayOfWeek = dayAbbreviationToDayOfWeek(day);
	const rest = source.slice(day.length);
	return [dayOfWeek, rest];
}

/**
 * Extracts a time range from the beginning of a string.
 * Returns the time range in minutes and the rest of the string.
 */
export function extractTimeRange(source: string): [[number, number], string] {
	let [startTime, rest] = extractTime(source);
	rest = consumeLeadingWhitespace(rest);
	if (rest[0] !== '-') {
		throw new Error(`Invalid time range: ${source}`);
	}
	let [endTime, rest2] = extractTime(consumeLeadingWhitespace(rest.slice(1)));
	return [[startTime, endTime], rest2];
}

/**
 * Extracts a time from the beginning of a string.
 * Returns the time in minutes and the rest of the string.
 */
export function extractTime(source: string): [number, string] {
	let [hours, rest] = extractNumber(source);
	let minutes = 0;
	if (rest[0] === ':') {
		[minutes, rest] = extractNumber(rest.slice(1));
	}
	const time = hours * 60 + minutes;

	// account for am/pm
	rest = consumeLeadingWhitespace(rest);
	if (rest.startsWith('am')) {
		return [time, rest.slice(2)];
	} else if (rest.startsWith('pm')) {
		return [time + 12 * 60, rest.slice(2)];
	}

	// no am/pm is unexpected.
	throw new Error(`Invalid time format: ${source}`);
}

/**
 * Extracts a number from the beginning of a string.
 * Returns the number and the rest of the string.
 */
export function extractNumber(source: string): [number, string] {
	let numberString = '';
	let i = 0;
	while (i < source.length && /\d/.test(source[i])) {
		numberString += source[i];
		i++;
	}
	const number = parseInt(numberString, 10);
	const rest = source.slice(i);
	if (isNaN(number)) {
		throw new Error(`Invalid number: ${numberString}`);
	}
	return [number, rest];
}

function consumeLeadingWhitespace(source: string): string {
	let i = 0;
	while (i < source.length && /\s/.test(source[i])) {
		i++;
	}
	return source.slice(i);
}

// constructs a map of all possible non-ambiguous abbreviations for
// weekdays -- from their full length down to 2 characters
// do I _need_ O(1) lookup for this? eh, maybe not.
const dayNames = [
	'sunday',
	'monday',
	'tuesday',
	'wednesday',
	'thursday',
	'friday',
	'saturday',
];
const dayAbbreviations = new Map<string, number>(
	dayNames.flatMap((name, value) => {
		let abbreviations: [string, number][] = [];
		for (let i = name.length; i > 1; i--) {
			abbreviations.push([name.slice(0, i), value]);
		}
		return abbreviations;
	}),
);
export function dayAbbreviationToDayOfWeek(abbrev: string): number {
	const normalized = abbrev.toLowerCase();
	if (dayAbbreviations.has(normalized)) {
		return dayAbbreviations.get(normalized)!;
	}
	throw new Error(`Invalid day abbreviation: ${abbrev}`);
}
