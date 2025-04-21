import { ReactNode, Suspense, use } from 'react';

import { constants } from '@utils';

const Loading = ({ loaderData, children }: { loaderData: Promise<any>, children: ReactNode }) =>
{
	// Don't defer if we're loading from the server
	// Server will handle 'loading spinner' and this allows
	// the client side to have the data
	// `use` will suspend until the promise resolves
	if ((import.meta as any).env.SSR)
	{
		use(loaderData);
	}

	return (
		<Suspense
			fallback={
				<div className='Loading George'>
					<img src={`${constants.AWS_URL}/images/layout/loading.gif`} alt='Loading...' />
				</div>
			}
		>
			{children}
		</Suspense>
	);
};

export default Loading;
