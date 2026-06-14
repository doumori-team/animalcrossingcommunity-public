import { defineConfig, devices } from '@playwright/test';

// npx playwright install firefox

export default defineConfig({
	testDir: './tests/playwright',
	fullyParallel: false,
	workers: 1,
	retries: 0,
	reporter: 'list',
	projects: [
		{ name: 'Firefox', use: { ...devices['Desktop Firefox'] } },
	],
	use: {
		baseURL: 'https://staging.animalcrossingcommunity.com',
		headless: true,
	},
});
