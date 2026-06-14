import { ReactNode, useState } from 'react';

import { RequireClientJS } from '@behavior';
import { Button, Form } from '@form';
import { SuccessType } from '@types';

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
	updateFunction,
	formId,
	openButtonTitle,
	openButtonClickHandler,
	openButtonClassName = 'Modal_button',
}: ModalProps) =>
{
	const [show, setShow] = useState<boolean>(false);
	const [image, setImage] = useState<ModalProps['submitButtonImage']>(submitButtonImage);
	const [imageTimeout, setImageTimeout] = useState<number | null>(null);

	const updateImage = (newImage: SuccessType['_successImage']) =>
	{
		if (imageTimeout)
		{
			window.clearTimeout(imageTimeout);
		}

		setImage(newImage);

		const newImageTimeout = window.setTimeout(() =>
		{
			setImage(submitButtonImage);
			setImageTimeout(null);
		}, 10 * 1000);

		setImageTimeout(newImageTimeout);
	};

	const renderSubmitButton = (jsFallback?: ReactNode): ReactNode =>
	{
		if (!submitButtonLabel || !submitButtonAction)
		{
			return;
		}

		if (!jsFallback && submitButtonImage)
		{
			return (
				<Form
					action={submitButtonAction}
					callback={submitButtonCallback}
					showButton
					buttonText={submitButtonLabel}
					buttonClickHandler={() => setShow(false)}
					updateFunction={(data: SuccessType) => updateImage(data._successImage)}
					formId={formId}
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
				formId={formId}
			>
				{submitButtonBody}
			</Form>
		);
	};

	return (
		<RequireClientJS fallback={
			renderSubmitButton(true)
		}
		>
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
				title={openButtonTitle ? openButtonTitle : openButtonLabel}
				image={image}
				className={openButtonClassName}
				clickHandler={() =>
				{
					if (openButtonClickHandler)
					{
						openButtonClickHandler();
					}

					setShow(true);
				}}
			/>
		</RequireClientJS>
	);
};

type ModalProps = {
	title: string
	submitButtonAction?: string
	submitButtonCallback?: string
	submitButtonLabel?: string
	submitButtonBody?: ReactNode
	openButtonLabel: string
	openButtonTitle?: string
	submitButtonImage?: string
	submitButtonImageTitle?: string
	updateFunction?: Function
	children: ReactNode
	formId?: string
	openButtonClickHandler?: Function
	openButtonClassName?: string
};

export default Modal;
