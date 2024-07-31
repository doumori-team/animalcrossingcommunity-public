import React, { useState, useEffect } from 'react';

/* Helper component. Checks to make sure that the client-side script has loaded
 * before rendering the content inside it. This is for things that can't
 * realistically be made to run on the server rendering path, such as animations
 * or complex graphical operations.
 *
 * Optionally, provide a value to the "fallback" prop, which will display
 * instead of the blocked content. This should be used either to explain to the
 * user what has gone wrong, or to provide a less full-featured version of the
 * content.
 *
 * Example usage:
 * 	<RequireClientJS fallback={<ErrorMessage identifier='javascript-required' />}>
 * 		<p>(something complicated, probably involving animations)</p>
 * 	</RequireClientJS>
 */
const RequireClientJS = ({
	children,
	fallback
}: RequireClientJSProps) =>
{
	const [clientActive, setClientActive] = useState<boolean>(false);

	useEffect(() =>
	{
		setClientActive(true);
	}, [])

	if (clientActive)
	{
		return children || null;
	}
	else
	{
		return fallback || null;
	}
}

type RequireClientJSProps = {
	children?: React.ReactNode
	fallback?: React.ReactNode
};

export default RequireClientJS;
