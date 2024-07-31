import React from 'react';

const InnerSection = ({
	children
}: InnerSectionProps) =>
{
	return (
		<div className='InnerSection'>
			{children}
		</div>
	);
}

type InnerSectionProps = {
	children: React.ReactNode | string
};

export default InnerSection;