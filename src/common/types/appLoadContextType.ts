import { Request } from 'express';

interface AppLoadContextType
{
	session: Request['session']
	headers: Request['headers']
	httpVersion: Request['httpVersion']
	method: Request['method']
	url: Request['url']
	sessionID: Request['sessionID']
}

export type { AppLoadContextType };
