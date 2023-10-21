import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { RequireClientJS } from '@behavior';
import { Button } from '@form';
import ErrorMessage from './ErrorMessage.js';

const Tabs = ({variant, children, defaultActiveKey, onSelect, fallback}) =>
{
	const [selectedEventKey, setSelectedEventKey] = useState(defaultActiveKey);

	const handleTabChange = (eventKey) =>
	{
		if (eventKey === selectedEventKey)
		{
			return;
		}

		if (onSelect)
		{
			onSelect(eventKey);
		}

		setSelectedEventKey(eventKey);
	}

	return (
		<RequireClientJS fallback={fallback}>
			<div className='Tabs'>
				<div className='Tab_buttons'>
					{children.map(child =>
						<Button
							key={child.props.eventKey}
							clickHandler={() => handleTabChange(child.props.eventKey)}
							className={`${selectedEventKey === child.props.eventKey ?
								'active' : ''} btn-${variant}`}
							label={child.props.title}
						/>
					)}
				</div>
				{children.map(child => {
					if (child.props.eventKey === selectedEventKey)
					{
						return child;
					}
				})}
			</div>
		</RequireClientJS>
	);
}

const Tab = ({children}) =>
{
	return (
		<div className='Tab'>
			{children}
		</div>
	);
}

Tabs.Tab = Tab;

Tab.propTypes = {
	eventKey: PropTypes.string.isRequired,
	title: PropTypes.string.isRequired,
};

Tabs.propTypes = {
	defaultActiveKey: PropTypes.string.isRequired,
	onSelect: PropTypes.func,
	variant: PropTypes.oneOf(['dark', 'light']).isRequired,
	children: PropTypes.array.isRequired,
	fallback: PropTypes.any,
};

Tabs.defaultProps = {
	fallback: <ErrorMessage identifier='javascript-required' />,
}

export default Tabs;