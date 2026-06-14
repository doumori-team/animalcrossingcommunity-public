/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from 'react';

import { RequireClientJS, RequireUser } from '@behavior';
import { FontAwesomeIcon } from '@layout';
import { ReactionType } from '@types';

const EmojiPicker = ({ onEmojiSelect, accEmojis }: EmojiPickerProps) =>
{
	const [open, setOpen] = useState<boolean>(false);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const pickerRef = useRef<HTMLDivElement>(null);

	useEffect(() =>
	{
		function handleClickOutside(e: MouseEvent)
		{
			if (
				pickerRef.current &&
				!pickerRef.current.contains(e.target as Node) &&
				buttonRef.current &&
				!buttonRef.current.contains(e.target as Node)
			)
			{
				setOpen(false);
			}
		}

		document.addEventListener('mousedown', handleClickOutside);

		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	return (
		<RequireClientJS>
			<RequireUser silent>
				<div className='EmojiPicker'>
					<button className='EmojiPicker_addButton' ref={buttonRef} onClick={() => setOpen((o) => !o)}>
						<FontAwesomeIcon name='plus' alt='Add Reaction' />
					</button>

					{open &&
						<div
							ref={pickerRef}
							className='EmojiPicker_picker'
						>
							<div className='EmojiPicker_grid'>
								{accEmojis.map((emoji) =>
									<button
										key={emoji.id}
										onClick={() =>
										{
											onEmojiSelect(emoji);
											setOpen(false);
										}}
									>
										<img
											src={emoji.src}
											alt={emoji.name}
											title={emoji.name}
										/>
									</button>,
								)}
							</div>

							{accEmojis.length === 0 &&
								<div className='EmojiPicker_search_nonFound'>
									No emojis found
								</div>
							}
						</div>
					}
				</div>
			</RequireUser>
		</RequireClientJS>
	);
};

type EmojiPickerProps = {
	onEmojiSelect: (data: any) => void
	accEmojis: ReactionType[]
};

export default EmojiPicker;
