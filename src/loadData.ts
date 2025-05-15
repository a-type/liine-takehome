import { parse } from '@fast-csv/parse';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { z } from 'zod';

// I know the prompt says to assume the CSV is valid, but with TS and Zod, it's just
// as easy to validate (which produces correct typing of output data) as it is to
// handwrite a type and manually cast it, and I like having types.
export const restaurantRowSchema = z.object({
	name: z.string(),
	hours: z.string(),
});

// loads restaurants from 'restaurants.csv' in the current working directory
export async function loadRestaurants() {
	const csv = fs.createReadStream(
		path.resolve(process.cwd(), 'restaurants.csv'),
		'utf-8',
	);
	const results: z.infer<typeof restaurantRowSchema>[] = [];
	await new Promise<void>((resolve, reject) => {
		const parser = parse({ headers: ['name', 'hours'], renameHeaders: true })
			.on('data', (row) => {
				results.push(restaurantRowSchema.parse(row));
			})
			.on('error', reject)
			.on('end', resolve);
		csv.pipe(parser);
	});
	return results;
}
