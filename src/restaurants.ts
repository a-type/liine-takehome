import { writeFileSync } from 'node:fs';
import { parseHours } from './hourParsing.ts';
import { loadRestaurants } from './loadData.ts';
import {
	createRestaurantLookupTable,
	lookupRestaurantsByTime,
} from './lookup.ts';

// Startup: load the CSV file into a lookup table for use later
const rawRestaurants = await loadRestaurants();
const restaurantLookupTable = createRestaurantLookupTable(
	rawRestaurants.map((row) => ({
		name: row.name,
		hours: parseHours(row.hours),
	})),
);

writeFileSync(
	'./data/lookupTable.json',
	JSON.stringify(restaurantLookupTable, null, 2),
	'utf-8',
);

// out of curiosity, how many total lookup keys do we have?
console.log(
	`Loaded ${rawRestaurants.length} restaurants with ${
		restaurantLookupTable.flat().length
	} total lookup keys, ${
		restaurantLookupTable.flat().flat().length
	} total name entries, ~${Buffer.byteLength(
		JSON.stringify(restaurantLookupTable),
		'utf-8',
	)} bytes.`,
);

/**
 * Looks up the restaurants that are open at a given time.
 * @param time - any valid datetime string that can be parsed by the Date constructor
 * @returns a list of restaurant names that are open at the given time
 */
export function getRestaurantsByTime(time: string): string[] {
	const asDate = new Date(time);
	// while this is validated at the API level, no reason to not check it here
	if (isNaN(asDate.getTime())) {
		throw new Error('Invalid date');
	}

	return lookupRestaurantsByTime(restaurantLookupTable, asDate);
}
