import { useRef, useEffect } from 'react';

import * as markup from 'common/markup.ts';
import { EmojiSettingType, MarkupFormatType, NodeChildNodesType, UserPollType } from '@types';
import HTMLPurify from '@/components/layout/HTMLPurify.tsx';
import { UserContext } from '@contexts';
import { utils } from '@utils';
import { iso } from 'common/iso.ts';

/* Converts forum markup into HTML.
 *
 * Accepts props:
 *	- text: The unparsed markup.
 * 	- format: The syntax used. May be 'plaintext', 'bbcode', 'bbcode+html',
 * 			'markdown', or 'markdown+html'.
 * 	- emojiSettings: user emoji settings, for preview and gendered emojis
 */

const Markup = ({
	text,
	format,
	emojiSettings,
	nodeQuotes,
	pageLink,
	polls,
	pollVoteApiCall,
	pollVoteRedirect,
}: MarkupProps) =>
{
	const formatClassName = format.split('+')[0];

	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() =>
	{
		const root = containerRef.current;

		if (!root)
		{
			return;
		}

		if (!polls || polls.length === 0 || utils.realStringLength(pollVoteApiCall) === 0)
		{
			return;
		}

		const handleClick = async (e: Event) =>
		{
			const target = e.target as HTMLElement;

			if (!target.classList.contains('Markdown_PollButton'))
			{
				return;
			}

			const markup = target.closest('.Markup-markdown');

			if (!markup)
			{
				return;
			}

			const polls = markup.querySelectorAll<HTMLInputElement>('.Markdown_Poll');

			const pollOptions = new Map<number | string, string[]>();
			let pollId: number | null | string = 0;

			for (const poll of polls)
			{
				const inputs = poll.querySelectorAll<HTMLInputElement>("input[type='radio'], input[type='checkbox']");

				const choices: string[] = [];

				inputs.forEach(input =>
				{
					if (input.checked)
					{
						choices.push(input.value);
					}
				});

				if (choices.length === 0)
				{
					return;
				}

				pollId = poll.getAttribute('data-poll-id');

				if (pollId === null)
				{
					return;
				}

				pollOptions.set(pollId, choices);
			}

			if (pollOptions.size === 0)
			{
				return;
			}

			await Promise.all(
				Array.from(pollOptions.entries()).map(async ([key, value]) =>
					(await iso).query(null, pollVoteApiCall, {
						pollId: key,
						choices: value,
					}),
				),
			);

			if (pollVoteRedirect)
			{
				window.location.href = `${pollVoteRedirect}?voted=${pollId}`;
			}
		};

		root.addEventListener('click', handleClick);

		return () =>
		{
			root.removeEventListener('click', handleClick);
		};
	}, [text, format]);

	return (
		<UserContext.Consumer>
			{currentUser =>
				<div ref={containerRef}>
					<HTMLPurify
						className={`Markup Markup-${formatClassName}`}
						html={markup.parse({
							text: text,
							format: format,
							emojiSettings: emojiSettings,
							currentUser: currentUser,
							nodeQuotes: nodeQuotes,
							pageLink: pageLink,
							polls: polls,
						})}
					/>
				</div>
			}
		</UserContext.Consumer>
	);
};

type MarkupProps = {
	text: string
	format: MarkupFormatType
	emojiSettings?: EmojiSettingType[]
	nodeQuotes?: NodeChildNodesType['nodeQuotes']
	pageLink?: string
	polls?: UserPollType[]
	pollVoteApiCall?: string
	pollVoteRedirect?: string
};

export default Markup;
