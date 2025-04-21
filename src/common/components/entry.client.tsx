// This file is from react-router, brought in via 'react-router reveal'

import { startTransition } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { HydratedRouter } from 'react-router/dom';

startTransition(() =>
{
	hydrateRoot(
		document,
		// Removed StrictMode
		<HydratedRouter />,
	);
});
