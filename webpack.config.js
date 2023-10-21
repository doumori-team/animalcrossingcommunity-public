import path from 'path';
import webpack from 'webpack';
import TerserPlugin from 'terser-webpack-plugin';

// Options for JavaScript minification
const minimizer = new TerserPlugin(
{
	terserOptions:
	{
		mangle: false
	}
});

export default
{
	entry: './lib/client/client.js',
	output:
	{
		path: path.join(process.cwd(), 'lib/client/static'),
		filename: '[name].js'
	},

	// Use Babel to convert "modern" syntax and JSX into older syntax for
	// better cross-browser compatibility
	module:
	{
		rules:
		[
			{
				test: /.js$/,
				resolve: {
				  fullySpecified: false
				},
				use: 'babel-loader'
			}
		]
	},

	optimization:
	{
		minimizer: [minimizer],
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

	// frontend absolute paths
	resolve: {
		alias: {
			common: './lib/common/',
			components: './lib/common/components/',
			"@behavior": './lib/common/components/behavior/index',
			"@form": './lib/common/components/form/index',
			"@layout": './lib/common/components/layout/index',
			pages: './lib/common/components/pages/',
			"@propTypes": './lib/common/propTypes/index',
			"@utils": './lib/common/utils/index',
			"@contexts": './lib/common/contexts',
			"@errors": './lib/common/errors',
		}
	},

	// Replace all imports of iso-server.js with iso-client.js
	plugins:
	[
		new webpack.NormalModuleReplacementPlugin(
			/server\/iso-server\.js/,
			'../client/iso-client.js'
		),
		// Helps move process calls to client side
		new webpack.EnvironmentPlugin([
			'HEROKU_APP_NAME',
			'AWS_URL',
			'PAYPAL_BUTTON_ID',
			'PAYPAL_MERCHANT_ID'
		])
	],

	watchOptions:
	{
		ignored: /node_modules/, // improves performance (these should be static)
		poll: true // we're in a VM
	}
}