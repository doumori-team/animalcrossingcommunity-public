#!/usr/bin/env node

const { execSync } = require('child_process');

const APP_NAME = 'animalcrossingcommunity2';
const DISTRIBUTION_ID = 'E3HON938G0J3BG';

// Get the first argument passed to the script
const mode = process.argv[2];

if (!mode || (mode !== 'on' && mode !== 'off')) {
	console.error('Usage: npm run maintenance -- [on|off]');
	process.exit(1);
}

function commandExists(command) {
	try {
		execSync(`${command} --version`, { stdio: 'ignore' });
		return true;
	} catch (err) {
		console.error('Failed to toggle check if command exists.', err);
		return false;
	}
}

// Check for required CLIs
if (!commandExists('flyctl')) {
	console.error('Error: Fly CLI is not installed or not in PATH. https://fly.io/docs/flyctl/install/');
	process.exit(1);
}

if (!commandExists('aws')) {
	console.error('Error: AWS CLI is not installed or not in PATH. https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html');
	process.exit(1);
}

// Toggle Fly io maintenance mode
try {
	console.log(`Turning maintenance ${mode}...`);
	const value = mode === 'on' ? 'true' : 'false';
	execSync(`flyctl secrets set MAINTENANCE_MODE=${value} -a ${APP_NAME}`, { stdio: 'inherit' });
} catch (err) {
	console.error('Failed to toggle Fly maintenance mode.', err);
	process.exit(1);
}

// Invalidate CloudFront cache
try {
	console.log('Invalidating CloudFront cache...');
	execSync(`aws cloudfront create-invalidation --distribution-id ${DISTRIBUTION_ID} --paths "/*"`, { stdio: 'inherit' });
} catch (err) {
	console.error('Failed to invalidate CloudFront cache.', err);
	process.exit(1);
}

console.log('Done!');