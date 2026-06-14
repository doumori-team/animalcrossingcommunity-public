/* eslint-disable @typescript-eslint/no-explicit-any */
'use strict';

import { UserPollType } from '@types';

const TOKEN_TYPE = 'poll_block';
const TOKEN_TYPE_OPEN = 'poll_open';
const TOKEN_TYPE_CLOSE = 'poll_close';

function tokenize(state: any, startLine: number, endLine: number, silent: boolean)
{
	const startPos = state.bMarks[startLine] + state.tShift[startLine];
	const maxPos = state.eMarks[startLine];
	const line = state.src.slice(startPos, maxPos);

	const pollStartMatch = line.match(/\[poll(?:\s+type="(single|multi)")?\]/);

	if (!pollStartMatch)
	{
		return false;
	}

	if (silent)
	{
		return true;
	}

	const pollType = pollStartMatch[1] || 'single';
	const options: string[] = [];

	let nextLine = startLine + 1;

	while (nextLine < endLine)
	{
		const lineStart = state.bMarks[nextLine] + state.tShift[nextLine];
		const lineEnd = state.eMarks[nextLine];
		const content = state.src.slice(lineStart, lineEnd).trim();

		if (content === '[/poll]')
		{
			break;
		}

		if (content.startsWith('- '))
		{
			options.push(content.substring(2).trim());
		}

		nextLine++;
	}

	const open = state.push(TOKEN_TYPE_OPEN, 'div', 1);
	open.block = true;
	open.map = [startLine, nextLine + 1];
	open.meta = { pollType, options };

	const close = state.push(TOKEN_TYPE_CLOSE, 'div', -1);
	close.block = true;

	state.line = nextLine + 1;

	return true;
}

export default function poll(md: any, options: { polls?: UserPollType[] }): void
{
	md.block.ruler.before('paragraph', TOKEN_TYPE, tokenize, { alt: ['paragraph'] });

	let pollIndex = 0;

	md.renderer.rules[TOKEN_TYPE_OPEN] = (tokens: any, idx: number) =>
	{
		const currentOrder = pollIndex++;

		const { pollType, options: optsList } = tokens[idx].meta;
		const isMultipleChoice = pollType !== 'single';
		const inputType = !isMultipleChoice ? 'radio' : 'checkbox';

		const pollMatch = options.polls?.find(p => p.sortOrder === currentOrder);
		const pollIndexMatch = options.polls?.findIndex(p => p.sortOrder === currentOrder);

		const pollId = pollMatch ? pollMatch.id : 'preview';

		let html = `<div class="Markdown_Poll" data-poll-id="${pollId}">`;

		if (pollMatch && (pollMatch.userVoted || !pollMatch.active))
		{
			const totalVotes = pollMatch.options.reduce((acc, cur) =>
			{
				return acc + cur.votes;
			}, 0);

			pollMatch.options.forEach((opt) =>
			{
				const proportion = totalVotes > 0 ? isMultipleChoice ? opt.votes / pollMatch.totalUsers : opt.votes / totalVotes : 0;
				const amount = opt.votes + ' vote' + (opt.votes === 1 ? '' : 's');

				html += `
					<div class='PollOption'>
						<div class='PollOptionDescription Voted'>
							- ${opt.description}
						</div>
						<div class='PollOptionResult'>
							<meter
								class='PollOptionResult_meter'
								value=${proportion}
								title=${amount}
							></meter>
							<span class='PollOptionVotes'>
								${(proportion * 100).toFixed(1)}% (${amount})
							</span>
						</div>
					</div>
				`;
			});
		}
		else
		{
			optsList.forEach((opt: string, i: number) =>
			{
				html += `
					<label>
						<input type="${inputType}" name="choices" value="${i + 1}">
						${opt}
					</label><br>`;
			});

			if (pollIndexMatch !== undefined && pollIndexMatch + 1 === options.polls?.length || pollIndexMatch === undefined)
			{
				html += pollMatch
					? `<button class="Markdown_PollButton Form_button" aria-label="Vote!">Vote!</button>`
					: `<button class="Form_button" aria-label="Vote!" aria-disabled="true" disabled>Vote!</button>`;
			}
		}

		return html;
	};

	md.renderer.rules[TOKEN_TYPE_CLOSE] = () => `</div>`;
}
