import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { RequireClientJS } from '@behavior';
import { Button, Form } from '@form';

const Modal = ({
	title,
	submitButtonAction,
	submitButtonCallback,
	submitButtonLabel,
	submitButtonBody,
	openButtonLabel,
	children,
	submitButtonImage,
	submitButtonImageTitle,
	updateFunction
}) =>
{
	const [show, setShow] = useState(false);

	const renderSubmitButton = (jsFallback) =>
	{
		if (!jsFallback && submitButtonImage)
		{
			return (
				<Form
					action={submitButtonAction}
					callback={submitButtonCallback}
					showButton
					buttonText={submitButtonLabel}
					buttonClickHandler={() => setShow(false)}
				>
					{submitButtonBody}
				</Form>
			);
		}

		return (
			<Form
				action={submitButtonAction}
				callback={submitButtonCallback}
				showButton={submitButtonImage ? false : true}
				buttonText={submitButtonLabel}
				buttonClickHandler={() => setShow(false)}
				defaultSubmitImage={submitButtonImage}
				imageTitle={submitButtonImageTitle}
				updateFunction={updateFunction}
			>
				{submitButtonBody}
			</Form>
		);
	}

	return (
		<RequireClientJS fallback={
			renderSubmitButton(true)
		}>
			<div className={`Modal_container ${!show && 'Modal_containerHide'}`}>
				<div className={`Modal ${!show && 'Modal_hide'}`}>
					<div className='Modal_title'>{title}</div>
					<div className='Modal_body'>
						{children}
					</div>
					<div className='Modal_footer'>
						{renderSubmitButton(false)}
						<Button
							label='Close'
							className='Modal_button_close'
							clickHandler={() => setShow(false)}
						/>
					</div>
				</div>
			</div>
			<Button
				label={openButtonLabel}
				title={openButtonLabel}
				image={submitButtonImage}
				className='Modal_button'
				clickHandler={() => setShow(true)}
			/>
		</RequireClientJS>
	);
}

Modal.propTypes = {
	title: PropTypes.string.isRequired,
	submitButtonAction: PropTypes.string.isRequired,
	submitButtonCallback: PropTypes.string,
	submitButtonLabel: PropTypes.string,
	submitButtonBody: PropTypes.any,
	openButtonLabel: PropTypes.string,
	submitButtonImage: PropTypes.string,
	submitButtonImageTitle: PropTypes.string,
	updateFunction: PropTypes.func,
};

export default Modal;