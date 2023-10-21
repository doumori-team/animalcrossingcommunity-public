import { URL } from 'url';

import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import express from 'express';
import multer from 'multer';

import apiRequests from './middleware/api-requests.js';
import handleLoginLogout from './middleware/handle-login-logout.js';
import paypalIpn from './middleware/paypal-ipn.js';
import reactRendering from './middleware/react-rendering.js';
import sessionManagement from './middleware/session-management.js';
import testSitePassword from './middleware/test-site-password.js';

// Create a new Express app
const app = express();

// Specify paths for static files and HTML templates
const staticFilesPath = new URL('../client/static', import.meta.url).pathname;
const layoutsPath = new URL('./views', import.meta.url).pathname;

// Configuration for Express
app.set('port', (process.env.PORT || 5000));
app.set('views', layoutsPath);
app.set('view engine', 'ejs');

// Handle PayPal requests to ACC 2
app.use('/paypal_ipn', paypalIpn);

// Add library middleware
app.use(express.static(staticFilesPath));       // Serve static files
app.use(cookieParser());                        // Self-explanatory
app.use(multer().any());                        // Parse form submissions
app.use(bodyParser.urlencoded({                 // Parse queries from _getLoaderFunction
	type: 'application/x-www-form-urlencoded',
	extended: true
}));
// Add custom middleware (from the middleware/ source folder)
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
