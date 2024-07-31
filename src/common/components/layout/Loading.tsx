import React, { Suspense } from 'react';
import { Await, useLoaderData } from 'react-router-dom';

import ErrorMessage from '@/components/layout/ErrorMessage.tsx';
import { constants } from '@utils';

const Loading = ({children}: LoadingProps) =>
{
	const {data} = useLoaderData() as {data: any};

	return (
		<Suspense
			fallback={
				<div className='Loading George'>
					<img src={`${constants.AWS_URL}/images/layout/loading.gif`} alt='Loading...' />
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

type LoadingProps = {
	children: React.ReactNode | string
}

export default Loading;
