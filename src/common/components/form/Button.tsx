import Spinner from '@/components/form/Spinner.tsx';

const Button = ({
	label,
	children,
	loading = false,
	clickHandler,
	type = 'button',
	className,
	title,
	image,
	form,
	disabled = false,
}: ButtonProps) =>
{
	return (
		image ?
			<input
				type='image'
				src={image}
				aria-label={label}
				title={title}
				onClick={clickHandler}
			/>
			:
			<button
				type={type}
				onClick={clickHandler}
				aria-label={label}
				className={className}
				title={title}
				aria-disabled={loading || disabled}
				disabled={loading || disabled}
				form={form}
			>
				{loading ?
					<Spinner />
					:
					children ? children : label
				}
			</button>

	);
};

type ButtonProps = {
	label?: string
	children?: any
	loading?: boolean
	// MouseEvent<HTMLButtonElement> | MouseEvent<HTMLInputElement>
	clickHandler?: (e: any) => any
	type?: 'button' | 'submit'
	className?: string
	title?: string
	image?: string
	form?: string
	disabled?: boolean
};

export default Button;
