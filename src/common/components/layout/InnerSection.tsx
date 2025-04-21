import { ReactNode } from 'react';

const InnerSection = ({
	children,
}: InnerSectionProps) =>
{
	return (
		<div className='InnerSection'>
			{children}
		</div>
	);
};

type InnerSectionProps = {
	children: ReactNode | string
};

export default InnerSection;
