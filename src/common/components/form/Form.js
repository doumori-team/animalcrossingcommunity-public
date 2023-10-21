import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, generatePath, useLocation } from 'react-router-dom';

import ErrorMessage from '@/components/layout/ErrorMessage.js';
import Alert from '@/components/form/Alert.js';
import Button from '@/components/form/Button.js';
import * as iso from 'common/iso.js';

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
	messagesAtBottom,
	showButton,
	buttonText,
	buttonClickHandler,
	updateFunction,
	defaultSubmitImage,
	imageTitle,
	id
}) =>
{
	const [errors, setErrors] = useState([]);
	const [success, setSuccess] = useState('');
	const [loading, setLoading] = useState(false);
	const [successTimeout, setSuccessTimeout] = useState(null);
	const [successImage, setSuccessImage] = useState(defaultSubmitImage);

	const navigate = useNavigate();
	const location = useLocation();

	const currentUri = location.pathname + location.search;

	const showSuccessMessage = (message) =>
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
	}

	const showNoticeMessage = (message) =>
	{
		setSuccess(message);
	}

	const toggleSuccessImage = (image) =>
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
	}

	const handleSubmit = (event) =>
	{
		event.preventDefault();

		const {target} = event;

		setLoading(true);

		const params = new FormData(target);
		const callback = params.get('_callback_uri');
		params.delete('_callback_uri');

		iso.query(null, action, params)
			.then(data =>
			{
				setErrors([]);

				// clear data from form
				if (target)
				{
					target.reset();
				}

				if (typeof data === 'object' && data.hasOwnProperty('_successImage') && defaultSubmitImage)
				{
					toggleSuccessImage(data._successImage);

					if (callback)
					{
						navigate(generatePath(callback, data));
					}
				}
				else if (typeof data === 'object' && data.hasOwnProperty('_success'))
				{
					if (data.hasOwnProperty('_callbackFirst') && callback)
					{
						navigate(generatePath(callback, data));
					}

					showSuccessMessage(data._success);

					if (data.hasOwnProperty('_useCallback') && callback)
					{
						window.setTimeout(() =>
						{
							navigate(generatePath(callback, data));
						}, 5 * 1000);
					}
				}
				else if (typeof data === 'object' && data.hasOwnProperty('_notice'))
				{
					showNoticeMessage(data._notice);
				}
				else if (typeof data === 'object' && data.hasOwnProperty('_logout'))
				{
					showNoticeMessage(data._logout);

					window.setTimeout(() =>
					{
						navigate('/');
					}, 5 * 1000);
				}
				else if (typeof data === 'object' && data.hasOwnProperty('_callback'))
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
			.catch(error =>
			{
				console.error(error);

				if (typeof error === 'object' && error.hasOwnProperty('identifiers'))
				{
					setErrors(error.identifiers);
				}

				setLoading(false);
			})
	}

	return (
		<form action={`/api/${action}`} method='post' encType='multipart/form-data' onSubmit={handleSubmit} className={className} id={id}>
			<input type='hidden' name='_callback_uri' value={callback || currentUri} />
			{messagesAtBottom && children}
			<div key={loading}>
				{errors.map((error, index) => {
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
				(<Alert type='success'>{success}</Alert>)
			}
			{!messagesAtBottom && children}
			{successImage && (
				<input type='image' src={successImage} title={imageTitle} />
			)}
			{showButton && (
				<Button
					label={buttonText}
					type='submit'
					loading={loading}
					className='Form_button'
					clickHandler={buttonClickHandler}
				/>
			)}
		</form>
	);
}

const Group = ({children}) =>
{
	return (
		<div className='FormGroup'>
			{children}
		</div>
	);
}

Form.Group = Group;

Group.propTypes = {
	children: PropTypes.any.isRequired,
};

Form.propTypes = {
	action: PropTypes.string.isRequired,
	callback: PropTypes.string,
	children: PropTypes.node,
	className: PropTypes.string,
	messagesAtBottom: PropTypes.bool,
	showButton: PropTypes.bool,
	buttonText: PropTypes.string,
	buttonClickHandler: PropTypes.func,
	updateFunction: PropTypes.func,
	defaultSubmitImage: PropTypes.string,
	imageTitle: PropTypes.string,
	id: PropTypes.string,
}

Form.defaultProps = {
	messageAtBottom: false,
	showButton: false,
	buttonText: 'Submit',
}

export default Form;