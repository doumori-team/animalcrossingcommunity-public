import React from 'react';

import { utils, constants } from '@utils';

export const NOTE_DURATION_MS = 250;
const NOTE_SOUND_DURATION_MS = 1000;

const townTunes = utils.getTownTunes();

const allTunesModules = import.meta.glob(
	'/src/client/tunes/*.mp3',
	{
		eager: true,
		query: '?url',
		import: 'default',
	},
);

const allTunes: Record<string, string> = Object.fromEntries(
	Object.entries(allTunesModules).map(([path, url]) =>
	{
		const filename = path.split('/').pop() || '';
		return [filename, url as string];
	}),
);

let audioContext: AudioContext | null = null;
const bufferCache = new Map<number, AudioBuffer>();
let preloaded = false;
let preloadPromise: Promise<void> | null = null;

function getAudioContext(): AudioContext
{
	if (!audioContext)
	{
		const AudioContextClass = window.AudioContext ||
			(window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
		audioContext = new AudioContextClass();

		const silentBuffer = audioContext.createBuffer(1, 1, 22050);
		const source = audioContext.createBufferSource();
		source.buffer = silentBuffer;
		source.connect(audioContext.destination);
		source.start(0);
	}

	return audioContext;
}

async function preloadAudio(): Promise<void>
{
	const ctx = getAudioContext();

	if (ctx.state === 'suspended')
	{
		await ctx.resume();
	}

	const promises = townTunes
		.filter(note => 'sound_name' in note)
		.map(async (note) =>
		{
			const soundName = (note as { sound_name?: string }).sound_name;

			if (!soundName || !allTunes[soundName])
			{
				return;
			}

			try
			{
				const response = await fetch(allTunes[soundName]);
				const arrayBuffer = await response.arrayBuffer();
				const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
				bufferCache.set(note.id, audioBuffer);
			}
			catch
			{
				// Ignore fetch/decode errors for individual notes
			}
		});

	await Promise.all(promises);
}

export function getNoteImage(noteId: number): string
{
	const note = townTunes.find(n => n.id === noteId);

	if (!note)
	{
		return '';
	}

	return constants.allImages[`tunes/${note.img_name}`] || '';
}

export function getNoteName(noteId: number): string
{
	const note = townTunes.find(n => n.id === noteId);
	return note ? note.name : '';
}

export function getNoteDisplayName(noteId: number): string
{
	const name = getNoteName(noteId);

	switch (name)
	{
		case 'zz': return 'Rest';
		case '--': return 'Sustain';
		case '?': return 'Ribbit';
		default: return name;
	}
}

export function stopCurrentNote(
	sourceRef: React.RefObject<AudioBufferSourceNode | null>,
	stopTimerRef: React.RefObject<ReturnType<typeof setTimeout> | null>,
): void
{
	if (stopTimerRef.current)
	{
		clearTimeout(stopTimerRef.current);
		stopTimerRef.current = null;
	}

	if (sourceRef.current)
	{
		try
		{
			sourceRef.current.stop();
		}
		catch
		{
			// Already stopped
		}

		sourceRef.current = null;
	}
}

function playBuffer(
	noteId: number,
	ctx: AudioContext,
	buffer: AudioBuffer,
	sourceRef: React.RefObject<AudioBufferSourceNode | null>,
	stopTimerRef: React.RefObject<ReturnType<typeof setTimeout> | null>,
): void
{
	const source = ctx.createBufferSource();
	source.buffer = buffer;
	source.connect(ctx.destination);
	source.start(0);
	sourceRef.current = source;

	stopTimerRef.current = setTimeout(() =>
	{
		try
		{
			source.stop();
		}
		catch
		{
			// Already stopped
		}

		if (sourceRef.current === source)
		{
			sourceRef.current = null;
		}
	}, NOTE_SOUND_DURATION_MS);
}

export function playNote(
	noteId: number,
	sourceRef: React.RefObject<AudioBufferSourceNode | null>,
	stopTimerRef: React.RefObject<ReturnType<typeof setTimeout> | null>,
): void
{
	const ctx = getAudioContext();

	if (ctx.state === 'suspended')
	{
		ctx.resume();
	}

	if (!preloaded)
	{
		preloaded = true;
		preloadPromise = preloadAudio();
	}

	stopCurrentNote(sourceRef, stopTimerRef);

	const buffer = bufferCache.get(noteId);

	if (buffer)
	{
		playBuffer(noteId, ctx, buffer, sourceRef, stopTimerRef);
		return;
	}

	if (preloadPromise)
	{
		preloadPromise.then(() =>
		{
			const readyBuffer = bufferCache.get(noteId);

			if (readyBuffer)
			{
				playBuffer(noteId, ctx, readyBuffer, sourceRef, stopTimerRef);
			}
		});
	}
}
