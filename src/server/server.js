import express from 'express';

import path from 'path';

const app = express();
const PORT = process.env.PORT || 5000;

app.use('/assets', express.static('build/client/assets'));
app.use(express.static('build/client'));

if (process.env.HEROKU_APP_NAME === 'acc-test')
{
	const chokidar = await import('chokidar');

	let dynamicApp = (req, res, next) => next();
	app.use((req, res, next) => dynamicApp(req, res, next));

	async function loadApp()
	{
		const filePath = path.resolve('./build/server/index.js');
		const fullUrl = `${filePath}?update=${Date.now()}`;
		const { app: newApp } = await import(fullUrl);
		dynamicApp = newApp;
	}

	await loadApp();

	let debounceTimeout;

	chokidar.watch('./build', {
		ignoreInitial: true,
		usePolling: true,
		// if interval too high, vagrant will get slow
		interval: 15000,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	}).on('all', async (event, filePath) =>
	{
		//console.info(`[${event}] ${filePath} – change detected...`);

		clearTimeout(debounceTimeout);

		debounceTimeout = setTimeout(async () =>
		{
			try
			{
				console.info(`RELOADING ACC...`);

				await loadApp();

				console.info(`[RELOADED] ACC is running at http://localhost:${PORT}/`);
			}
			catch (err)
			{
				console.error('Error reloading app:', err);
			}
		}, 20000);
	});
}
else
{
	app.use(await import('../../build/server/index.js').then(mod => mod.app));
}

app.listen(PORT, () =>
{
	console.info(`ACC is running at http://localhost:${PORT}/`);
});
