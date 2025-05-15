import { type HourRange } from './hourParsing.ts';

// note: behind the scenes, JS uses hash tables for sparse arrays
// anyway, so choosing between an object and an array is mostly a matter of style.
export type RestaurantLookupTable = string[][][];

export function createRestaurantLookupTable(
	data: { name: string; hours: HourRange[] }[],
) {
	const lookupTable: RestaurantLookupTable = [];
	for (const { name, hours } of data) {
		for (const { days, startTimeMinutes, endTimeMinutes } of hours) {
			for (const day of days) {
				// initialize day if it doesn't exist
				lookupTable[day] ??= [];
				// add the restaurant name to each minute in the range (inclusive)
				for (
					let minute = startTimeMinutes;
					minute <= endTimeMinutes;
					minute++
				) {
					lookupTable[day][minute] ??= [];
					lookupTable[day][minute].push(name);
				}
			}
		}
	}
	return lookupTable;
}

export function lookupRestaurantsByTime(
	lookupTable: RestaurantLookupTable,
	dateTime: Date,
): string[] {
	const day = dateTime.getDay();
	const timeInMinutes = dateTime.getHours() * 60 + dateTime.getMinutes();
	// the time may fall between minutes, so we intersect the given minute with the next
	// one for the final result. for example, if the query time is 11:00:05,
	// we want to include restaurants that are open from 11:00 and 11:01 only,
	// not ones that close at 11:00 or open at 11:01.
	// We only do this if there are seconds.
	const nextMinute =
		dateTime.getSeconds() > 0 ? (timeInMinutes + 1) % (24 * 60) : timeInMinutes;
	// edge case: if the next minute is midnight, we need to check the next day
	const nextDay = nextMinute === 0 ? (day + 1) % 7 : day;
	// since we're overlapping two minutes, we must deduplicate the results.
	// this also deduplicates the individual minute lists, which were not
	// deduplicated when loading up the table, so that's convenient.
	const startResult = new Set(lookupTable[day][timeInMinutes] ?? []);
	const endResult = new Set(lookupTable[nextDay][nextMinute] ?? []);
	return Array.from(setIntersection(startResult, endResult));
}

function setIntersection(setA: Set<string>, setB: Set<string>): Set<string> {
	const intersection = new Set<string>();
	for (const item of setA) {
		if (setB.has(item)) {
			intersection.add(item);
		}
	}
	return intersection;
}
