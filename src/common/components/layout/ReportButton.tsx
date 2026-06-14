import { RequirePermission, RequireClientJS } from '@behavior';
import { constants } from '@utils';
import { Modal } from '@layout';

const ReportButton = () =>
{
	const handleClick = () =>
	{
		document.body.classList.toggle('show-reports');
	};

	return (
		<RequireClientJS>
			<RequirePermission permission='report-content' silent>
				<Modal
					title='Report a Problem'
					openButtonClassName='ReportButton'
					submitButtonImage={constants.allImages['icons/report.png']}
					openButtonLabel='Report A Problem'
					openButtonTitle='This will display all the report buttons on the page.'
					openButtonClickHandler={handleClick}
				>
					Please choose which content to report by clicking on the <img className='icon-sentence' src={constants.allImages['icons/report.png']} alt='Pitfall Button' /> next to it. Note that not all pages contain reportable content.
				</Modal>
			</RequirePermission>
		</RequireClientJS>
	);
};

export default ReportButton;
