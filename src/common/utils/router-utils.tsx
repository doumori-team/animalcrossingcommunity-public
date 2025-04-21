import { redirect, redirectDocument, Params } from 'react-router';
import type { ShouldRevalidateFunctionArgs } from 'react-router';

import { iso } from 'common/iso.ts';
import { AppLoadContextType } from '@types';
import { action } from '@/components/form/Form.tsx';
import Loading from '@/components/layout/Loading.tsx';
import { utils, constants } from '@utils';

export const wrapLoader = (loader: any, pageName: string | null = null) =>
{
	return ({ context, params, request }: { context: AppLoadContextType, params: Params; request: any }) =>
	{
		return _getLoaderFunction(loader, params, request, context, pageName);
	};
};

export const formAction = async ({ request, context }: { request: any, context: AppLoadContextType }) => action(request, context);

export const shouldRevalidate = (args: ShouldRevalidateFunctionArgs) =>
{
	if (args.formAction)
	{
		return false;
	}

	return true;
};

// Used For: Catalog pages. Fast on prod, slow on test sites with no Redis.
export const deferLoader = (loader: any, pageName: string | null = null) =>
{
	return ({ context, params, request }: { context: AppLoadContextType, params: Params; request: any }) =>
	{
		return { data: _getLoaderFunction(loader, params, request, context, pageName) };
	};
};

// always rendered server side
export async function _getLoaderFunction(loader: any, params: Params, request: any, context: AppLoadContextType, pageName: string | null = null)
{
	let log = utils.startLog({ location: pageName ? `_getLoaderFunction-${pageName}` : '_getLoaderFunction', context });

	const url = new URL(request.url);

	return loader.bind({
		query: (await iso).query.bind(null, context.session?.user),
		userId: context.session?.user,
	})(params, utils.entriesToObject(url.searchParams.entries()), url.pathname)
	.then((data: any) =>
	{
		log += ` status=200`;
		console.info(log);

		if (!constants.LIVE_SITE)
		{
			console.info('Returning _getLoaderFunction data:');
			console.info(JSON.stringify(data, null, 2));
		}

		return data;
	})
	.catch((error: any) =>
	{
		console.error('Logging route error:', error);

		// if you went directly to a page and you're not supposed to
		// have access to it, redirect to the main page
		if (error.name === 'UserError' && (error.identifiers.includes('permission') || error.identifiers.includes('login-needed')))
		{
			// prevent forever redirect
			if (request.url.endsWith('/'))
			{
				log += ` status=400`;
				console.info(log);

				throw Response.json(
					error,
					{ status: 400 },
				);
			}

			log += ` status=302`;
			console.info(log);

			return redirect('/');
		}

		if (error.name === 'MaintenanceMode')
		{
			log += ` status=302`;
			console.info(log);

			return redirectDocument('/');
		}

		// see api-requests.ts
		let status = 500, statusText = '';

		if (error.name === 'UserError' || error.name === 'ProfanityError')
		{
			status = 400;
			statusText = error.identifiers[0];
		}

		log += ` status=${status}`;
		console.info(log);

		// Something went wrong fetching data, or possibly within React
		throw Response.json(
			error,
			{ status, statusText },
		);
	});
}

export function LoadingFunction(WrappedComponent: any)
{
	// eslint-disable-next-line react/display-name
	return ({ loaderData, params }: { loaderData: { data: Promise<any> }, params: Params }) =>
	{
		return <Loading loaderData={loaderData.data}><WrappedComponent loaderData={loaderData.data} params={params} /></Loading>;
	};
}
