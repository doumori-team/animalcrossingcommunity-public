import { WebSocketServer, WebSocket } from 'ws';
import { parse } from 'cookie';
import signature from 'cookie-signature';
import Redis from 'ioredis';

import { sessionStore } from './sessionStore.ts';

type LiveModeEntry = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	timer: any
	nodeId: string
};

export const userSockets = new Map<string, WebSocket[]>();
export const userLiveModes = new Map<string, LiveModeEntry[]>();
const HEARTBEAT_INTERVAL = 30000;
const liveModeExpiry = 60 * 60 * 1000;
export let wss: WebSocketServer;

let redisClient: Redis | null = null;
let redisSub: Redis | null = null;
const redisChannel = 'notifications';

function initRedis()
{
	if (!process.env.REDISCLOUD_URL)
	{
		console.info(`info: [Redis] Client not started: REDISCLOUD_URL is not set`);
		return;
	}

	if (redisClient)
	{
		console.info(`info: [Redis] Client not started: redisClient already set`);
		return;
	}

	console.info(`info: [Redis] Client starting. Adapters: [ioredis]`);

	redisClient = new Redis(process.env.REDISCLOUD_URL, { family: 6 });
	redisSub = new Redis(process.env.REDISCLOUD_URL, { family: 6 });

	redisSub.subscribe(redisChannel, (err) =>
	{
		if (err)
		{
			console.error('info: [Redis] Redis subscribe error', err);
		}
	});

	redisSub.on('message', (channel, message) =>
	{
		if (channel !== redisChannel)
		{
			return;
		}

		try
		{
			const { userId, type, payload } = JSON.parse(message);

			deliverToLocalUser(userId, type, payload);
		}
		catch (err)
		{
			console.error('info: [Redis] Error, failed to parse Redis notification for WebSocket,', err);
		}
	});
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function initWebSocket(server: any)
{
	initRedis();

	wss = new WebSocketServer({ server });

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	wss.on('connection', (ws: WebSocket, req: any) =>
	{
		const cookies = parse(req.headers.cookie || '');
		const signedSid = cookies['connect.sid'];
		const sid = signedSid?.startsWith('s:')
			? signature.unsign(signedSid.slice(2), process.env.COOKIE_SECRET)
			: signedSid;

		if (!sid)
		{
			return ws.close();
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		sessionStore.get(sid, async (err: Error | null, sessionData: any | undefined) =>
		{
			if (err || !sessionData?.user)
			{
				return ws.close();
			}

			const userId = sessionData.user;
			const userIdStr = String(userId);

			const existing = userSockets.get(userIdStr) || [];
			existing.push(ws);
			userSockets.set(userIdStr, existing);

			const existingLiveModes = userLiveModes.get(userIdStr) || [];

			existingLiveModes.forEach(liveMode =>
			{
				clearTimeout(liveMode.timer);

				liveMode.timer = setTimeout(() =>
				{
					let timeoutLiveModes = userLiveModes.get(userIdStr) || [];
					const remaining = timeoutLiveModes.filter(x => x.nodeId !== liveMode.nodeId);

					if (remaining.length > 0)
					{
						userLiveModes.set(userIdStr, remaining);
					}
					else
					{
						userLiveModes.delete(userIdStr);

						if (redisClient)
						{
							redisClient.srem(`liveMode:${liveMode.nodeId}`, userIdStr);
						}
					}
				}, liveModeExpiry);
			});

			userLiveModes.set(userIdStr, existingLiveModes);

			if (redisClient)
			{
				await redisClient.sadd('connectedUsers', userIdStr);
			}

			ws.on('close', async () =>
			{
				const sockets = userSockets.get(userIdStr) || [];
				const remaining = sockets.filter((s) => s !== ws);

				if (remaining.length > 0)
				{
					userSockets.set(userIdStr, remaining);
				}
				else
				{
					userSockets.delete(userIdStr);
				}

				if (redisClient)
				{
					await redisClient.srem('connectedUsers', userIdStr);
				}
			});
		});

		ws.on('message', async (msg: string) =>
		{
			try
			{
				const data = JSON.parse(msg);

				const nodeIdStr = data.nodeId.toString();
				const userIdStr = data.userId.toString();

				if (!nodeIdStr || !userIdStr)
				{
					return;
				}

				let liveModes = userLiveModes.get(userIdStr) || [];

				if (data.type === 'setLiveMode')
				{
					let liveMode = liveModes.find(x => x.nodeId === nodeIdStr);

					if (liveMode)
					{
						clearTimeout(liveMode.timer);

						liveMode.timer = setTimeout(() =>
						{
							let timeoutLiveModes = userLiveModes.get(userIdStr) || [];
							const remaining = timeoutLiveModes.filter(x => x.nodeId !== liveMode.nodeId);

							if (remaining.length > 0)
							{
								userLiveModes.set(userIdStr, remaining);
							}
							else
							{
								userLiveModes.delete(userIdStr);

								if (redisClient)
								{
									redisClient.srem(`liveMode:${nodeIdStr}`, userIdStr);
								}
							}
						}, liveModeExpiry);

						const existing = liveModes.filter(x => x.nodeId !== nodeIdStr);
						existing.push(liveMode);
						userLiveModes.set(userIdStr, existing);
					}
					else
					{
						liveModes.push({
							nodeId: nodeIdStr,
							timer: setTimeout(() =>
							{
								let timeoutLiveModes = userLiveModes.get(userIdStr) || [];
								const remaining = timeoutLiveModes.filter(x => x.nodeId !== nodeIdStr);

								if (remaining.length > 0)
								{
									userLiveModes.set(userIdStr, remaining);
								}
								else
								{
									userLiveModes.delete(userIdStr);

									if (redisClient)
									{
										redisClient.srem(`liveMode:${nodeIdStr}`, userIdStr);
									}
								}
							}, liveModeExpiry),
						});

						userLiveModes.set(userIdStr, liveModes);
					}

					if (redisClient)
					{
						await redisClient.sadd(`liveMode:${nodeIdStr}`, userIdStr);
					}
				}
				else if (data.type === 'unsetLiveMode')
				{
					const remaining = liveModes.filter(x => x.nodeId !== nodeIdStr);

					if (remaining.length > 0)
					{
						userLiveModes.set(userIdStr, remaining);
					}
					else
					{
						userLiveModes.delete(userIdStr);
					}

					if (redisClient)
					{
						await redisClient.srem(`liveMode:${nodeIdStr}`, userIdStr);
					}
				}
			}
			catch (err)
			{
				console.error('[WebSocket] Error, Failed to parse message', err);
			}
		});
	});

	setInterval(heartbeat, HEARTBEAT_INTERVAL);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendNotificationToUser(userId: number, type: string, payload: any)
{
	if (redisClient)
	{
		await redisClient.publish(redisChannel, JSON.stringify({ userId, type, payload }));
	}
	else
	{
		deliverToLocalUser(userId, type, payload);
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deliverToLocalUser(userId: string | number, type: string, payload: any)
{
	const sockets = userSockets.get(String(userId));

	if (!sockets)
	{
		return;
	}

	sockets
		.filter(ws => ws.readyState === WebSocket.OPEN)
		.map(ws => ws.send(JSON.stringify({ type, payload })));
}

export async function getAllConnectedUserIds(): Promise<number[]>
{
	if (redisClient)
	{
		return (await redisClient.smembers('connectedUsers')).map(Number);
	}

	return Array.from(userSockets.keys()).map(Number);
}

export async function getAllLiveModeUserIds(threadId: number): Promise<number[]>
{
	if (redisClient)
	{
		return (await redisClient.smembers(`liveMode:${String(threadId)}`)).map(Number);
	}

	return [...userLiveModes.entries()]
		.filter(([_, entries]) => entries.some(x => x.nodeId === String(threadId)))
		.map(([userId]) => Number(userId));
}

function heartbeat()
{
	for (const [, sockets] of userSockets)
	{
		for (const ws of sockets)
		{
			if (ws.readyState === WebSocket.OPEN)
			{
				ws.ping();
			}
		}
	}
}
