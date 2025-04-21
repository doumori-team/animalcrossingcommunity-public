import { ReactNode } from 'react';

const Section = ({
	children,
}: SectionProps) =>
{
	return (
		<div className='Section'>
			{children}
		</div>
	);
};

type SectionProps = {
	children: ReactNode | string
};

export default Section;
