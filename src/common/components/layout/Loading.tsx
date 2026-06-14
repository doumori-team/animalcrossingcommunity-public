import { ReactNode, Suspense, use } from 'react';

import { constants } from '@utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Loading = ({ loaderData, children }: { loaderData: Promise<any>, children: ReactNode }) =>
{
	// Don't defer if we're loading from the server
	// Server will handle 'loading spinner' and this allows
	// the client side to have the data
	// `use` will suspend until the promise resolves
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	if ((import.meta as any).env.SSR)
	{
		use(loaderData);
	}

	return (
		<Suspense
			fallback={
				<div className='Loading George'>
					<img
						src={constants.allImages['layout/loading.gif']}
						alt='Loading...'
					/>
				</div>
			}
		>
			{children}
		</Suspense>
	);
};

export default Loading;
