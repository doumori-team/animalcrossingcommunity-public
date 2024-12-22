import React, { useState } from 'react';

import { RequireClientJS } from '@behavior';
import { Button } from '@form';
import ErrorMessage from '@/components/layout/ErrorMessage.tsx';

const Tabs = ({
	variant = 'light',
	children,
	defaultActiveKey,
	onSelect,
	fallback = <ErrorMessage identifier='javascript-required' />,
}: TabsProps) =>
{
	const [selectedEventKey, setSelectedEventKey] = useState<string>(defaultActiveKey);

	const handleTabChange = (eventKey: string): void =>
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
	};

	return (
		<RequireClientJS fallback={fallback}>
			<div className='Tabs'>
				<div className='Tab_buttons'>
					{children.map((child: any) =>
						<Button
							key={child.props.eventKey}
							clickHandler={() => handleTabChange(child.props.eventKey)}
							className={`${selectedEventKey === child.props.eventKey ?
								'active' : ''} btn-${variant}`}
							label={child.props.title}
						/>,
					)}
				</div>
				{children.map((child: any) =>
				{
					if (child.props.eventKey === selectedEventKey)
					{
						return child;
					}
				})}
			</div>
		</RequireClientJS>
	);
};

type TabsProps = {
	defaultActiveKey: string
	onSelect?: (eventKey: string) => void
	variant?: 'dark' | 'light'
	children: any
	fallback?: any
};

const Tab = ({
	children,
}: TabProps) =>
{
	return (
		<div className='Tab'>
			{children}
		</div>
	);
};

Tabs.Tab = Tab;

type TabProps = {
	children: any
	eventKey: string
	title: string
};

export default Tabs;
