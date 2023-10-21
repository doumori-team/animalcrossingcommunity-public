import React from 'react';

import { ContentBox } from '@layout';

const CookiePolicyPage = () =>
{
	return (
		<div className='CookiePolicyPage'>
			<ContentBox>
				<h1>What are Cookies?</h1>
				<p>Cookies are files a website saves on your browser for various functionalities. Some purposes for which a website may use cookies are enabling sign-ins, remembering preferences, and fraud prevention.</p>
				<p>There are two types of cookies — essential and non-essential. Essential cookies are required for the site to run and cannot be opted out of. Non-essential cookies are useful cookies for some functionality and can be opted out of, although the site may stop working as intended. A list of both types of cookies that we use are below.</p>
				<h2>Essential Cookies</h2>
				<ul>
					<li>
						Session id: identifies who you are in order to serve content meant only for you and allows the website to see who is logged in.
					</li>
				</ul>
				<h2>Non-Essential Cookies</h2>
				<p>No non-essential cookies are in use at this time.</p>
			</ContentBox>
		</div>
	);
}

export default CookiePolicyPage;
