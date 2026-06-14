import React, { useState, useRef, useCallback, useEffect } from 'react';

import { FontAwesomeIcon } from '@layout';
import { Button } from '@form';
import { getNoteImage, getNoteDisplayName, getNoteName, playNote, stopCurrentNote, NOTE_DURATION_MS } from '@/components/tunes/tuneAudio.ts';

// Scale order top (high) to bottom (low), then specials
// 16 positions total, index 0 = top of slot, index 15 = bottom
const scaleOrder = [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 15, 1, 0];
const TOTAL_POSITIONS = scaleOrder.length;

function getPositionForNote(noteId: number): number
{
	const idx = scaleOrder.indexOf(noteId);
	return idx >= 0 ? idx : 0;
}

// Convert position index (0=top, 15=bottom) to a percentage offset within the slot
function getTopPercent(position: number): number
{
	return position / (TOTAL_POSITIONS - 1) * 100;
}

const TuneEditor = ({
	notes: initialNotes,
	onNotesChange,
}: TuneEditorProps) =>
{
	const [notes, setNotes] = useState<number[]>(initialNotes);
	const [selectedCol, setSelectedCol] = useState<number>(0);
	const [playingCol, setPlayingCol] = useState<number | null>(null);
	const [isPlaying, setIsPlaying] = useState<boolean>(false);
	const editorRef = useRef<HTMLDivElement | null>(null);
	const playTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
	const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const latestNotesRef = useRef<number[]>(initialNotes);

	useEffect(() =>
	{
		latestNotesRef.current = notes;
	}, [notes]);

	const stopPlayback = useCallback(() =>
	{
		if (playTimeoutRef.current)
		{
			clearTimeout(playTimeoutRef.current);
			playTimeoutRef.current = null;
		}

		stopCurrentNote(currentSourceRef, stopTimerRef);

		setIsPlaying(false);
		setPlayingCol(null);
	}, []);

	useEffect(() =>
	{
		return () =>
		{
			stopPlayback();
		};
	}, [stopPlayback]);

	const setNote = useCallback((colIndex: number, noteId: number) =>
	{
		setNotes(prev =>
		{
			const next = [...prev];
			next[colIndex] = noteId;

			if (onNotesChange)
			{
				onNotesChange(next);
			}

			return next;
		});

		playNote(noteId, currentSourceRef, stopTimerRef);
	}, [onNotesChange]);

	const moveNoteUp = useCallback((colIndex: number) =>
	{
		const currentNoteId = latestNotesRef.current[colIndex];
		const currentPos = getPositionForNote(currentNoteId);

		if (currentPos > 0)
		{
			setNote(colIndex, scaleOrder[currentPos - 1]);
		}
	}, [setNote]);

	const moveNoteDown = useCallback((colIndex: number) =>
	{
		const currentNoteId = latestNotesRef.current[colIndex];
		const currentPos = getPositionForNote(currentNoteId);

		if (currentPos < TOTAL_POSITIONS - 1)
		{
			setNote(colIndex, scaleOrder[currentPos + 1]);
		}
	}, [setNote]);

	const playAllNotes = useCallback(() =>
	{
		if (isPlaying)
		{
			stopPlayback();
			return;
		}

		setIsPlaying(true);

		let index = 0;

		const playNext = () =>
		{
			const currentNotes = latestNotesRef.current;

			if (index >= currentNotes.length)
			{
				setIsPlaying(false);
				setPlayingCol(null);
				return;
			}

			const noteId = currentNotes[index];
			setPlayingCol(index);

			const noteName = getNoteName(noteId);

			if (noteName === 'zz')
			{
				stopCurrentNote(currentSourceRef, stopTimerRef);
			}
			else if (noteName === '--')
			{
				// Sustain
			}
			else
			{
				playNote(noteId, currentSourceRef, stopTimerRef);
			}

			index++;
			playTimeoutRef.current = setTimeout(playNext, NOTE_DURATION_MS);
		};

		playNext();
	}, [isPlaying, stopPlayback]);

	const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) =>
	{
		switch (e.key)
		{
			case 'ArrowUp':
				e.preventDefault();
				moveNoteUp(selectedCol);
				break;
			case 'ArrowDown':
				e.preventDefault();
				moveNoteDown(selectedCol);
				break;
			case 'ArrowLeft':
				e.preventDefault();
				setSelectedCol(prev => Math.max(0, prev - 1));
				break;
			case 'ArrowRight':
				e.preventDefault();
				setSelectedCol(prev => Math.min(15, prev + 1));
				break;
			case ' ':
				e.preventDefault();
				playAllNotes();
				break;
		}
	}, [selectedCol, moveNoteUp, moveNoteDown, playAllNotes]);

	const renderRow = (startIndex: number) =>
	{
		const slots = notes.slice(startIndex, startIndex + 8);

		return (
			<div className='TuneEditor_row'>
				<div className='TuneEditor_staffLines'>
					<div className='TuneEditor_staffLine' style={{ top: '20%' }} />
					<div className='TuneEditor_staffLine' style={{ top: '40%' }} />
					<div className='TuneEditor_staffLine' style={{ top: '60%' }} />
					<div className='TuneEditor_staffLine' style={{ top: '80%' }} />
				</div>

				{slots.map((noteId, i) =>
				{
					const colIndex = startIndex + i;
					const isSelected = selectedCol === colIndex;
					const isPlayingThis = playingCol === colIndex;
					const position = getPositionForNote(noteId);
					const topPct = getTopPercent(position);

					return (
						<div
							key={colIndex}
							className={
								`TuneEditor_slot${
									isSelected ? ' TuneEditor_slot--selected' : ''
								}${
									isPlayingThis ? ' TuneEditor_slot--playing' : ''
								}`
							}
							onClick={() =>
							{
								setSelectedCol(colIndex);
								playNote(noteId, currentSourceRef, stopTimerRef);
							}}
						>
							<button
								type='button'
								className='TuneEditor_upBtn'
								onClick={(e) =>
								{
									e.stopPropagation();
									setSelectedCol(colIndex);
									moveNoteUp(colIndex);
								}}
								tabIndex={-1}
								aria-label={`Move note ${colIndex + 1} up`}
							>
								<FontAwesomeIcon name='chevron-up' alt='Up' />
							</button>

							<div className='TuneEditor_frogArea'>
								<div
									className='TuneEditor_frog'
									style={{ top: `${topPct}%` }}
								>
									<img
										src={getNoteImage(noteId)}
										alt={getNoteDisplayName(noteId)}
										className='TuneEditor_frogImage'
									/>
								</div>
							</div>

							<button
								type='button'
								className='TuneEditor_downBtn'
								onClick={(e) =>
								{
									e.stopPropagation();
									setSelectedCol(colIndex);
									moveNoteDown(colIndex);
								}}
								tabIndex={-1}
								aria-label={`Move note ${colIndex + 1} down`}
							>
								<FontAwesomeIcon name='chevron-down' alt='Down' />
							</button>
						</div>
					);
				})}
			</div>
		);
	};

	return (
		<div
			className='TuneEditor'
			ref={editorRef}
			tabIndex={0}
			onKeyDown={handleKeyDown}
		>
			<div className='TuneEditor_board'>
				{renderRow(0)}
				{renderRow(8)}
			</div>

			<div className='TuneEditor_controls'>
				<Button
					clickHandler={playAllNotes}
					label={isPlaying ? 'Stop' : 'Play tune'}
					className='TuneEditor_playButton'
				>
					<FontAwesomeIcon
						name={isPlaying ? 'stop' : 'play'}
						alt={isPlaying ? 'Stop' : 'Play'}
					/>
					<span>{isPlaying ? 'Stop' : 'Play'}</span>
				</Button>
			</div>

			<p className='TuneEditor_hint'>
				Click a frog and use ▲ ▼ or arrow keys to change notes. Press space to play!
			</p>
			<p className='TuneEditor_hint'>
				No sound? Check that your device isn't on silent mode.
			</p>

			{notes.map((noteId, index) =>
				<input
					key={index}
					type='hidden'
					name={`noteId${index}`}
					value={noteId}
				/>,
			)}
		</div>
	);
};

export type TuneEditorProps = {
	notes: number[]
	onNotesChange?: (notes: number[]) => void
};

export default TuneEditor;
