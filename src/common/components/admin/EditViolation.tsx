import React from 'react';

import { Form, Check, Text, TextArea } from '@form';
import { constants } from '@utils';
import { SeverityType, ViolationType } from '@types';

const EditViolation = ({
	ruleId,
	violation,
	severities,
}: EditViolationProps) =>
{
	return (
		<div className='EditViolation'>
			<Form action='v1/admin/rule/violation/save' callback='/rules' showButton>
				<input type='hidden' name='id' value={violation ? violation.id : 0} />
				<input type='hidden' name='ruleId' value={ruleId} />

				<Form.Group>
					<Check
						options={[{ id: '', name: 'No Severity' } as any].concat(severities)}
						name='severityId'
						defaultValue={violation && violation.severityId ? [violation.severityId] : ['']}
						label='Severity'
					/>
				</Form.Group>

				<Form.Group>
					<Text
						type='number'
						name='number'
						label='Number'
						value={violation ? violation.number : 1}
						required
						min={1}
						max={constants.max.ruleViolationNumber}
					/>
				</Form.Group>

				<Form.Group>
					<TextArea
						name='violation'
						label='Violation'
						value={violation ? violation.violation : ''}
						required
						maxLength={constants.max.ruleViolation}
					/>
				</Form.Group>
			</Form>
		</div>
	);
};

type EditViolationProps = {
	ruleId: string
	violation?: ViolationType
	severities: SeverityType[]
};

export default EditViolation;
