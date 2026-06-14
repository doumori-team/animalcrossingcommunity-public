import { useState, useRef, useCallback, useEffect } from 'react';

import { FontAwesomeIcon } from '@layout';
import { Button } from '@form';
import { getNoteName, playNote, stopCurrentNote, NOTE_DURATION_MS } from '@/components/tunes/tuneAudio.ts';

const TunePlayer = ({
	notes,
}: TunePlayerProps) =>
{
	const [isPlaying, setIsPlaying] = useState<boolean>(false);
	const playTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
	const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const stopPlayback = useCallback(() =>
	{
		if (playTimeoutRef.current)
		{
			clearTimeout(playTimeoutRef.current);
			playTimeoutRef.current = null;
		}

		stopCurrentNote(currentSourceRef, stopTimerRef);

		setIsPlaying(false);
	}, []);

	useEffect(() =>
	{
		return () =>
		{
			stopPlayback();
		};
	}, [stopPlayback]);

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
			if (index >= notes.length)
			{
				setIsPlaying(false);
				return;
			}

			const noteId = notes[index];
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
	}, [isPlaying, notes, stopPlayback]);

	return (
		<Button
			clickHandler={playAllNotes}
			label={isPlaying ? 'Stop tune' : 'Play tune'}
			className={`TunePlayer_button${isPlaying ? ' TunePlayer_button--playing' : ''}`}
		>
			<FontAwesomeIcon
				name={isPlaying ? 'stop' : 'play'}
				alt={isPlaying ? 'Stop' : 'Play'}
			/>
		</Button>
	);
};

type TunePlayerProps = {
	notes: number[]
};

export default TunePlayer;
