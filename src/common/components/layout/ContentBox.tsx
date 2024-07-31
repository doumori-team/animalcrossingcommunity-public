import React from 'react';

const ContentBox = ({
	children
}: ContentBoxProps) =>
{
	return (
		<div className='ContentBox'>
			{children}
		</div>
	);
}

type ContentBoxProps = {
	children: React.ReactNode | string
};

export default ContentBox;
