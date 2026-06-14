import { ReactNode } from 'react';

const Grid = ({
	name,
	options,
	children,
	message,
}: GridProps) =>
{
	return (
		<>
			{options.length > 0 ?
				<div className='Grid'>
					{children}
				</div>
				:
				<div className='GridMessage'>
					{message ?
						message
						:
						`No ${name}s found.`
					}
				</div>
			}
		</>
	);
};

type GridProps = {
	name?: string
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	options: any[]
	children: ReactNode
	message?: string | ReactNode
};

export default Grid;
