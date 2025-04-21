let isoModule;

if ((import.meta as any).env.SSR)
{
	isoModule = import('server/iso-server.ts');
}
else
{
	isoModule = import('client/iso-client.ts');
}

export const iso = isoModule.then(module => module);

/*
 * The point is for code in the 'common' directory to be able to call functions
 * that work differently on the client and on the server.
 */

/**
 * client (useEffect): iso-client > api-requests > iso-server > API function
 * client / SSR / server: iso-server > API function
 */
