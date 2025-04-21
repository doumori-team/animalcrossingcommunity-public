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
	options: any[]
	children: ReactNode
	message?: string | ReactNode
};

export default Grid;
