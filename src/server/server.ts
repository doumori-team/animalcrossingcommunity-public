import { URL } from 'url';

import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import express from 'express';
import multer from 'multer';
import { Judoscale, middleware as judoscaleMiddleware } from 'judoscale-express';

import apiRequests from './middleware/api-requests.ts';
import handleLoginLogout from './middleware/handle-login-logout.ts';
import paypalIpn from './middleware/paypal-ipn.ts';
import reactRendering from './middleware/react-rendering.ts';
import sessionManagement from './middleware/session-management.ts';
import testSitePassword from './middleware/test-site-password.ts';
import mailParse from './middleware/mail-parse.ts';

// Create a new Express app
// see CloudFront Lambda@Edge function for another set of Cache-Control headers
const app = express();

// Specify paths for static files and HTML templates
const staticFilesPath = new URL('../client/static', import.meta.url).pathname;
const layoutsPath = new URL('./views', import.meta.url).pathname;

// Configuration for Express
app.set('port', (process.env.PORT || 5000));
app.set('views', layoutsPath);
app.set('view engine', 'ejs');

// Handle PayPal requests to ACC
app.use('/paypal_ipn', paypalIpn);

// Add library middleware
app.use(express.static(staticFilesPath));       // Serve static files
app.use(cookieParser());                        // Self-explanatory; used for test website cookie
app.use(multer().any());                        // Parse form submissions
app.use(bodyParser.urlencoded({                 // Parse queries from _getLoaderFunction
	type: 'application/x-www-form-urlencoded',
	extended: true
}));
app.use(judoscaleMiddleware(new Judoscale({
	api_base_url: process.env.JUDOSCALE_URL
})));

// Add custom middleware (from the middleware/ source folder)
app.use('/mail', mailParse);
app.use(testSitePassword);
app.use(sessionManagement);
app.use('/auth', handleLoginLogout);
app.use('/api', apiRequests);
app.use(reactRendering);

// Run!
app.listen(app.get('port'), () =>
{
	const port = app.get('port');
	console.log(`ACC is running at http://localhost:${port}/`);
});
