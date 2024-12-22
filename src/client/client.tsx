import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { hydrateRoot } from 'react-dom/client';

import routes from 'common/routes.ts';

const router = createBrowserRouter(routes);

hydrateRoot(
	(document.querySelector('#react-root') as any),
	<RouterProvider router={router} />,
);
