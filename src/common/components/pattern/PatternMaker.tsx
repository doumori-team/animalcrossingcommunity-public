import { useState, useEffect, useRef } from 'react';

import { utils, constants } from '@utils';
import { Select, Button, Text } from '@form';
import { ACGameType, PatternPalettesType, PatternColorsType, PatternColorInfoType } from '@types';
import { Form } from '@form';

const PatternMaker = ({
	gameColorInfo,
	gameColors,
	gamePalettes,
	acgames,
	data,
	initialDataUrl,
	initialGameId,
	initialPaletteId,
}: PatternMakerProps) =>
{
	// initialize 2D array used for storing colors used on canvas in X, Y positions
	let initialFormData: any = [];

	for (let i = 0; i < constants.pattern.paletteLength; i++)
	{
		initialFormData[i] = [];
	}

	let initialColors: any = gameColors[initialGameId], initialPalette: any = [];

	// we need to load the colors in the same order as the palette used
	const gamePaletteColors = (gamePalettes as any)[initialGameId][initialPaletteId - 1].colors;

	for (let key in gamePaletteColors)
	{
		initialPalette[key] = initialColors.indexOf(gamePaletteColors[key]);
	}

	// if editing an existing pattern...
	if (data)
	{
		let includedColors: any = [];

		// convert 1D array to 2D for X Y positions
		// this actually goes column by column instead of row by row
		for (let i = 0; i < constants.pattern.length; i++)
		{
			let x = i % constants.pattern.paletteLength;
			let y = Math.floor(i / constants.pattern.paletteLength);

			let rgb = data[i];
			initialFormData[y][x] = rgb;

			// while here build up list of unique colors
			if (!includedColors.includes(rgb))
			{
				includedColors.push(rgb);
			}
		}

		// for AC:NL & AC:NH, you can change out colors
		// change out any colors that aren't used for ones that are

		// what colors are in the pattern that isn't in the palette
		const incColors = includedColors.filter((x: any) => !gamePaletteColors.includes(x) && Number(x) !== constants.pattern.transparentColorId);

		if (incColors.length > 0)
		{
			// colors in the palette not used in the pattern
			const palColors = gamePaletteColors.filter((x: any) => !includedColors.includes(x));
			let i = 0;

			for (let key in initialPalette)
			{
				// if this color is one not used
				if (palColors.includes(initialColors[initialPalette[key]]))
				{
					// replace unused palette color with used pattern color
					initialPalette[key] = initialColors.indexOf(incColors[i]);
					i++;
				}

				if (incColors.length === i)
				{
					break;
				}
			}
		}
	}
	else
	{
		// for new pattern, fill out the canvas with background color
		// for NH, that's always the 13th color in the beginning
		for (let x = 0; x < constants.pattern.paletteLength; x++)
		{
			for (let y = 0; y < constants.pattern.paletteLength; y++)
			{
				initialFormData[x][y] = initialColors[initialPalette[12]];
			}
		}
	}

	let initialHue = 0, initialVividness = 0, initialBrightness = 0;

	if (initialGameId === constants.gameIds.ACNH)
	{
		const firstColor = (gameColorInfo as any)[initialGameId]
			.find((c: any) => c.hex === initialColors[initialPalette[0]]);

		if (firstColor)
		{
			initialHue = firstColor.hue;
			initialVividness = firstColor.vividness;
			initialBrightness = firstColor.brightness;
		}
	}

	let initialPaletteInterfaces = [];

	for (let i = 0; i <= constants.pattern.numberOfColors; i++)
	{
		initialPaletteInterfaces[i] = {
			border: '',
			backgroundColor: '',
		};
	}

	const [currentlyDrawing, setCurrentlyDrawing] = useState<boolean>(false);
	const [colors, setColors] = useState<any>(initialColors);
	const [palette, setPalette] = useState<any>(initialPalette);
	const [activePaletteId, setActivePaletteId] = useState<number>(0);
	const [formData, setFormData] = useState<any>(initialFormData);
	const [posX1, setPosX1] = useState<number>(0);
	const [posY1, setPosY1] = useState<number>(0);
	const [posX2, setPosX2] = useState<number>(constants.pattern.paletteLength - 1);
	const [posY2, setPosY2] = useState<number>(constants.pattern.paletteLength - 1);
	const [currentGameId, setCurrentGameId] = useState<number>(initialGameId);
	const [hue, setHue] = useState<number>(initialHue);
	const [vividness, setVividness] = useState<number>(initialVividness);
	const [brightness, setBrightness] = useState<number>(initialBrightness);
	const [paletteColorsKey, setPaletteColorsKey] = useState<number>(Math.random());
	const [dataUrl, setDataUrl] = useState<string>(initialDataUrl);
	const [gamePaletteId, setGamePaletteId] = useState<string>(initialGameId + '-' + initialPaletteId);
	const [paletteInterfaces, setPaletteInterfaces] = useState<any>(initialPaletteInterfaces);

	const patternInterface = useRef<any>(null);
	const paletteInterfaceExtended = useRef<any>(null);
	const didMount = useRef<any>(false);

	useEffect(() =>
	{
		if (!(didMount as any).mounted)
		{
			(didMount as any).mounted = true;

			if (data && utils.realStringLength(dataUrl) === 0)
			{
				stopDrawing();
			}
		}

		for (let i = 0; i <= constants.pattern.numberOfColors; i++)
		{
			drawPalette(i);
		}

		drawPaletteExtended();
		drawPattern(true, 0, 0, constants.pattern.paletteLength - 1, constants.pattern.paletteLength - 1);
	}, [currentGameId, palette]);

	const editIfDrawing = (e: any): void =>
	{
		if (currentlyDrawing)
		{
			editPattern(e);
		}
	};

	useEffect(() =>
	{
		if (!(didMount as any).formData)
		{
			(didMount as any).formData = true;
			return;
		}

		drawPattern(true, posX1, posY1, posX2, posY2);
	}, [formData]);

	// Changes the color of the 'pixel' indicated.
	const editPattern = (e: any): void =>
	{
		const pos = getCursorPosition(e, patternInterface.current);

		if (pos === false)
		{
			return;
		}

		const posx = (pos as any)[0], posy = (pos as any)[1];

		if (posx >= constants.pattern.paletteLength || posy >= constants.pattern.paletteLength)
		{
			return;
		}

		let dataArray = [...formData];

		if (activePaletteId === constants.pattern.numberOfColors)
		{
			dataArray[posx][posy] = constants.pattern.transparentColorId;
		}
		else
		{
			dataArray[posx][posy] = colors[palette[activePaletteId]];
		}

		setPosX1(posx);
		setPosY1(posy);
		setPosX2(posx);
		setPosY2(posy);
		setFormData(dataArray);
	};

	const stopDrawing = (): void =>
	{
		// clear the canvas of grid to save prettified pattern
		clearCanvas(patternInterface.current, 0, 0, constants.pattern.paletteLength, constants.pattern.paletteLength);
		drawPattern(false, 0, 0, constants.pattern.paletteLength - 1, constants.pattern.paletteLength - 1);

		setCurrentlyDrawing(false);
		setDataUrl(patternInterface.current.toDataURL());

		drawPattern(true, 0, 0, constants.pattern.paletteLength - 1, constants.pattern.paletteLength - 1);
	};

	// Changes the active palette color's slot in the palette to the one clicked on.
	const changePaletteColor = (e: any): void =>
	{
		const pos = getCursorPosition(e, paletteInterfaceExtended.current);

		if (pos === false)
		{
			return;
		}

		const posx = (pos as any)[0], posy = (pos as any)[1];

		if (posx >= 16 || posy >= 18 || posy % 4 === 3 || posx % 4 === 3 && posy < 16)
		{
			return;
		}

		// if clicked on whitespace, cancel action
		let groupx = Math.floor(posx / 4), groupy = Math.floor(posy / 4);
		let colorId;

		// hued color
		if (groupy < 4)
		{
			const ingroupx = posx % 4, ingroupy = posy % 4;
			const group = groupx + groupy * 4;
			const ingroup = ingroupx + ingroupy * 3;

			colorId = ingroup + group * 9;
		}
		// greyscale
		else
		{
			colorId = 16 * 9 + posx;
		}

		let array = [...palette];
		array[activePaletteId] = colorId;

		// update the palette to have new color
		let dataArray = [...formData];

		for (let x = 0; x < constants.pattern.paletteLength; x++)
		{
			for (let y = 0; y < constants.pattern.paletteLength; y++)
			{
				// if the old chosen palette color matches the pattern color
				if (colors[palette[activePaletteId]] === formData[x][y])
				{
					// update the pattern to have new color at that square
					dataArray[x][y] = colors[colorId];
				}
			}
		}

		setPalette(array);
		setPosX1(0);
		setPosY1(0);
		setPosX2(constants.pattern.paletteLength - 1);
		setPosY2(constants.pattern.paletteLength - 1);
		setFormData(dataArray);
	};

	useEffect(() =>
	{
		if (!(didMount as any).activePaletteId)
		{
			(didMount as any).activePaletteId = true;
			return;
		}

		drawPaletteExtended();
	}, [activePaletteId]);

	// Changes the active palette color to the one clicked on.
	const changeDrawingColor = (index: number): void =>
	{
		const oldColorIndex = activePaletteId;

		if (index === oldColorIndex)
		{
			return;
		}

		const color = (gameColorInfo as any)[currentGameId][palette[index]];

		setHue(color ? color.hue : 0);
		setVividness(color ? color.vividness : 0);
		setBrightness(color ? color.brightness : 0);
		setActivePaletteId(index);

		drawPalette(oldColorIndex);
		drawPalette(index);
	};

	// Draws one of the colors of the palette on the appropriate canvas.
	const drawPalette = (index: number): void =>
	{
		let newPaletteInterfaces = [...paletteInterfaces];

		// we don't need to fill in palette color if it's the transparent palette
		if (index === constants.pattern.numberOfColors)
		{
			newPaletteInterfaces[index].border = '1px solid #7E7B7B';
			setPaletteInterfaces(newPaletteInterfaces);

			return;
		}

		let rgb = colors[palette[index]];

		newPaletteInterfaces[index].backgroundColor = rgb;

		// if the fill color is white, we won't be able to see the palette color otherwise
		if (utils.isColorLight(rgb))
		{
			rgb = '#7E7B7B';
		}

		newPaletteInterfaces[index].border = '1px solid ' + rgb;

		setPaletteInterfaces(newPaletteInterfaces);

		setPaletteColorsKey(Math.random());
	};

	// Draws the extended palette on a canvas.
	const drawPaletteExtended = (): void =>
	{
		// this is only for NL
		if (currentGameId !== constants.gameIds.ACNL)
		{
			return;
		}

		clearCanvas(paletteInterfaceExtended.current, 0, 0, constants.pattern.paletteLength - 1, constants.pattern.paletteLength - 1);

		// i = color ID
		for (let i = 0; i < 159; i++)
		{
			// which of the ~9-color groups?
			const group = Math.floor(i / 9);

			// where in that group?
			const posingroup = i % 9;
			let x, y;

			// in one of the 16 hued groups
			if (group < 16)
			{
				x = group % 4 * 4 + posingroup % 3;
				y = group - group % 4 + Math.floor(posingroup / 3);
			}
			// on the greyscale
			else
			{
				x = i - 16 * 9;
				y = 16;
			}

			if (palette[activePaletteId] === i)
			{
				drawScaledSquare(paletteInterfaceExtended.current, x, y, colors[i], '#000');
			}
			else
			{
				drawScaledSquare(paletteInterfaceExtended.current, x, y, colors[i], false);
			}
		}
	};

	// Draws the pattern on a canvas.
	const drawPattern = (drawGrid: boolean, x1: number, y1: number, x2: number, y2: number): void =>
	{
		for (let x = x1; x <= x2; x++)
		{
			for (let y = y1; y <= y2; y++)
			{
				let rgb = formData[x][y];

				// draw the grid without a color
				if (Number(rgb) === constants.pattern.transparentColorId)
				{
					rgb = false;
				}

				if (drawGrid)
				{
					drawScaledSquare(patternInterface.current, x, y, rgb, '#888');
				}
				else
				{
					drawScaledSquare(patternInterface.current, x, y, rgb, false);
				}
			}
		}
	};

	// Clears the contents of a canvas.
	const clearCanvas = (canvas: any, x1: number, y1: number, x2: number, y2: number): void =>
	{
		const scale = canvas.dataset.scale;

		x1 *= scale;
		y1 *= scale;
		x2 *= scale;
		y2 *= scale;

		const height = y2 - y1 + 1;
		const width = x2 - x1 + 1;

		canvas.getContext('2d').clearRect(x1, y1, width, height);
	};

	// Draws a one-unit square on a canvas.
	const drawScaledSquare = (canvas: any, x: number, y: number, fillColor: string, borderColor: string | boolean): void =>
	{
		let scale = 1;

		if (canvas.dataset && canvas.dataset.scale)
		{
			scale = parseInt(canvas.dataset.scale, 10);
		}

		x *= scale;
		y *= scale;

		if (borderColor && canvas === paletteInterfaceExtended.current)
		{
			scale--;
		}

		if (fillColor)
		{
			canvas.getContext('2d').fillStyle = fillColor;
			canvas.getContext('2d').fillRect(x, y, scale, scale);
		}
		else
		{
			// clear that grid position of color, revealing the background color,
			// which makes it look like we're drawing transparent
			canvas.getContext('2d').clearRect(x, y, scale, scale);
		}

		if (borderColor)
		{
			canvas.getContext('2d').strokeStyle = borderColor;
			canvas.getContext('2d').strokeRect(x + 0.5, y + 0.5, scale, scale);
		}
	};

	// Works out the coordinate indicated on a canvas, relative to the canvas' scale.
	const getCursorPosition = (e: any, canvas: any): boolean | [number, number] =>
	{
		let x, y, scale = 1;

		// Works out the coordinates of a canvas relative to the page.
		let left, top;
		left = top = 0;

		if (canvas.offsetParent)
		{
			let parent = canvas;

			do
			{
				left += parent.offsetLeft;
				top += parent.offsetTop;
			}
			while (parent = parent.offsetParent);
		}

		const canvasOffset = [left, top];

		if (e.pageX !== undefined && e.pageY !== undefined)
		{
			x = e.pageX;
			y = e.pageY;
		}
		// it's IE
		else
		{
			x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}

		x -= canvasOffset[0];
		y -= canvasOffset[1];

		// now x and y are relative to top left corner of canvas
		if (x < 0 || y < 0 || x > canvas.width - 1 || y > canvas.height - 1)
		{
			return false;
		}

		// cancel if user clicked outside display
		if (typeof canvas.dataset.scale !== 'undefined')
		{
			scale = parseInt(canvas.dataset.scale, 10);
		}

		x /= scale;
		y /= scale;
		x = Math.floor(x);
		y = Math.floor(y);

		// account for scale
		return [x, y];
	};

	useEffect(() =>
	{
		if (!(didMount as any).colors)
		{
			(didMount as any).colors = true;
			return;
		}

		updatePaletteColor();
	}, [hue, vividness, brightness]);

	const changeHue = (e: any): void =>
	{
		let { value, min, max } = e.target;
		min = Number(min), max = Number(max);

		if (isNaN(value) || value < min || value > max)
		{
			setHue(value);

			return;
		}

		setHue(Math.max(min, Math.min(max, Number(value))));
	};

	const changeVividness = (e: any): void =>
	{
		let { value, min, max } = e.target;
		min = Number(min), max = Number(max);

		if (isNaN(value) || value < min || value > max)
		{
			setVividness(value);

			return;
		}

		setVividness(Math.max(min, Math.min(max, Number(value))));
	};

	const changeBrightness = (e: any): void =>
	{
		let { value, min, max } = e.target;
		min = Number(min), max = Number(max);

		if (isNaN(value) || value < min || value > max)
		{
			setBrightness(value);

			return;
		}

		setBrightness(Math.max(min, Math.min(max, Number(value))));
	};

	// called after updating hue, vividness or brightness
	const updatePaletteColor = (): void =>
	{
		// manually double-check hue, vividness, brightness
		if (hue < 1 || hue > 30 || vividness < 1 || vividness > 15 || brightness < 1 || brightness > 15)
		{
			return;
		}

		// update the palette to have new color
		let newPalette = [...palette];
		const newRgbIndex = (gameColorInfo as any)[currentGameId].findIndex((c: any) => c.hue === hue &&
			c.vividness === vividness &&
			c.brightness === brightness);
		newPalette[activePaletteId] = newRgbIndex;

		// update any colors in pattern that match old color
		let dataArray = [...formData];

		for (let x = 0; x < constants.pattern.paletteLength; x++)
		{
			for (let y = 0; y < constants.pattern.paletteLength; y++)
			{
				// if the old chosen palette color matches the pattern color
				if (colors[palette[activePaletteId]] === formData[x][y])
				{
					// update the pattern to have new color at that square
					dataArray[x][y] = (gameColorInfo as any)[currentGameId][newRgbIndex].hex;
				}
			}
		}

		setPalette(newPalette);
		setPosX1(0);
		setPosY1(0);
		setPosX2(constants.pattern.paletteLength - 1);
		setPosY2(constants.pattern.paletteLength - 1);
		setFormData(dataArray);
		setDataUrl(patternInterface.current.toDataURL());
	};

	const fillPatternColor = (rgb: string): void =>
	{
		if (!rgb)
		{
			if (currentGameId === constants.gameIds.ACNH)
			{
				rgb = String(constants.pattern.transparentColorId);
			}
			else
			{
				return;
			}
		}

		let dataArray = [...formData];

		for (let x = 0; x < constants.pattern.paletteLength; x++)
		{
			for (let y = 0; y < constants.pattern.paletteLength; y++)
			{
				dataArray[x][y] = rgb;
			}
		}

		setPosX1(0);
		setPosY1(0);
		setPosX2(constants.pattern.paletteLength - 1);
		setPosY2(constants.pattern.paletteLength - 1);
		setFormData(dataArray);
	};

	const resetPalette = (usePaletteId?: string): void =>
	{
		const newGamePaletteId = usePaletteId ?? gamePaletteId;
		const gameId = Number(newGamePaletteId.substring(0, newGamePaletteId.indexOf('-')));
		const paletteId = Number(newGamePaletteId.substring(newGamePaletteId.indexOf('-') + 1));

		// need to load new colors into palette boxes
		const gamePaletteColors = (gamePalettes as any)[gameId][paletteId - 1].colors;
		const newColors = gameColors[gameId];

		let newPalette: any = [];

		for (let key in palette)
		{
			newPalette[key] = newColors.indexOf(gamePaletteColors[Number(key)]);
		}

		// update pattern colors to new palette
		let dataArray = [...formData];

		for (let x = 0; x < constants.pattern.paletteLength; x++)
		{
			for (let y = 0; y < constants.pattern.paletteLength; y++)
			{
				// find old palette key
				let oldRgb = formData[x][y];

				if (Number(oldRgb) === constants.pattern.transparentColorId)
				{
					if (gameId !== constants.gameIds.ACNH)
					{
						// replace with 13th color of new palette, as if
						// transparent was NH starting background
						dataArray[x][y] = newColors[newPalette[12]];
					}

					continue;
				}

				let oldPaletteKey = palette.indexOf(colors.indexOf(oldRgb));

				// match to new palette key
				let newPaletteKey = newPalette[oldPaletteKey];

				// get that color
				dataArray[x][y] = newColors[newPaletteKey];
			}
		}

		// update hue / vividness / brightness if NH
		const color = (gameColorInfo as any)[gameId][palette[activePaletteId]];

		setGamePaletteId(newGamePaletteId);
		setColors(newColors);
		setHue(color ? color.hue : 0);
		setVividness(color ? color.vividness : 0);
		setBrightness(color ? color.brightness : 0);
		setActivePaletteId(activePaletteId === constants.pattern.numberOfColors && gameId !== constants.gameIds.ACNH ? 0 : activePaletteId);
		setPalette(newPalette);
		setFormData(dataArray);
		setCurrentGameId(gameId);
	};

	let palettes: any = [];

	for (let key in gamePalettes)
	{
		let game = acgames.find(g => g.id === Number(key));

		if (game)
		{
			(gamePalettes as any)[key].map((palette: any) =>
			{
				palettes.push({
					'id': key + '-' + palette.paletteId,
					'game': game.shortname,
					'name': 'Palette #' + palette.paletteId,
				});
			});
		}
	}

	const paletteId = Number(gamePaletteId.substring(gamePaletteId.indexOf('-') + 1));
	const curRgb = colors[palette[activePaletteId]];
	const defaultRgb = (gamePalettes as any)[currentGameId][paletteId - 1].colors[activePaletteId];
	const defaultColor = (gameColorInfo as any)[currentGameId].find((c: any) => c.hex === defaultRgb);

	return (
		<div className='PatternMaker'>
			<input type='hidden' name='data' value={formData.flat(2)} />
			<input type='hidden' name='dataUrl' value={dataUrl} />
			<input type='hidden' name='palette' value={palette} />

			<div className='PatternMaker_grid'>
				<canvas height='321' width='321' ref={patternInterface}
					data-scale='10' onMouseMove={(e) => editIfDrawing(e)}
					onMouseDown={() => setCurrentlyDrawing(true)}
					onMouseUp={() => stopDrawing()}
					onMouseOut={() => stopDrawing()}
					onClick={(e) => editPattern(e)}
					className='Pattern_transparent PatternMaker_canvas'
				/>

				<div className='PatternMaker_palette'>
					<h4 className='PatternMaker_paletteName'>
						Palette
					</h4>

					<div className='PatternMaker_paletteInterface'>
						<div className='PatternMaker_paletteAll'>
							<Select
								hideLabels
								label='Palette'
								name='gamePaletteId'
								options={palettes}
								optionsMapping={{ value: 'id', label: 'name' }}
								groupBy='game'
								value={gamePaletteId}
								changeHandler={(e: any) => resetPalette(String(e.target.value))}
								required
							/>

							<div className='PatternMaker_palettes' key={paletteColorsKey}>
								{[...Array(constants.pattern.numberOfColors).keys()].map(i =>
									<div key={`paletteInterface${i}`}
										onClick={() => changeDrawingColor(i)}
										className={i === activePaletteId ?
											`paletteInterface paletteInterface${i} selected` :
											`paletteInterface paletteInterface${i}`}
										style={{
											backgroundColor: paletteInterfaces[i].backgroundColor,
											border: paletteInterfaces[i].border,
										}}
									/>,
								)}
								<div
									onClick={() => changeDrawingColor(15)}
									className={15 === activePaletteId ?
										`Pattern_transparent paletteInterface paletteInterface15 selected` :
										`Pattern_transparent paletteInterface paletteInterface15 ${currentGameId !== constants.gameIds.ACNH ? ' hidden' : ''}`}
									style={{
										backgroundColor: paletteInterfaces[15].backgroundColor,
										border: paletteInterfaces[15].border,
									}}
								/>
							</div>
						</div>
					</div>

					<div className='PatternMaker_buttons'>
						<Button
							clickHandler={() => fillPatternColor(curRgb)}
							label='Fill With Selected Color'
						/>

						{[constants.gameIds.ACNL, constants.gameIds.ACNH].includes(currentGameId) &&
							<Button
								clickHandler={() => resetPalette()}
								label='Reset Palette'
							/>
						}
					</div>

					{[constants.gameIds.ACNL, constants.gameIds.ACNH].includes(currentGameId) &&
						<div className='PatternMaker_extended'>
							{currentGameId === constants.gameIds.ACNL &&
								<canvas height='256' width='226' ref={paletteInterfaceExtended}
									data-scale='15' onClick={(e) => changePaletteColor(e)}
									className='PatternMaker_nlInterface'
								/>
							}

							{currentGameId === constants.gameIds.ACNH && defaultColor &&
								<div className='PatternMaker_nhInterface'>
									<div className='PatternMaker_nhDefault'>
										<h3>Default:</h3>{defaultColor.hue} {defaultColor.vividness} {defaultColor.brightness}
									</div>

									<div className='PatternMaker_nhHVB'>
										<Form.Group>
											<Text
												label='Hue'
												name='hue'
												type='number'
												min={1}
												max={30}
												value={hue}
												changeHandler={(e) => changeHue(e)}
											/>
										</Form.Group>
										<Form.Group>
											<Text
												label='Vividness'
												name='vividness'
												type='number'
												min={1}
												max={15}
												value={vividness}
												changeHandler={(e) => changeVividness(e)}
											/>
										</Form.Group>
										<Form.Group>
											<Text
												label='Brightness'
												name='brightness'
												type='number'
												min={1}
												max={15}
												value={brightness}
												changeHandler={(e) => changeBrightness(e)}
											/>
										</Form.Group>
									</div>
								</div>
							}
						</div>
					}
				</div>
			</div>
		</div>
	);
};

type PatternMakerProps = {
	data: string[] | null
	initialDataUrl: string
	gameColors: PatternColorsType[number]
	gamePalettes: PatternPalettesType[number]
	gameColorInfo: PatternColorInfoType[number]
	acgames: ACGameType[]
	initialGameId: number
	initialPaletteId: number
};

export default PatternMaker;
