/* eslint-disable @typescript-eslint/no-explicit-any */
import { act } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';

import * as Form from '@/components/form/Form.tsx';
import { mockISOQuery, mockAppContext } from 'tests/vitest.setup.ts';
import { constants } from '@utils';
import { ERROR_MESSAGES, ProfanityError } from '@errors';

const action = 'testAction';

const mockUseNavigate = vi.fn();
let mockFetcherData: any = null;
let mockActionData: any = null;
vi.mock('react-router', async () =>
{
	const actual = await vi.importActual('react-router');
	return {
		...actual,
		useFetcher: vi.fn(() => ({
			Form: (props: any) => <form {...props} />,
			state: mockFetcherData ? 'submitting' : 'idle',
			data: mockFetcherData,
			submit: vi.fn(),
			load: vi.fn(),
		})),
		useActionData: vi.fn(() => mockActionData),
		useNavigate: () => mockUseNavigate,
		redirect: vi.fn((path) => ({ type: 'redirect', path })),
		redirectDocument: vi.fn((path) => ({ type: 'redirectDocument', path })),
	};
});

const createMockFetcherData = (data: any) =>
{
	return { ...data, formSubmissionId: Math.random() };
};

const MemoryRouterForm = (props = {}) =>
{
	return <MemoryRouter>
		<Form.default action={action} {...props}>
			<input name='testInput' defaultValue='testValue' role='textbox' />
		</Form.default>
	</MemoryRouter>;
};

const setup = (props = {}) =>
{
	return render(MemoryRouterForm(props));
};

const createFakeFormData = (data: Record<string, string>) =>
{
	return {
		get: (key: string) => data[key],
		delete: vi.fn(),
		entries: () => Object.entries(data),
	};
};

const mockFormRequest: any = {
	formData: vi.fn(),
	headers: [],
};

describe('Form Component', () =>
{
	beforeEach(() =>
	{
		Object.defineProperty(window, 'location', {
			writable: true,
			value: { assign: vi.fn() },
		});

		mockFetcherData = null;
		mockActionData = null;
	});

	test('renders without errors', () =>
	{
		// Arrange & Act
		setup();

		// Assert
		expect(screen.getByRole('form')).toBeDefined();
	});

	test('calls update function', async () =>
	{
		// Arrange
		const data = { id: 473 };
		const mockUpdateFunction = vi.fn();
		const props = { updateFunction: mockUpdateFunction };
		mockFormRequest.formData.mockResolvedValue(createFakeFormData({
			_action: action,
			_updateFunction: 'true',
		}));
		mockISOQuery.mockResolvedValueOnce(data);

		// Act
		const { rerender } = setup(props);

		const result = await Form.action(mockFormRequest, mockAppContext as any);

		mockFetcherData = createMockFetcherData({ data });

		rerender(MemoryRouterForm(props));

		// Assert
		expect(mockUpdateFunction).toBeCalledWith(data);

		expect(result).toMatchObject({
			data: data,
			formId: expect.any(String),
			formSubmissionId: expect.any(Number),
		});
	});

	test('shows success image for X seconds', async () =>
	{
		// Arrange
		const successImage = constants.allImages['icons/icon_check.png'];
		const defaultSubmitImage = constants.allImages['icons/report.png'];
		const data = { _successImage: successImage };
		const props = { defaultSubmitImage: defaultSubmitImage };
		mockFormRequest.formData.mockResolvedValue(createFakeFormData({
			_action: action,
			_defaultSubmitImage: defaultSubmitImage,
		}));
		mockISOQuery.mockResolvedValueOnce({ _success: 'Success!', _successImage: successImage });

		// Act
		vi.useFakeTimers();
		const { rerender } = setup(props);

		const result = await Form.action(mockFormRequest, mockAppContext as any);

		mockFetcherData = createMockFetcherData(data);

		rerender(MemoryRouterForm(props));

		// Assert
		let imageInput = screen.getByRole('button', { name: /submit/i });
		expect(imageInput).toBeDefined();
		expect(imageInput.getAttribute('src')).toBe(successImage);

		expect(result).toMatchObject({
			...data,
			formId: expect.any(String),
			formSubmissionId: expect.any(Number),
		});

		await act(async () =>
		{
			vi.advanceTimersByTime(10 * 1000);
		});

		imageInput = screen.getByRole('button', { name: /submit/i });
		expect(imageInput.getAttribute('src')).toBe(defaultSubmitImage);

		// Cleanup
		vi.useRealTimers();
	});

	test('shows success image (SSR)', async () =>
	{
		// Arrange
		const successImage = constants.allImages['icons/icon_check.png'];
		const defaultSubmitImage = constants.allImages['icons/report.png'];
		const props = { defaultSubmitImage: defaultSubmitImage, formId: 'success-image' };
		const data = { _successImage: successImage, formId: props.formId };
		mockFormRequest.formData.mockResolvedValue(createFakeFormData({
			_action: action,
			_defaultSubmitImage: defaultSubmitImage,
			_formId: props.formId,
		}));
		mockISOQuery.mockResolvedValueOnce({ _success: 'Success!', _successImage: successImage });

		// Act
		vi.useFakeTimers();
		const { rerender } = setup(props);

		const result = await Form.action(mockFormRequest, mockAppContext as any);

		mockActionData = createMockFetcherData(data);

		rerender(MemoryRouterForm(props));

		// Assert
		let imageInput = screen.getByRole('button', { name: /submit/i });
		expect(imageInput).toBeDefined();
		expect(imageInput.getAttribute('src')).toBe(successImage);

		expect(result).toMatchObject({
			...data,
			formId: props.formId,
			formSubmissionId: expect.any(Number),
		});
	});

	test('navigates to redirect URL on response', async () =>
	{
		// Arrange
		const redirect = 'https://example.com';
		const data = { _redirect: redirect };
		mockFormRequest.formData.mockResolvedValue(createFakeFormData({
			_action: action,
		}));
		mockISOQuery.mockResolvedValueOnce({ _redirect: redirect });

		// Act
		const { rerender } = setup();

		const result = await Form.action(mockFormRequest, mockAppContext as any);

		mockFetcherData = createMockFetcherData(data);

		rerender(MemoryRouterForm());

		// Assert
		expect(window.location.href).toBe(redirect);

		expect(result).toMatchObject({
			...data,
			formId: expect.any(String),
			formSubmissionId: expect.any(Number),
		});
	});

	test('shows success message for X seconds', async () =>
	{
		// Arrange
		const successMessage = 'Success!';
		const data = { _success: successMessage };
		mockFormRequest.formData.mockResolvedValue(createFakeFormData({
			_action: action,
		}));
		mockISOQuery.mockResolvedValueOnce({ _success: successMessage });

		// Act
		vi.useFakeTimers();
		const { rerender } = setup();

		const result = await Form.action(mockFormRequest, mockAppContext as any);

		mockFetcherData = createMockFetcherData(data);

		rerender(MemoryRouterForm());

		// Assert
		const alert = screen.getByRole('alert');
		expect(alert).toBeDefined();
		expect(alert.classList).toContain('Alert-success');
		expect(alert.innerHTML).toBe(successMessage);

		expect(result).toMatchObject({
			...data,
			formId: expect.any(String),
			formSubmissionId: expect.any(Number),
		});

		await act(async () =>
		{
			vi.advanceTimersByTime(10 * 1000);
		});

		expect(screen.queryByRole('alert')).toBeNull();

		// Cleanup
		vi.useRealTimers();
	});

	test('shows success message (SSR)', async () =>
	{
		// Arrange
		const successMessage = 'Success!';
		const props = { formId: 'success-message' };
		const data = { _success: successMessage, formId: props.formId };
		mockFormRequest.formData.mockResolvedValue(createFakeFormData({
			_action: action,
			_formId: props.formId,
		}));
		mockISOQuery.mockResolvedValueOnce({ _success: successMessage });

		// Act
		const { rerender } = setup(props);

		const result = await Form.action(mockFormRequest, mockAppContext as any);

		mockActionData = createMockFetcherData(data);

		rerender(MemoryRouterForm(props));

		// Assert
		const alert = screen.getByRole('alert');
		expect(alert).toBeDefined();
		expect(alert.classList).toContain('Alert-success');
		expect(alert.innerHTML).toBe(successMessage);

		expect(result).toMatchObject({
			...data,
			formId: props.formId,
			formSubmissionId: expect.any(Number),
		});
	});

	test('shows nothing for different formId (SSR)', async () =>
	{
		// Arrange
		const props = { formId: 'success-message2' };
		const data = { _success: 'Success!', formId: 'success-message' };

		// Act
		const { rerender } = setup(props);

		mockActionData = createMockFetcherData(data);

		rerender(MemoryRouterForm(props));

		// Assert
		const alert = screen.queryByRole('alert');
		expect(alert).toBeNull();
	});

	test('shows success message and then executes callback', async () =>
	{
		// Arrange
		const successMessage = 'Success!';
		const callback = '/patterns';
		const data = { _success: successMessage };
		const props = { callback };
		mockFormRequest.formData.mockResolvedValue(createFakeFormData({
			_action: action,
		}));
		mockISOQuery.mockResolvedValueOnce({ _success: successMessage });

		// Act
		vi.useFakeTimers();
		const { rerender } = setup(props);

		const result = await Form.action(mockFormRequest, mockAppContext as any);

		mockFetcherData = createMockFetcherData(data);

		rerender(MemoryRouterForm(props));

		// Assert
		const alert = screen.getByRole('alert');
		expect(alert).toBeDefined();
		expect(alert.classList).toContain('Alert-success');
		expect(alert.innerHTML).toBe(successMessage);

		expect(result).toMatchObject({
			...data,
			formId: expect.any(String),
			formSubmissionId: expect.any(Number),
		});

		await act(async () =>
		{
			vi.advanceTimersByTime(5 * 1000);
		});

		expect(mockUseNavigate).toHaveBeenCalledWith(callback);

		// Cleanup
		vi.useRealTimers();
	});

	// example: Add Buddy (Forum Post) vs Buddies Page Add Buddy
	test('if no default image, perform only the callback', async () =>
	{
		// Arrange
		const callback = '/buddies';
		const props = { callback };
		mockFormRequest.formData.mockResolvedValue(createFakeFormData({
			_action: action,
			_callback: callback,
		}));
		mockISOQuery.mockResolvedValueOnce({ _success: 'Success!', _successImage: constants.allImages['icons/icon_check.png'] });

		// Act
		setup(props);

		const result = await Form.action(mockFormRequest, mockAppContext as any);

		// Assert
		expect(result).toEqual({ type: 'redirect', path: callback });
	});

	test('shows notice message', async () =>
	{
		// Arrange
		const noticeMessage = 'Notice';
		const data = { _notice: noticeMessage };
		mockFormRequest.formData.mockResolvedValue(createFakeFormData({
			_action: action,
		}));
		mockISOQuery.mockResolvedValueOnce({ _notice: noticeMessage });

		// Act
		const { rerender } = setup();

		const result = await Form.action(mockFormRequest, mockAppContext as any);

		mockFetcherData = createMockFetcherData(data);

		rerender(MemoryRouterForm());

		// Assert
		const alert = screen.getByRole('alert');
		expect(alert).toBeDefined();
		expect(alert.classList).toContain('Alert-info');
		expect(alert.innerHTML).toBe(noticeMessage);

		expect(result).toMatchObject({
			...data,
			formId: expect.any(String),
			formSubmissionId: expect.any(Number),
		});
	});

	test('shows logout message and then executes callback', async () =>
	{
		// Arrange
		const logoutMessage = 'Logout';
		const data = { _logout: logoutMessage };
		mockFormRequest.formData.mockResolvedValue(createFakeFormData({
			_action: action,
		}));
		mockISOQuery.mockResolvedValueOnce({ _logout: logoutMessage });

		const openMock = vi.fn();
		const sendMock = vi.fn();

		global.XMLHttpRequest = vi.fn(() => ({
			open: openMock,
			send: sendMock,
			setRequestHeader: vi.fn(),
		})) as any;

		// Act
		vi.useFakeTimers();
		const { rerender } = setup();

		const result = await Form.action(mockFormRequest, mockAppContext as any);

		mockFetcherData = createMockFetcherData(data);

		rerender(MemoryRouterForm());

		// Assert
		const alert = screen.getByRole('alert');
		expect(alert).toBeDefined();
		expect(alert.classList).toContain('Alert-info');
		expect(alert.innerHTML).toBe(logoutMessage);

		expect(result).toMatchObject({
			...data,
			formId: expect.any(String),
			formSubmissionId: expect.any(Number),
		});

		expect(openMock).toHaveBeenCalledWith('POST', '/auth/logout');
		expect(sendMock).toHaveBeenCalled();

		await act(async () =>
		{
			vi.advanceTimersByTime(5 * 1000);
		});

		expect(mockUseNavigate).toHaveBeenCalledWith('/', { replace: true });

		// Cleanup
		vi.useRealTimers();
	});

	test('executes given callback', async () =>
	{
		// Arrange
		const callback = '/signup';
		mockFormRequest.formData.mockResolvedValue(createFakeFormData({
			_action: action,
		}));
		mockISOQuery.mockResolvedValueOnce({ _callback: callback });

		// Act
		setup();

		const result = await Form.action(mockFormRequest, mockAppContext as any);

		// Assert
		expect(result).toEqual({ type: 'redirect', path: callback });
	});

	test('executes generated callback with data', async () =>
	{
		// Arrange
		const patternId = 584;
		const props = { callback: '/pattern/:id' };
		mockFormRequest.formData.mockResolvedValue(createFakeFormData({
			_action: action,
			_callback: props.callback,
		}));
		mockISOQuery.mockResolvedValueOnce({ id: patternId });

		// Act
		setup(props);

		const result = await Form.action(mockFormRequest, mockAppContext as any);

		// Assert
		expect(result).toEqual({ type: 'redirect', path: `/pattern/${patternId}` });
	});

	test('executes generated callback forced reload', async () =>
	{
		// Arrange
		const patternId = 584;
		const props = { callback: '/pattern/:id', reload: true };
		mockFormRequest.formData.mockResolvedValue(createFakeFormData({
			_action: action,
			_callback: props.callback,
			_reload: String(props.reload),
		}));
		mockISOQuery.mockResolvedValueOnce({ id: patternId });

		// Act
		setup(props);

		const result = await Form.action(mockFormRequest, mockAppContext as any);

		// Assert
		expect(result).toEqual({ type: 'redirectDocument', path: `/pattern/${patternId}` });
	});

	test('executes current location with data', async () =>
	{
		// Arrange
		const patternId = 584;
		mockFormRequest.formData.mockResolvedValue(createFakeFormData({
			_action: action,
			_callback_uri: '/pattern/:id',
		}));
		mockISOQuery.mockResolvedValueOnce({ id: patternId });

		// Act
		setup();

		const result = await Form.action(mockFormRequest, mockAppContext as any);

		// Assert
		expect(result).toEqual({ type: 'redirectDocument', path: `/pattern/${patternId}` });
	});

	test('executes generated callback without data', async () =>
	{
		// Arrange
		const callback = '/patterns';
		const props = { callback };
		mockFormRequest.formData.mockResolvedValue(createFakeFormData({
			_action: action,
			_callback: props.callback,
		}));
		mockISOQuery.mockResolvedValueOnce(undefined);

		// Act
		setup(props);

		const result = await Form.action(mockFormRequest, mockAppContext as any);

		// Assert
		expect(result).toEqual({ type: 'redirect', path: callback });
	});

	test('executes current location without data', async () =>
	{
		// Arrange
		const callback = '/patterns';
		mockFormRequest.formData.mockResolvedValue(createFakeFormData({
			_action: action,
			_callback_uri: callback,
		}));
		mockISOQuery.mockResolvedValueOnce(undefined);

		// Act
		setup();

		const result = await Form.action(mockFormRequest, mockAppContext as any);

		// Assert
		expect(result).toEqual({ type: 'redirectDocument', path: callback });
	});

	test('handles API errors correctly (custom message)', async () =>
	{
		// Arrange
		const errorMessage = 'Error occurred';
		const error = { message: errorMessage };
		const data = { errors: [error] };
		mockFormRequest.formData.mockResolvedValue(createFakeFormData({
			_action: action,
		}));
		mockISOQuery.mockRejectedValueOnce(error);

		// Act
		const { rerender } = setup();

		const result = await Form.action(mockFormRequest, mockAppContext as any);

		mockFetcherData = createMockFetcherData(data);

		rerender(MemoryRouterForm());

		// Assert
		expect(screen.getByText(errorMessage)).toBeDefined();

		expect(result).toMatchObject({
			...data,
			formId: expect.any(String),
			formSubmissionId: expect.any(Number),
		});
	});

	test('handles API errors correctly (identifier)', async () =>
	{
		// Arrange
		const identifier = 'bad-format';
		const error = { identifiers: [identifier] };
		const data = { errors: error.identifiers };
		mockFormRequest.formData.mockResolvedValue(createFakeFormData({
			_action: action,
		}));
		mockISOQuery.mockRejectedValueOnce(error);

		// Act
		const { rerender } = setup();

		const result = await Form.action(mockFormRequest, mockAppContext as any);

		mockFetcherData = createMockFetcherData(data);

		rerender(MemoryRouterForm());

		// Assert
		expect(screen.getByText((ERROR_MESSAGES as any)[identifier].message)).toBeDefined();

		expect(result).toMatchObject({
			...data,
			formId: expect.any(String),
			formSubmissionId: expect.any(Number),
		});
	});

	test('handles API errors correctly (ProfanityError)', async () =>
	{
		// Arrange
		const error = new ProfanityError('profanity,word');
		const data = { errors: [{ name:'ProfanityError', message: `${(ERROR_MESSAGES as any)[(error as any).identifier].message} ${(error as any).words}` }] };
		mockFormRequest.formData.mockResolvedValue(createFakeFormData({
			_action: action,
		}));
		mockISOQuery.mockRejectedValueOnce(error);

		// Act
		const { rerender } = setup();

		const result = await Form.action(mockFormRequest, mockAppContext as any);

		mockFetcherData = createMockFetcherData(data);

		rerender(MemoryRouterForm());

		// Assert
		expect(screen.getByText((data.errors as any)[0].message)).toBeDefined();

		expect(result).toMatchObject({
			...data,
			formId: expect.any(String),
			formSubmissionId: expect.any(Number),
		});
	});

	test('handles API errors correctly (unknown)', async () =>
	{
		// Arrange
		const identifier = 'bad-format';
		const data = { errors: [identifier] };
		mockFormRequest.formData.mockResolvedValue(createFakeFormData({
			_action: action,
		}));
		mockISOQuery.mockRejectedValueOnce(undefined);

		// Act
		const { rerender } = setup();

		const result = await Form.action(mockFormRequest, mockAppContext as any);

		mockFetcherData = createMockFetcherData(data);

		rerender(MemoryRouterForm());

		// Assert
		expect(screen.getByText((ERROR_MESSAGES as any)[identifier].message)).toBeDefined();

		expect(result).toMatchObject({
			...data,
			formId: expect.any(String),
			formSubmissionId: expect.any(Number),
		});
	});

	test('clears errors after resubmitting form', async () =>
	{
		const errorMessage = 'Error occurred';
		const error = { message: errorMessage };
		const data = { errors: [error] };
		mockFormRequest.formData.mockResolvedValue(createFakeFormData({
			_action: action,
		}));
		mockISOQuery.mockRejectedValueOnce(error);

		const { rerender } = setup();

		const result = await Form.action(mockFormRequest, mockAppContext as any);

		mockFetcherData = createMockFetcherData(data);

		rerender(MemoryRouterForm());

		expect(screen.getByText(errorMessage)).toBeDefined();

		expect(result).toMatchObject({
			...data,
			formId: expect.any(String),
			formSubmissionId: expect.any(Number),
		});

		const data2 = { _success: 'Success!' };
		mockISOQuery.mockResolvedValueOnce({ _success: 'Success!' });

		const result2 = await Form.action(mockFormRequest, mockAppContext as any);

		mockFetcherData = createMockFetcherData(data2);

		rerender(MemoryRouterForm());

		expect(screen.queryByText(errorMessage)).toBeNull();

		expect(result2).toMatchObject({
			...data2,
			formId: expect.any(String),
			formSubmissionId: expect.any(Number),
		});
	});

	test('displays messages at the bottom when enabled', async () =>
	{
		// Arrange
		const data = { _success: 'Success!' };
		const props = { messagesAtBottom: true };
		mockFormRequest.formData.mockResolvedValue(createFakeFormData({
			_action: action,
		}));
		mockISOQuery.mockResolvedValueOnce({ _success: 'Success!' });

		// Act
		const { rerender } = setup(props);

		const result = await Form.action(mockFormRequest, mockAppContext as any);

		mockFetcherData = createMockFetcherData(data);

		rerender(MemoryRouterForm(props));

		// Assert
		const input = screen.getByRole('textbox');
		const alert = screen.getByRole('alert');
		const inputIndex = input.compareDocumentPosition(alert);
		expect(inputIndex).toEqual(2);

		expect(result).toMatchObject({
			...data,
			formId: expect.any(String),
			formSubmissionId: expect.any(Number),
		});
	});

	test('displays messages at the top by default', async () =>
	{
		// Arrange
		const data = { _success: 'Success!' };
		mockFormRequest.formData.mockResolvedValue(createFakeFormData({
			_action: action,
		}));
		mockISOQuery.mockResolvedValueOnce({ _success: 'Success!' });

		// Act
		const { rerender } = setup();

		const result = await Form.action(mockFormRequest, mockAppContext as any);

		mockFetcherData = createMockFetcherData(data);

		rerender(MemoryRouterForm());

		// Assert
		const input = screen.getByRole('textbox');
		const alert = screen.getByRole('alert');
		const inputIndex = input.compareDocumentPosition(alert);
		expect(inputIndex).toEqual(4);

		expect(result).toMatchObject({
			...data,
			formId: expect.any(String),
			formSubmissionId: expect.any(Number),
		});
	});

	test('displays button with text', async () =>
	{
		// Arrange
		const buttonText = 'Save';

		//  Act
		setup({ showButton: true, buttonText });

		// Assert
		const button = screen.getByRole('button');
		expect(button).toBeDefined();
		expect(button.innerHTML).toBe(buttonText);
	});

	test('disables and re-enables button on submit', async () =>
	{
		const data = { _success: 'Success!' };
		const props = { showButton: true };

		const { rerender } = setup(props);
		const button = screen.getByRole('button');

		expect(button).toBeDefined();

		mockFetcherData = createMockFetcherData(data);

		rerender(MemoryRouterForm(props));

		expect(button.getAttribute('disabled')).toBeDefined();

		mockFetcherData = null;

		rerender(MemoryRouterForm(props));

		expect(button.getAttribute('disabled')).toBeNull();
	});

	test('signup action includes IP addresses', async () =>
	{
		// Arrange
		const signupAction = 'v1/signup/signup';
		const ipAddress = '192.168.1.1';
		const callback = '/signup-complete';
		mockFormRequest.formData.mockResolvedValue(createFakeFormData({
			_action: signupAction,
			_callback: callback,
		}));
		mockFormRequest.headers = {
			get: (key: string) => key === 'x-forwarded-for' ? ipAddress : null,
		};
		mockISOQuery.mockResolvedValueOnce({ _callback: callback });

		// Act
		setup();
		const result = await Form.action(mockFormRequest, mockAppContext as any);

		// Assert
		expect(mockISOQuery).toHaveBeenCalledWith(
			mockAppContext.session.user,
			signupAction,
			expect.objectContaining({ ipAddresses: ipAddress }),
		);
		expect(result).toEqual({ type: 'redirect', path: callback });
	});

	test('session-less context (logged out user)', async () =>
	{
		// Arrange
		const callback = '/patterns';
		mockFormRequest.formData.mockResolvedValue(createFakeFormData({
			_action: action,
			_callback: callback,
		}));
		mockISOQuery.mockResolvedValueOnce(undefined);

		const noSessionContext = { session: undefined };

		// Act
		const result = await Form.action(mockFormRequest, noSessionContext as any);

		// Assert
		expect(mockISOQuery).toHaveBeenCalledWith(
			undefined,
			action,
			expect.any(Object),
		);
		expect(result).toEqual({ type: 'redirect', path: callback });
	});

	test('hash path callback with data', async () =>
	{
		// Arrange
		const props = { callback: '/forums?reload=:threadId' };
		mockFormRequest.formData.mockResolvedValue(createFakeFormData({
			_action: action,
			_callback: props.callback,
		}));
		mockISOQuery.mockResolvedValueOnce({ threadId: 42 });

		// Act
		setup(props);
		const result = await Form.action(mockFormRequest, mockAppContext as any);

		// Assert
		expect(result).toEqual({ type: 'redirect', path: '/forums#42' });
	});

	test('hash path on current location (no callback)', async () =>
	{
		// Arrange
		mockFormRequest.formData.mockResolvedValue(createFakeFormData({
			_action: action,
			_callback_uri: '/forums?reload=:threadId',
		}));
		mockISOQuery.mockResolvedValueOnce({ threadId: 99 });

		// Act
		setup();
		const result = await Form.action(mockFormRequest, mockAppContext as any);

		// Assert
		expect(result).toEqual({ type: 'redirectDocument', path: '/forums#99' });
	});

	test('non-object return (string) redirects to callback', async () =>
	{
		// Arrange
		const callback = '/patterns';
		const props = { callback };
		mockFormRequest.formData.mockResolvedValue(createFakeFormData({
			_action: action,
			_callback: callback,
		}));
		mockISOQuery.mockResolvedValueOnce('some string result');

		// Act
		setup(props);
		const result = await Form.action(mockFormRequest, mockAppContext as any);

		// Assert
		expect(result).toEqual({ type: 'redirect', path: callback });
	});

	test('non-object return (number) redirects to current location', async () =>
	{
		// Arrange
		const currentUri = '/some-page';
		mockFormRequest.formData.mockResolvedValue(createFakeFormData({
			_action: action,
			_callback_uri: currentUri,
		}));
		mockISOQuery.mockResolvedValueOnce(42);

		// Act
		setup();
		const result = await Form.action(mockFormRequest, mockAppContext as any);

		// Assert
		expect(result).toEqual({ type: 'redirectDocument', path: currentUri });
	});

	test('redirect via SSR actionData', async () =>
	{
		// Arrange
		const redirect = 'https://example.com/other';
		const props = { formId: 'redirect-ssr' };
		const data = { _redirect: redirect, formId: props.formId };

		// Act
		const { rerender } = setup(props);

		mockActionData = createMockFetcherData(data);

		rerender(MemoryRouterForm(props));

		// Assert
		expect(window.location.href).toBe(redirect);
	});

	test('formId matches action string (SSR)', async () =>
	{
		// Arrange
		const successMessage = 'It worked!';
		// formId on data matches the action string, not a custom formId prop
		const data = { _success: successMessage, formId: action };

		// Act
		const { rerender } = setup(); // no formId prop, so form uses action as formId

		mockActionData = createMockFetcherData(data);

		rerender(MemoryRouterForm());

		// Assert
		const alert = screen.getByRole('alert');
		expect(alert).toBeDefined();
		expect(alert.classList).toContain('Alert-success');
		expect(alert.innerHTML).toBe(successMessage);
	});

	test('rapid resubmission clears previous success timeout', async () =>
	{
		// Arrange
		const data1 = { _success: 'First success' };
		const data2 = { _success: 'Second success' };

		// Act
		vi.useFakeTimers();
		const { rerender } = setup();

		// First submission
		mockFetcherData = createMockFetcherData(data1);
		rerender(MemoryRouterForm());

		expect(screen.getByRole('alert').innerHTML).toBe('First success');

		// Advance partway (not enough to clear first timeout)
		await act(async () =>
		{
			vi.advanceTimersByTime(3 * 1000);
		});

		// Second submission before first timeout fires
		mockFetcherData = createMockFetcherData(data2);
		rerender(MemoryRouterForm());

		expect(screen.getByRole('alert').innerHTML).toBe('Second success');

		// First timeout would have fired at 10s (7s from now) — but it was cleared
		// Second timeout fires at 10s from second submission (10s from now)
		// At 7s, message should still be visible
		await act(async () =>
		{
			vi.advanceTimersByTime(7 * 1000);
		});

		expect(screen.getByRole('alert')).toBeDefined();
		expect(screen.getByRole('alert').innerHTML).toBe('Second success');

		// Now expire the second timeout
		await act(async () =>
		{
			vi.advanceTimersByTime(3 * 1000);
		});

		expect(screen.queryByRole('alert')).toBeNull();

		// Cleanup
		vi.useRealTimers();
	});

	test('success callback navigates with data params', async () =>
	{
		// Arrange
		const callback = '/pattern/:id';
		const returnData = { id: 123, _internal: 'filtered' };
		const data = { _success: 'Saved!', data: returnData };
		const props = { callback };

		// Act
		vi.useFakeTimers();
		const { rerender } = setup(props);

		mockFetcherData = createMockFetcherData(data);
		rerender(MemoryRouterForm(props));

		// Assert
		expect(screen.getByRole('alert').innerHTML).toBe('Saved!');

		await act(async () =>
		{
			vi.advanceTimersByTime(5 * 1000);
		});

		// Should navigate with data params, filtering out underscore-prefixed keys
		expect(mockUseNavigate).toHaveBeenCalledWith('/pattern/123');

		// Cleanup
		vi.useRealTimers();
	});

	test('className and id props pass through to form element', () =>
	{
		// Arrange & Act
		setup({ className: 'my-form-class', id: 'my-form-id' });

		// Assert
		const form = screen.getByRole('form');
		expect(form.getAttribute('class')).toBe('my-form-class');
		expect(form.getAttribute('id')).toBe('my-form-id');
	});
});
