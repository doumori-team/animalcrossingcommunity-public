import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { RequireClientJS } from '@behavior';
import { Form, Checkbox } from '@form';

const SelectAllCheckbox = ({name, label, select, checked}) =>
{
	const [value, setValue] = useState(false);

	return (
		<RequireClientJS>
			<Form.Group>
				<Checkbox
					name={name}
					label={label}
					value={value}
					clickHandler={() => document.querySelectorAll(select).forEach(e => {
						const newValue = !value;
						setValue(newValue);

						if (checked || newValue)
						{
							e.checked = 1;
						}
						else
						{
							e.checked = 0;
						}
					})}
				/>
			</Form.Group>
		</RequireClientJS>
	);
}

SelectAllCheckbox.propTypes = {
	name: PropTypes.string.isRequired,
	label: PropTypes.string.isRequired,
	select: PropTypes.string.isRequired,
	checked: PropTypes.bool.isRequired,
};

SelectAllCheckbox.defaultProps = {
	name: 'toggle',
	label: 'Check All',
	checked: false,
};

export default SelectAllCheckbox;