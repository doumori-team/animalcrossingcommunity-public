import React from 'react';
import PropTypes from 'prop-types';

import { Modal } from '@layout';

const Confirm = ({
	action,
	callback,
	id,
	additionalBody,
	label,
	message,
	defaultSubmitImage,
	imageTitle,
	updateFunction
}) =>
{
	return (
		<Modal
			title='Confirm'
			submitButtonAction={action}
			submitButtonCallback={callback}
			submitButtonLabel={label}
			submitButtonBody={
				<>
				{id && (
					<input type='hidden' name='id' value={id} />
				)}
				{additionalBody && additionalBody}
				</>
			}
			openButtonLabel={label}
			submitButtonImage={defaultSubmitImage}
			submitButtonImageTitle={imageTitle}
			updateFunction={updateFunction}
		>
			{message}
		</Modal>
	);
}

Confirm.propTypes = {
	action: PropTypes.string.isRequired,
	callback: PropTypes.string,
	id: PropTypes.number,
	additionalBody: PropTypes.any,
	label: PropTypes.string.isRequired,
	message: PropTypes.string.isRequired,
	defaultSubmitImage: PropTypes.string,
	imageTitle: PropTypes.string,
	updateFunction: PropTypes.func,
};

export default Confirm;