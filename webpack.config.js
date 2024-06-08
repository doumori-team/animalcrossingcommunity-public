import path from 'path';
import webpack from 'webpack';

export default
{
	entry: './lib/client/client.js',

	output:
	{
		path: path.join(process.cwd(), 'lib/client/static'),
		filename: '[name].js'
	},

	optimization:
	{
		splitChunks: {
			cacheGroups: {
				commons: {
					test: /[\\/]node_modules[\\/]/,
					name: "vendor",
					chunks: "initial",
				},
			},
		},
	},

	plugins:
	[
		// Replace all imports of iso-server.js with iso-client.js
		new webpack.NormalModuleReplacementPlugin(
			/server\/iso-server\.js/,
			'../client/iso-client.js'
		),
		// webpack no longer handles process (ex. process.env) natively
		new webpack.ProvidePlugin({
			process: 'process/browser',
		}),
		// Helps move process calls to client side
		// see local.sh for local environment variables
		// see heroku config vars for heroku environment variables
		new webpack.EnvironmentPlugin({
			HEROKU_APP_NAME: 'acc-test',
			AWS_URL: 'https://dts8l1aj0iycv.cloudfront.net',
			PAYPAL_BUTTON_ID: 'RN59DNFQPMKHG',
			PAYPAL_MERCHANT_ID: 'WDGA2G3D6TBRL'
		})
	],

	watchOptions:
	{
		ignored: /node_modules/, // improves performance (these should be static)
		poll: true // we're in a VM
	}
}