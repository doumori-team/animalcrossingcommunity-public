import React from 'react';
import PropTypes from 'prop-types';

import Confirm from '@/components/form/Confirm.js';
import RequirePermission from '@/components/behavior/RequirePermission.js';
import { constants } from '@utils';

const ReportProblem = ({id, type}) =>
{
	return (
		<RequirePermission permission='report-content' silent>
			<div className='ReportProblem'>
				<Confirm
					action='v1/rule/report'
					defaultSubmitImage={`${constants.AWS_URL}/images/icons/report.png`}
					imageTitle='Report a Problem'
					additionalBody={
						<>
						<input type='hidden' name='referenceId' value={id} />
						<input type='hidden' name='type' value={type} />
						</>
					}
					label='Report a Problem'
					message='Are you sure you want to report this content?'
				/>
			</div>
		</RequirePermission>
	);
}

ReportProblem.propTypes = {
	type: PropTypes.string.isRequired,
	id: PropTypes.number.isRequired,
};

export default ReportProblem;