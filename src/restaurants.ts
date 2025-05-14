import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { z } from 'zod';

// I know the prompt says to assume the CSV is valid, but with TS and Zod, it's just
// as easy to validate (which produces correct typing of output data) as it is to
// handwrite a type and manually cast it, and I like having types.
const restaurantRowSchema = z.object({
	name: z.string(),
	hours: z.string(),
});

// loads restaurants from 'restaurants.csv' in the current working directory
async function loadRestaurants() {
	const csv = await fs.readFile(
		path.resolve(process.cwd(), 'restaurants.csv'),
		'utf-8',
	);
	const rows = csv.split('\n').slice(1); // Skip header row
	return rows.map((row) => {
		const [name, hours] = row.split(',');
		return restaurantRowSchema.parse({ name, hours });
	});
}

// TODO: pipeline from CSV to whatever datastructure I want for
// time lookups

// parsing the hours into a format for lookup
// exported for testing
// TODO: decide what format to use for hours
export function parseHours(hours: string): unknown {
	return [];
}

export async function getRestaurantsByTime(
	time: string,
): Promise<z.infer<typeof restaurantRowSchema>[]> {
	const asDate = new Date(time);
	// while this is validated at the API level, no reason to not check it here
	if (isNaN(asDate.getTime())) {
		throw new Error('Invalid date');
	}

	// TODO: implement this
	return [];
}
