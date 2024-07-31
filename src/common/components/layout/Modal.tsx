import React, { useState } from 'react';

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
}: ModalProps) =>
{
	const [show, setShow] = useState<boolean>(false);

	const renderSubmitButton = (jsFallback?: React.ReactNode) : React.ReactNode =>
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

type ModalProps = {
	title: string
	submitButtonAction: string
	submitButtonCallback?: string
	submitButtonLabel: string
	submitButtonBody?: React.ReactNode
	openButtonLabel: string
	submitButtonImage?: string
	submitButtonImageTitle?: string
	updateFunction?: Function
	children: any
};

export default Modal;