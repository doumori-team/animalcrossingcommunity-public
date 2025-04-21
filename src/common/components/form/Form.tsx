import { ReactNode, useState, useEffect } from 'react';
import { useNavigate, generatePath, useLocation, useFetcher, redirect, useActionData, redirectDocument } from 'react-router';

import { ErrorMessage } from '@layout';
import Alert from '@/components/form/Alert.tsx';
import Button from '@/components/form/Button.tsx';
import { iso } from 'common/iso.ts';
import { LocationType, ClickHandlerType, AppLoadContextType } from '@types';
import { utils, constants } from '@utils';
import * as errors from 'common/errors.ts';

export async function action(request: any, context: AppLoadContextType): Promise<any>
{
	const formData: FormData = await request.formData();

	const callback = String(formData.get('_callback') || '');
	const callbackUri = String(callback || formData.get('_callback_uri'));
	formData.delete('_callback_uri');
	formData.delete('_callback');

	const action = String(formData.get('_action'));
	formData.delete('_action');

	const defaultSubmitImage = String(formData.get('_defaultSubmitImage') || '');
	formData.delete('_defaultSubmitImage');

	const updateFunction = Boolean(formData.get('_updateFunction') === 'true' || false);
	formData.delete('_updateFunction');

	const formId = String(formData.get('_formId'));
	formData.delete('_formId');

	const formSubmissionId = Math.random();

	const params = utils.entriesToObject(formData.entries());

	if (!constants.LIVE_SITE)
	{
		console.info('Inside Form Action');
		console.info(action);
		console.info(params);
	}

	try
	{
		const data: any = await (await iso).query(context.session?.user, action, params);

		if (!constants.LIVE_SITE)
		{
			console.info(data);
		}

		if (typeof data === 'object')
		{
			if (updateFunction)
			{
				return {
					data,
					formId,
					formSubmissionId,
				};
			}
			else if (Object.prototype.hasOwnProperty.call(data, '_successImage') && defaultSubmitImage)
			{
				return {
					_successImage: data._successImage,
					formId,
					formSubmissionId,
				};
			}
			else if (Object.prototype.hasOwnProperty.call(data, '_redirect'))
			{
				// no good way to do this server side
				return {
					_redirect: data._redirect,
					formId,
					formSubmissionId,
				};
			}
			else if (Object.prototype.hasOwnProperty.call(data, '_success') &&
					!Object.prototype.hasOwnProperty.call(data, '_successImage')
			)
			{
				return {
					_success: data._success,
					formId,
					formSubmissionId,
				};
			}
			else if (Object.prototype.hasOwnProperty.call(data, '_notice'))
			{
				return {
					_notice: data._notice,
					formId,
					formSubmissionId,
				};
			}
			else if (Object.prototype.hasOwnProperty.call(data, '_logout'))
			{
				return {
					_logout: data._logout,
					formId,
					formSubmissionId,
				};
			}
			else if (Object.prototype.hasOwnProperty.call(data, '_callback'))
			{
				return redirect(generatePath(data._callback));
			}

			const path = utils.generateHashPath(callbackUri, data, true);

			if (utils.realStringLength(callback) === 0)
			{
				return redirectDocument(generatePath(path, data));
			}

			return redirect(generatePath(path, data));
		}

		if (utils.realStringLength(callback) === 0)
		{
			return redirectDocument(callbackUri);
		}

		return redirect(callbackUri);
	}
	catch (error: any)
	{
		console.error('Form Action Error:', error);
		console.error('API operation:', action);
		console.error('Request body:', params);

		if (typeof error === 'object')
		{
			if (error.name === 'ProfanityError')
			{
				return {
					errors: [{ name:'ProfanityError', message: `${(errors.ERROR_MESSAGES as any)[error.identifier].message} ${error.words}` }],
					formId,
					formSubmissionId,
				};
			}
			else if (Object.prototype.hasOwnProperty.call(error, 'identifiers'))
			{
				return {
					errors: error.identifiers,
					formId,
					formSubmissionId,
				};
			}
			else if (Object.prototype.hasOwnProperty.call(error, 'message'))
			{
				return {
					errors: [error],
					formId,
					formSubmissionId,
				};
			}
		}

		return {
			errors: ['bad-format'],
			formId,
			formSubmissionId,
		};
	}
};

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
	messagesAtBottom = false,
	buttonText = 'Submit',
	buttonClickHandler,
	updateFunction,
	defaultSubmitImage,
	imageTitle,
	id,
	formId,
}: FormProps) =>
{
	const navigate = useNavigate();
	const location = useLocation() as LocationType;
	const fetcher = useFetcher();

	// data returning from action function if SSR
	const actionData = useActionData();

	// otherwise other Forms on same page will render the same return
	const data = actionData && [formId, action].includes(actionData?.formId) ? actionData : fetcher.data;

	const [success, setSuccess] = useState<string>(data?._success ?? '');
	const [successTimeout, setSuccessTimeout] = useState<number | null>(null);
	const [successCallbackTimeout, setSuccessCallbackTimeout] = useState<number | null>(null);
	const [successImage, setSuccessImage] = useState<FormProps['defaultSubmitImage']>(data?._successImage ?? defaultSubmitImage);
	const [successImageTimeout, setSuccessImageTimeout] = useState<number | null>(null);
	const [logoutTimeout, setLogoutTimeout] = useState<number | null>(null);

	const loading = fetcher.state !== 'idle';
	const currentUri = location.pathname + location.search;

	useEffect(() =>
	{
		if (data?._success)
		{
			if (successTimeout)
			{
				window.clearTimeout(successTimeout);
			}

			if (successCallbackTimeout)
			{
				window.clearTimeout(successCallbackTimeout);
			}

			setSuccess(data?._success);

			const newSuccessTimeout = window.setTimeout(() =>
			{
				setSuccess('');
				setSuccessTimeout(null);
			}, 10 * 1000);

			setSuccessTimeout(newSuccessTimeout);

			if (callback)
			{
				const newSuccessCallbackTimeout = window.setTimeout(() =>
				{
					const path = utils.generateHashPath(callback, data?.data);
					const filteredData = data?.data ? Object.fromEntries(Object.entries(data?.data).filter(([key]) => !key.startsWith('_'))) : {};

					if (Object.keys(filteredData).length === 0)
					{
						navigate(path);
					}
					else
					{
						navigate(generatePath(path, filteredData));
					}

				}, 5 * 1000);

				setSuccessCallbackTimeout(newSuccessCallbackTimeout);
			}
		}

		if (data?._successImage)
		{
			if (successImageTimeout)
			{
				window.clearTimeout(successImageTimeout);
			}

			setSuccessImage(data?._successImage);

			const newSuccessImageTimeout = window.setTimeout(() =>
			{
				setSuccessImage(defaultSubmitImage);
				setSuccessImageTimeout(null);
			}, 10 * 1000);

			setSuccessImageTimeout(newSuccessImageTimeout);
		}

		if (typeof data?.data === 'object' && Object.keys(data?.data).length > 0 && updateFunction)
		{
			updateFunction(data?.data);
		}

		if (data?._redirect)
		{
			window.location.href = data._redirect;
		}

		if (data?._logout)
		{
			if (logoutTimeout)
			{
				window.clearTimeout(logoutTimeout);
			}

			// no good way to do this server side
			const xhr = new XMLHttpRequest;
			xhr.open('POST', '/auth/logout');
			xhr.send();

			const newLogoutTimeout = window.setTimeout(() =>
			{
				navigate('/', { replace: true });
			}, 5 * 1000);

			setLogoutTimeout(newLogoutTimeout);

		}
	}, [data?.formSubmissionId]);

	return (
		<fetcher.Form method='post' encType='multipart/form-data' className={className} id={id} key={formId || action} role='form'>
			<input type='hidden' name='_callback_uri' value={currentUri} />
			<input type='hidden' name='_callback' value={callback} />
			<input type='hidden' name='_action' value={action} />
			<input type='hidden' name='_defaultSubmitImage' value={defaultSubmitImage} />
			<input type='hidden' name='_updateFunction' value={updateFunction ? 'true' : 'false'} />
			<input type='hidden' name='_formId' value={formId || action} />
			{!messagesAtBottom && children}
			<div key={String(loading)}>
				{data?.errors?.map((error: any, index: any) =>
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
			{data?._notice &&
				<Alert type='info'>{data?._notice}</Alert>
			}
			{data?._logout &&
				<Alert type='info'>{data?._logout}</Alert>
			}
			{messagesAtBottom && children}
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
		</fetcher.Form>
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
	children: ReactNode
};

type FormProps = {
	action: string
	callback?: string
	children?: ReactNode
	className?: string
	messagesAtBottom?: boolean
	showButton?: boolean
	buttonText?: string
	buttonClickHandler?: ClickHandlerType
	updateFunction?: Function
	defaultSubmitImage?: string
	imageTitle?: string
	id?: string
	formId?: string
};

export default Form;
