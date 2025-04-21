import { ReactNode } from 'react';

import ErrorMessage from '@/components/layout/ErrorMessage.tsx';

const RequireLargeScreen = ({
	children,
	silent = false,
	size,
}: RequireLargeScreenProps) =>
{
	return (
		<div className='RequireLargeScreen'>
			<div className={`RequireLargeScreen_fallback_${size}`}>
				{!silent &&
					<ErrorMessage identifier='large-screen-required' />
				}
			</div>
			<div className={`RequireLargeScreen_content_${size}`}>
				{children}
			</div>
		</div>
	);
};

type RequireLargeScreenProps = {
	children: ReactNode
	silent?: boolean
	size: string
};

export default RequireLargeScreen;
