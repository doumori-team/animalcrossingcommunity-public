import { precacheAndRoute } from 'workbox-precaching';

precacheAndRoute(self.__WB_MANIFEST || []);

self.addEventListener('push', onPush);

async function onPush(event)
{
	if (!event.data)
	{
		return;
	}

	const data = event.data.json();
	const { title, body, url } = data;

	event.waitUntil(
		(async () =>
		{
			const clientList = await self.clients.matchAll({
				type: 'window',
				includeUncontrolled: true,
			});

			clientList.forEach(client => client.postMessage(data));

			const hasVisibleClient = clientList.some(
				c => c.visibilityState === 'visible',
			);

			if (!hasVisibleClient)
			{
				await self.registration.showNotification(title || 'Notification', {
					body: body || 'You have a new notification!',
					icon: '/apple-touch-icon.png',
					data: { url },
				});
			}
		})(),
	);
}

self.addEventListener('notificationclick', (event) =>
{
	event.notification.close();

	const targetUrl = event.notification.data?.url || '/notifications';

	event.waitUntil(
		self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) =>
		{
			for (const client of clientList)
			{
				if ('focus' in client)
				{
					client.focus();
					client.navigate(targetUrl);
					return;
				}
			}

			if (self.clients.openWindow)
			{
				return self.clients.openWindow(targetUrl);
			}
		}),
	);
});
