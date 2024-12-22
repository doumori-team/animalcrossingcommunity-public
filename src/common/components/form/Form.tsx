import React, { useState } from 'react';
import { useNavigate, generatePath, useLocation } from 'react-router-dom';

import { ErrorMessage } from '@layout';
import Alert from '@/components/form/Alert.tsx';
import Button from '@/components/form/Button.tsx';
import * as iso from 'common/iso.js';
import { LocationType, ClickHandlerType } from '@types';

/* A component to be used instead of the normal HTML <form>, so that it passes
 * through the defined API. The only reason NOT to use this instead of the
 * normal <form> is if the form needs to submit to a website other than ACC.
 *
 * Accepts props:
 *  action - String - The API method this form submits to. Should map to the
 * 		name of a function exported from db.js.
 *  callback - String - Path to go to after the form completes successfully.
 * 		Defaults to the current page. You can include URL parameters (e.g.
 * 		"/profile/:id"), which will be filled from the return value of the API
 * 		method.
 *  className - String - Will be applied directly to the underlying <Form>
 * 		element
 *  messagesAtBottom - Boolean - Displays success and error messages at the
 *      bottom instead of the top (default).
 * 	defaultSubmitImage - String - Starting image path for submit button that
 * 		toggles briefly on success
 *
 * You should insert <input>s with <label>s inside this component, just as you
 * would with a normal HTML form. Each <input> should have a 'name' attribute
 * that corresponds to the name of a parameter to the API method.
 */

const Form = ({
	action,
	callback,
	children,
	className,
	showButton = false,
	messagesAtBottom,
	buttonText = 'Submit',
	buttonClickHandler,
	updateFunction,
	defaultSubmitImage,
	imageTitle,
	id,
}: FormProps) =>
{
	const [errors, setErrors] = useState<string[]>([]);
	const [success, setSuccess] = useState<string>('');
	const [loading, setLoading] = useState<boolean>(false);
	const [successTimeout, setSuccessTimeout] = useState<number | null>(null);
	const [successImage, setSuccessImage] = useState<string | undefined>(defaultSubmitImage);

	const navigate = useNavigate();
	const location = useLocation() as LocationType;

	const currentUri = location.pathname + location.search;

	const showSuccessMessage = (message: string): void =>
	{
		if (successTimeout)
		{
			window.clearTimeout(successTimeout);
		}

		setSuccess(message);

		const newSuccessTimeout = window.setTimeout(() =>
		{
			setSuccess('');
			setSuccessTimeout(null);
		}, 10 * 1000);

		setSuccessTimeout(newSuccessTimeout);
	};

	const showNoticeMessage = (message: string): void =>
	{
		setSuccess(message);
	};

	const toggleSuccessImage = (image: string): void =>
	{
		if (successTimeout)
		{
			window.clearTimeout(successTimeout);
		}

		setSuccessImage(image);

		const newSuccessTimeout = window.setTimeout(() =>
		{
			setSuccessImage(defaultSubmitImage);
			setSuccessTimeout(null);
		}, 5 * 1000);

		setSuccessTimeout(newSuccessTimeout);
	};

	const handleSubmit = (event: React.FormEvent): void =>
	{
		event.preventDefault();

		const target: any = event.target;

		setLoading(true);

		const params = new FormData(target);
		const callback = String(params.get('_callback_uri') || '');
		params.delete('_callback_uri');

		(iso as any).query(null, action, params)
			.then((data: any) =>
			{
				setErrors([]);

				// clear data from form
				if (target)
				{
					target.reset();
				}

				if (typeof data === 'object' && Object.prototype.hasOwnProperty.call(data, '_successImage') && defaultSubmitImage)
				{
					toggleSuccessImage(data._successImage);

					if (callback)
					{
						navigate(generatePath(callback, data));
					}
				}
				else if (typeof data === 'object' && Object.prototype.hasOwnProperty.call(data, '_success'))
				{
					if (Object.prototype.hasOwnProperty.call(data, '_callbackFirst') && callback)
					{
						navigate(generatePath(callback, data));
					}

					showSuccessMessage(data._success);

					if (Object.prototype.hasOwnProperty.call(data, '_useCallback') && callback)
					{
						window.setTimeout(() =>
						{
							navigate(generatePath(callback, data));
						}, 5 * 1000);
					}
				}
				else if (typeof data === 'object' && Object.prototype.hasOwnProperty.call(data, '_notice'))
				{
					showNoticeMessage(data._notice);
				}
				else if (typeof data === 'object' && Object.prototype.hasOwnProperty.call(data, '_logout'))
				{
					showNoticeMessage(data._logout);

					window.setTimeout(() =>
					{
						navigate('/');
					}, 5 * 1000);
				}
				else if (typeof data === 'object' && Object.prototype.hasOwnProperty.call(data, '_callback'))
				{
					navigate(generatePath(data._callback, data));
				}
				else if (updateFunction && typeof data === 'object')
				{
					updateFunction(data);
				}
				else if (callback)
				{
					if (typeof data === 'object')
					{
						if (callback.includes('?reload='))
						{
							navigate(`${callback}${data.id}`);
						}
						else
						{
							navigate(generatePath(callback, data));
						}
					}
					else
					{
						navigate(callback);
					}
				}

				setLoading(false);
			})
			.catch((error: any) =>
			{
				console.error(error);

				if (typeof error === 'object')
				{
					if (Object.prototype.hasOwnProperty.call(error, 'identifiers'))
					{
						setErrors(error.identifiers);
					}
					else if (Object.prototype.hasOwnProperty.call(error, 'message'))
					{
						setErrors([error]);
					}
				}

				setLoading(false);
			});
	};

	return (
		<form action={`/api/${action}`} method='post' encType='multipart/form-data' onSubmit={handleSubmit} className={className} id={id}>
			<input type='hidden' name='_callback_uri' value={callback || currentUri} />
			{messagesAtBottom && children}
			<div key={String(loading)}>
				{errors.map((error: any, index: any) =>
				{
					if (typeof error === 'object')
					{
						return <ErrorMessage message={error.message} key={index} />;
					}
					else
					{
						return <ErrorMessage identifier={error} key={index} />;
					}
				})}
			</div>
			{success &&
				<Alert type='success'>{success}</Alert>
			}
			{!messagesAtBottom && children}
			{successImage &&
				<input type='image' src={successImage} title={imageTitle} />
			}
			{showButton &&
				<Button
					label={buttonText}
					type='submit'
					loading={loading}
					className='Form_button'
					clickHandler={buttonClickHandler}
				/>
			}
		</form>
	);
};

const Group = ({
	children,
}: GroupProps) =>
{
	return (
		<div className='FormGroup'>
			{children}
		</div>
	);
};

Form.Group = Group;

type GroupProps = {
	children: React.ReactNode
};

type FormProps = {
	action: string
	callback?: string
	children?: React.ReactNode
	className?: string
	messagesAtBottom?: boolean
	showButton?: boolean
	buttonText?: string
	buttonClickHandler?: ClickHandlerType
	updateFunction?: Function
	defaultSubmitImage?: string
	imageTitle?: string
	id?: string
};

export default Form;
