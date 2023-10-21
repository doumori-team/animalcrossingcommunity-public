export * from '../server/iso-server.js';

/* When Webpack compiles and bundles client-side JavaScript, it rewrites this
 * to '../client/iso-client.js'.
 * The point is for code in the 'common' directory to be able to call functions
 * that work differently on the client and on the server.
 */
