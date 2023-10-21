import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import DOMPurify from 'dompurify';

const HTMLPurify = ({className, html}) =>
{
	const [curHtml, setCurHtml] = useState(html);

	useEffect(() =>
	{
		setCurHtml(DOMPurify.sanitize(curHtml));
	}, [])

	return (
		<div
			className={className}
			dangerouslySetInnerHTML={{ __html: curHtml}}
		/>
	);
}

HTMLPurify.propTypes = {
	className: PropTypes.string.isRequired,
	html: PropTypes.string.isRequired,
}

export default HTMLPurify;