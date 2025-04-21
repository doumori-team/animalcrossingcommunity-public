import { ReactNode } from 'react';

const ContentBox = ({
	children,
}: ContentBoxProps) =>
{
	return (
		<div className='ContentBox'>
			{children}
		</div>
	);
};

type ContentBoxProps = {
	children: ReactNode | string
};

export default ContentBox;
