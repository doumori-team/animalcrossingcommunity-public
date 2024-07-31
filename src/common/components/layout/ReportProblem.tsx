import React from 'react';

import { Confirm } from '@form';
import { RequirePermission } from '@behavior';
import { constants } from '@utils';

const ReportProblem = ({
	id,
	type
}: ReportProblemProps) =>
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

type ReportProblemProps = {
	type: string
	id: number
};

export default ReportProblem;