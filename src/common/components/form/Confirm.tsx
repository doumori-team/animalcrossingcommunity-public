import React from 'react';

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
}: ConfirmProps) =>
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

type ConfirmProps = {
	action: string
	callback?: string
	id?: number
	additionalBody?: any
	label: string
	message: string
	defaultSubmitImage?: string
	imageTitle?: string
	updateFunction?: Function
};

export default Confirm;