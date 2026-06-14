import { ReactNode, useState, useEffect } from 'react';

const RequireNotifications = ({
	children,
}: RequireNotificationsProps) =>
{
	const [allowsNotifications, setAllowsNotifications] = useState(false);

	useEffect(() =>
	{
		const supportsPush =
			typeof window !== 'undefined' &&
			'serviceWorker' in navigator &&
			'PushManager' in window &&
			'Notification' in window;

		setAllowsNotifications(supportsPush);
	}, []);

	if (allowsNotifications)
	{
		return children;
	}
	else
	{
		return null;
	}
};

type RequireNotificationsProps = {
	children: ReactNode
};

export default RequireNotifications;
