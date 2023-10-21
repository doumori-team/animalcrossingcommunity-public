export function escapeHtml(string)
{
	// Note that the resulting string is safe to transclude as text in an HTML
	// document, but NOT in an attribute value.
	return string.replace(/[&<>]/g,
		function(match)
		{
			switch(match)
			{
				case '&': return '&amp;';
				case '<': return '&lt;';
				case '>': return '&gt;';
			}
		}
	);
}

/**
 * Basic polyfill for String.at() javascript function.
 */
export function stringAt(str, n)
{
    n = Math.trunc(n) || 0;
    if (n < 0) n += str.length;
    if (n < 0 || n >= str.length) return undefined;
    return str[n];
}