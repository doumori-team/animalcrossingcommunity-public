import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';

const HTMLPurify = ({
	className,
	html
}: HTMLPurifyProps) =>
{
	const [curHtml, setCurHtml] = useState<string>(html);

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

type HTMLPurifyProps = {
	className: string
	html: string
};

export default HTMLPurify;