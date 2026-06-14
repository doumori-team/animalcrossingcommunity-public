import { ReactNode, useState, useRef, useEffect } from 'react';

import { constants } from '@utils';
import { RequireUser, RequireClientJS } from '@behavior';
import { iso } from 'common/iso.ts';
import { NodeReactionType } from 'common/types';

const EmojiUsersModal = ({ nodeId, children }: EmojiUsersModalProps) =>
{
	const [isOpen, setIsOpen] = useState<boolean>(false);
	const [selectedEmoji, setSelectedEmoji] = useState<NodeReactionType | null>(null);
	const [reactions, setReactions] = useState<NodeReactionType[]>([]);
	const modalRef = useRef<HTMLDivElement>(null);

	useEffect(() =>
	{
		const handleClickOutside = (e: MouseEvent) =>
		{
			if (!modalRef.current?.contains(e.target as Node))
			{
				setIsOpen(false);
				setSelectedEmoji(null);
			}
		};

		document.addEventListener('click', handleClickOutside);

		return () => document.removeEventListener('click', handleClickOutside);
	}, []);

	const getReactions = async () =>
	{
		const params = {
			id: nodeId,
		};

		(await iso).query(null, 'v1/node/reactions', params)
			.then((data: NodeReactionType[]) =>
			{
				setReactions(data);
			})
			.catch((_: unknown) =>
			{
				// records error on server side
			});
	};

	return (
		<RequireClientJS>
			<RequireUser silent>
				<div className='EmojiUsersModal' ref={modalRef}>
					<button
						className='EmojiUsersModal_summaryButton'
						onClick={async () =>
						{
							const newOpenState = !isOpen;
							setIsOpen(newOpenState);

							if (newOpenState)
							{
								await getReactions();
							}
							else
							{
								setSelectedEmoji(null);
							}
						}}
					>
						{children}
					</button>

					{isOpen &&
						<div className='EmojiUsersModal_popover'>
							<div className='EmojiUsersModal_emojiList'>
								{reactions.map((r) =>
									<div
										key={r.emoji}
										className='EmojiUsersModal_emojiItem'
										onClick={() => setSelectedEmoji(r)}
									>
										<img
											className='EmojiUsersModal_emoji'
											src={`${constants.AWS_URL}/images/games/nh/reactions/${r.src}.png`}
											alt={r.emoji}
											title={r.emoji}
										/>
										<span className='EmojiUsersModal_count'>{r.users.length}</span>
									</div>,
								)}
							</div>

							<div className='EmojiUsersModal_userList'>
								{selectedEmoji?.users.map((u) =>
									<div key={u.id}>{u.username}</div>,
								)}
							</div>
						</div>
					}
				</div>
			</RequireUser>
		</RequireClientJS>
	);
};

type EmojiUsersModalProps = {
	nodeId: number
	children: ReactNode
};

export default EmojiUsersModal;
