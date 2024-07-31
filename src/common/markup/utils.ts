export function escapeHtml(string:string) : string
{
	// Note that the resulting string is safe to transclude as text in an HTML
	// document, but NOT in an attribute value.
	return (string as any).replace(/[&<>]/g,
		function(match:string)
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
export function stringAt(str:string, n:number) : string|undefined
{
    n = Math.trunc(n) || 0;
    if (n < 0) n += str.length;
    if (n < 0 || n >= str.length) return undefined;
    return str[n];
}