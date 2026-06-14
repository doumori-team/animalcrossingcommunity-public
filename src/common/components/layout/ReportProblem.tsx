import { ReactNode, useState, useEffect } from 'react';

import { Confirm } from '@form';
import { RequirePermission } from '@behavior';
import { constants } from '@utils';

const ReportProblem = ({
	id,
	type,
	children,
}: ReportProblemProps) =>
{
	const [className, setClassName] = useState<string>('');

	useEffect(() =>
	{
		setClassName('ReportProblem-js');
	}, []);

	// see: PhotoSlideshow.tsx
	return (
		<RequirePermission permission='report-content' silent>
			<div className={`ReportProblem ${className}`}>
				<Confirm
					action='v1/rule/report'
					defaultSubmitImage={
						constants.allImages['icons/report.png']
					}
					imageTitle='Report a Problem'
					additionalBody={
						<>
							<input type='hidden' name='referenceId' value={id} />
							<input type='hidden' name='type' value={type} />
						</>
					}
					label='Report a Problem'
					message='Are you sure you want to report this content?'
					formId={`report-problem-${id}-${type}`}
				/>
			</div>
			{children}
		</RequirePermission>
	);
};

type ReportProblemProps = {
	type: string
	id: number
	children?: ReactNode
};

export default ReportProblem;
