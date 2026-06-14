import { useEffect, useState } from 'react';

import { constants } from '@utils';

let ws: WebSocket | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let reconnectTimeout: any | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const subscribers: Record<string, Set<(payload: any) => void>> = {};

function connectWebSocket(userId: number)
{
	if (ws)
	{
		return;
	}

	ws = new WebSocket(`wss://${constants.WS_URL}`);

	ws.addEventListener('message', (event) =>
	{
		try
		{
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const data: { type: string; payload: any } = JSON.parse(event.data);

			const subs = subscribers[data.type];

			if (subs)
			{
				subs.forEach((cb) => cb(data.payload));
			}
		}
		catch (err)
		{
			console.error('Invalid WebSocket message', err);
		}
	});

	ws.addEventListener('close', () =>
	{
		ws = null;

		reconnectTimeout = setTimeout(() => connectWebSocket(userId), 500);
	});

	ws.addEventListener('error', (err) =>
	{
		console.error('WebSocket error', err);
		ws?.close();
	});
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useNotifications<T = any>(userId: number, type: string)
{
	const [payload, setPayload] = useState<T | null>(null);

	useEffect(() =>
	{
		if (userId <= 0)
		{
			return;
		}

		connectWebSocket(userId);

		if (!subscribers[type])
		{
			subscribers[type] = new Set();
		}

		const callback = (data: T) => setPayload(data);
		subscribers[type].add(callback);

		return () =>
		{
			subscribers[type].delete(callback);

			if (subscribers[type].size === 0)
			{
				delete subscribers[type];
			}

			if (Object.keys(subscribers).length === 0 && ws)
			{
				ws.close();
				ws = null;

				if (reconnectTimeout)
				{
					clearTimeout(reconnectTimeout);
				}
			}
		};
	}, [userId, type]);

	return payload;
}

export function setLiveMode(userId: number, threadId: number)
{
	if (ws)
	{
		ws.send(JSON.stringify({ type: 'setLiveMode', userId: userId, nodeId: threadId }));
	}
}

export function unsetLiveMode(userId: number, threadId: number)
{
	if (ws)
	{
		ws.send(JSON.stringify({ type: 'unsetLiveMode', userId: userId, nodeId: threadId }));
	}
}
