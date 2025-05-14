import { serve } from '@hono/node-server';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { getRestaurantsByTime } from './restaurants.js';

const app = new Hono().get(
	'/restaurants',
	// middleware that validates query params via a Zod schema
	zValidator(
		'query',
		z.object({
			time: z.string().datetime(),
		}),
	),
	async (ctx) => {
		// ctx.req.valid() will return the validated data or throw if validation fails
		const { time } = ctx.req.valid('query');
		const openRestaurants = await getRestaurantsByTime(time);
		return ctx.json(openRestaurants);
	},
);

const server = serve(app, () => {
	console.log('Server running on http://localhost:3000');
});

// graceful shutdown
process.on('SIGINT', () => {
	server.close();
	process.exit(0);
});
process.on('SIGTERM', () => {
	server.close((err) => {
		if (err) {
			console.error(err);
			process.exit(1);
		}
		process.exit(0);
	});
});
