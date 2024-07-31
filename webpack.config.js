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
					name: 'vendor',
					chunks: 'initial',
				},
			},
		},
	},

	// webpack no longer handles process (ex. process.env) natively
	resolve: {
		alias: {
		   process: 'process/browser'
		}
	},

	plugins:
	[
		// Replace all imports of iso-server.js with iso-client.js
		// *.ts is converted to *.js first with babel so keep *.js
		new webpack.NormalModuleReplacementPlugin(
			/server\/iso-server\.js/,
			'../client/iso-client.js'
		),
		// Helps move process calls to client side
		// see local.sh for local environment variables
		// see heroku config vars for heroku environment variables
		new webpack.EnvironmentPlugin({
			HEROKU_APP_NAME: 'acc-test',
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