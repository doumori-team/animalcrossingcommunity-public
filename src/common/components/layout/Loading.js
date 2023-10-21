import React, { Suspense } from 'react';
import { Await, useLoaderData } from 'react-router-dom';

import ErrorMessage from '@/components/layout/ErrorMessage.js';

const Loading = ({children}) =>
{
	const { data } = useLoaderData();

	return (
		<Suspense
			fallback={
				<div className='Loading George'>
					<img src='/images/layout/loading.gif' alt='Loading...' />
				</div>
			}
		>
			<Await
				resolve={data}
				errorElement={
					<ErrorMessage identifier='bad-format' />
				}
			>
				{children}
			</Await>
		</Suspense>
	);
}

export default Loading;
