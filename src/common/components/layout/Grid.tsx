import React from 'react';

const Grid = ({
	name,
	options,
	children,
	message
}: GridProps) =>
{
	return (
		<>
			{options.length > 0 ? (
				<div className='Grid'>
					{children}
				</div>
			) : (
				<div className='GridMessage'>
					{message ? (
						message
					) : (
						`No ${name}s found.`
					)}
				</div>
			)}
		</>
	);
}

type GridProps = {
	name?: string
	options: any[]
	children: React.ReactNode
	message?: string | React.ReactNode
};

export default Grid;