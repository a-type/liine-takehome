import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		mockReset: true,
		environment: 'node',
		globalSetup: './vitest.setup.ts',
	},
});
