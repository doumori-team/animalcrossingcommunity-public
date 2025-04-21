import { useState } from 'react';

import { RequireClientJS } from '@behavior';
import { Form, Checkbox } from '@form';

const SelectAllCheckbox = ({
	name = 'toggle',
	label = 'Check All',
	select,
	checked = false,
}: SelectAllCheckboxProps) =>
{
	const [value, setValue] = useState<boolean>(false);

	return (
		<RequireClientJS>
			<Form.Group>
				<Checkbox
					name={name}
					label={label}
					value={value}
					clickHandler={() => document.querySelectorAll<HTMLInputElement>(select).forEach((e: HTMLInputElement) =>
					{
						const newValue = !value;
						setValue(newValue);

						if (checked || newValue)
						{
							e.checked = true;
						}
						else
						{
							e.checked = false;
						}
					})}
				/>
			</Form.Group>
		</RequireClientJS>
	);
};

type SelectAllCheckboxProps = {
	name?: string
	label?: string
	select: string
	checked?: boolean
};

export default SelectAllCheckbox;
