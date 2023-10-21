import React from 'react';
import PropTypes from 'prop-types';

import { utils, constants } from '@utils';
import { Select, Button, Text } from '@form';
import { acgameShape } from '@propTypes';
import { Form } from '@form';

class PatternMaker extends React.Component
{
	constructor(props)
	{
		super(props);

		const {data, dataUrl, gamePalettes, gameColors, gameId, paletteId,
			gameColorInfo} = this.props;

		this.editIfDrawing = this.editIfDrawing.bind(this);
		this.editPattern = this.editPattern.bind(this);
		this.stopDrawing = this.stopDrawing.bind(this);
		this.startDrawing = this.startDrawing.bind(this);
		this.changePaletteColor = this.changePaletteColor.bind(this);
		this.changeDrawingColor = this.changeDrawingColor.bind(this);
		this.drawPalette = this.drawPalette.bind(this);
		this.drawPaletteExtended = this.drawPaletteExtended.bind(this);
		this.drawPattern = this.drawPattern.bind(this);
		this.clearCanvas = this.clearCanvas.bind(this);
		this.drawScaledSquare = this.drawScaledSquare.bind(this);
		this.getCursorPosition = this.getCursorPosition.bind(this);
		this.getCanvasOffset = this.getCanvasOffset.bind(this);
		this.changePalette = this.changePalette.bind(this);
		this.changeHue = this.changeHue.bind(this);
		this.changeVividness = this.changeVividness.bind(this);
		this.changeBrightness = this.changeBrightness.bind(this);
		this.updatePaletteColor = this.updatePaletteColor.bind(this);
		this.fillPatternColor = this.fillPatternColor.bind(this);
		this.resetPalette = this.resetPalette.bind(this);

		// initialize 2D array used for storing colors used on canvas in X, Y positions
		let formData = [];

		for (let i = 0; i < constants.pattern.paletteLength; i++)
		{
			formData[i] = [];
		}

		let hue = 0, vividness = 0, brightness = 0;

		// if creating a new pattern, start with AC:NH
		const initialGameId = gameId ? gameId : constants.gameIds.ACNH;
		const initialPaletteId = paletteId ? paletteId : 1;
		let colors = gameColors[initialGameId], palette = [];

		// we need to load the colors in the same order as the palette used
		const gamePaletteColors = gamePalettes[initialGameId][initialPaletteId-1].colors;

		for (var key in gamePaletteColors)
		{
			palette[key] = colors.indexOf(gamePaletteColors[key]);
		}

		// if editing an existing pattern...
		if (data)
		{
			let includedColors = [];

			// convert 1D array to 2D for X Y positions
			// this actually goes column by column instead of row by row
			for (let i = 0; i < constants.pattern.length; i++)
			{
				let x = i % constants.pattern.paletteLength;
				let y = Math.floor(i / constants.pattern.paletteLength);

				let rgb = data[i];
				formData[y][x] = rgb;

				// while here build up list of unique colors
				if (!includedColors.includes(rgb))
				{
					includedColors.push(rgb);
				}
			}

			// for AC:NL & AC:NH, you can change out colors
			// change out any colors that aren't used for ones that are

			// what colors are in the pattern that isn't in the palette
			const incColors = includedColors.filter(x => !gamePaletteColors.includes(x) && Number(x) !== constants.pattern.transparentColorId);

			if (incColors.length > 0)
			{
				// colors in the palette not used in the pattern
				const palColors = gamePaletteColors.filter(x => !includedColors.includes(x));
				let i = 0;

				for (var key in palette)
				{
					// if this color is one not used
					if (palColors.includes(colors[palette[key]]))
					{
						// replace unused palette color with used pattern color
						palette[key] = colors.indexOf(incColors[i]);
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
					formData[x][y] = colors[palette[12]];
				}
			}
		}

		if (initialGameId === constants.gameIds.ACNH)
		{
			const firstColor = gameColorInfo[initialGameId]
				.find(c => c.hex === colors[palette[0]]);

			hue = firstColor.hue;
			vividness = firstColor.vividness;
			brightness = firstColor.brightness;
		}

		let paletteInterfaces = [];

		for (let i = 0; i <= constants.pattern.numberOfColors; i++)
		{
			paletteInterfaces[i] = {
				border: '',
				backgroundColor: '',
			}
		}

		this.state = {
			currentlyDrawing: false,
			palette: palette,
			activePaletteId: 0,
			paletteInterfaces: paletteInterfaces,
			dataUrl: dataUrl,
			formData: formData,
			colors: colors,
			gamePaletteId: initialGameId + '-' + initialPaletteId,
			hue: hue,
			vividness: vividness,
			brightness: brightness,
			gameId: initialGameId,
			paletteColorsKey: Math.random(),
		};
	}

	componentDidMount()
	{
		for (let i = 0; i <= constants.pattern.numberOfColors; i++)
		{
			this.drawPalette(i);
		}

		this.drawPaletteExtended();
		this.drawPattern(true, 0, 0, constants.pattern.paletteLength-1, constants.pattern.paletteLength-1);
	}

	editIfDrawing(e)
	{
		const {currentlyDrawing} = this.state;

		if (currentlyDrawing)
		{
			this.editPattern(e);
		}
	}

	// Changes the color of the 'pixel' indicated.
	editPattern(e)
	{
		const {colors, palette, activePaletteId} = this.state;

		const pos = this.getCursorPosition(e, this.refs.patternInterface);

		if (!pos)
		{
			return false;
		}

		const posx = pos[0], posy = pos[1];

		if (posx >= constants.pattern.paletteLength || posy >= constants.pattern.paletteLength)
		{
			return false;
		}

		let dataArray = [...this.state.formData];

		if (activePaletteId === constants.pattern.numberOfColors)
		{
			dataArray[posx][posy] = constants.pattern.transparentColorId;
		}
		else
		{
			dataArray[posx][posy] = colors[palette[activePaletteId]];
		}

		this.setState({
			formData: dataArray,
		}, () => {
			this.drawPattern(true, posx, posy, posx, posy);
		});
	}

	stopDrawing()
	{
		// clear the canvas of grid to save prettified pattern
		this.clearCanvas(this.refs.patternInterface, 0, 0, constants.pattern.paletteLength, constants.pattern.paletteLength);
		this.drawPattern(false, 0, 0, constants.pattern.paletteLength-1, constants.pattern.paletteLength-1);

		this.setState({
			currentlyDrawing: false,
			dataUrl: this.refs.patternInterface.toDataURL(),
		}, () => {
			this.drawPattern(true, 0, 0, constants.pattern.paletteLength-1, constants.pattern.paletteLength-1);
		});
	}

	startDrawing()
	{
		this.setState({
			currentlyDrawing: true,
		});
	}

	// Changes the active palette color's slot in the palette to the one clicked on.
	changePaletteColor(e)
	{
		const {activePaletteId, formData, palette, colors} = this.state;

		const pos = this.getCursorPosition(e, this.refs.paletteInterfaceExtended);

		if (!pos)
		{
			return false;
		}

		const posx = pos[0], posy = pos[1];

		if ((posx >= 16) || (posy >= 18) || (posy % 4 === 3) || ((posx % 4 === 3) && (posy < 16)))
		{
			return false;
		}

		// if clicked on whitespace, cancel action
		let groupx = Math.floor(posx / 4), groupy = Math.floor(posy / 4);
		let colorId;

		// hued color
		if (groupy < 4)
		{
			const ingroupx = posx % 4, ingroupy = posy % 4;
			const group = (groupx + (groupy * 4));
			const ingroup = (ingroupx + (ingroupy * 3));

			colorId = (ingroup + (group * 9));
		}
		// greyscale
		else
		{
			colorId = ((16 * 9) + posx);
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

		this.setState({
			palette: array,
			formData: dataArray,
		}, () => {
			this.drawPalette(activePaletteId);
			this.drawPaletteExtended();
			this.drawPattern(true, 0, 0, constants.pattern.paletteLength-1, constants.pattern.paletteLength-1);
		});
	}

	// Changes the active palette color to the one clicked on.
	changeDrawingColor(index)
	{
		const {gameColorInfo} = this.props;
		const {activePaletteId, palette, gameId} = this.state;

		const oldColorIndex = activePaletteId;

		if (index === oldColorIndex)
		{
			return;
		}

		const color = gameColorInfo[gameId][palette[index]];

		this.setState({
			activePaletteId: index,
			hue: color ? color.hue : 0,
			vividness: color ? color.vividness : 0,
			brightness: color ? color.brightness : 0
		}, () => {
			this.drawPalette(oldColorIndex);
			this.drawPalette(index);
			this.drawPaletteExtended();
		});
	}

	// Draws one of the colors of the palette on the appropriate canvas.
	drawPalette(index)
	{
		const {colors, palette, paletteInterfaces} = this.state;

		// we don't need to fill in palette color if it's the transparent palette
		if (index === constants.pattern.numberOfColors)
		{
			paletteInterfaces[index].border = '1px solid #7E7B7B';

			return;
		}

		let rgb = colors[palette[index]];

		paletteInterfaces[index].backgroundColor = rgb;

		// if the fill color is white, we won't be able to see the palette color otherwise
		if (utils.isColorLight(rgb))
		{
			rgb = '#7E7B7B';
		}

		paletteInterfaces[index].border = '1px solid ' + rgb;

		this.setState({
			paletteColorsKey: Math.random(),
		});
	}

	// Draws the extended palette on a canvas.
	drawPaletteExtended()
	{
		const {colors, palette, activePaletteId, gameId} = this.state;

		// this is only for NL
		if (gameId !== constants.gameIds.ACNL)
		{
			return;
		}

		const canvas = this.refs.paletteInterfaceExtended;

		this.clearCanvas(canvas, 0, 0, constants.pattern.paletteLength-1, constants.pattern.paletteLength-1);

		// i = color ID
		for (let i = 0; i < 159; i++)
		{
			// which of the ~9-color groups?
			const group = Math.floor(i/9);

			// where in that group?
			const posingroup = i % 9;
			let x, y;

			// in one of the 16 hued groups
			if (group < 16)
			{
				x = ((group % 4) * 4) + (posingroup % 3);
				y = (group - (group % 4)) + Math.floor(posingroup / 3);
			}
			// on the greyscale
			else
			{
				x = i - (16 * 9);
				y = 16;
			}

			if (palette[activePaletteId] === i)
			{
				this.drawScaledSquare(canvas, x, y, colors[i], "#000");
			}
			else
			{
				this.drawScaledSquare(canvas, x, y, colors[i], false);
			}
		}
	}

	// Draws the pattern on a canvas.
	drawPattern(drawGrid, x1, y1, x2, y2)
	{
		const {formData} = this.state;

		const canvas = this.refs.patternInterface;

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
					this.drawScaledSquare(canvas, x, y, rgb, "#888");
				}
				else
				{
					this.drawScaledSquare(canvas, x, y, rgb, false);
				}
			}
		}
	}

	// Clears the contents of a canvas.
	clearCanvas(canvas, x1, y1, x2, y2)
	{
		const scale = canvas.dataset.scale;

		x1 *= scale;
		y1 *= scale;
		x2 *= scale;
		y2 *= scale;

		const height = y2 - y1 + 1;
		const width = x2 - x1 + 1;

		canvas.getContext('2d').clearRect(x1, y1, width, height);
	}

	// Draws a one-unit square on a canvas.
	drawScaledSquare(canvas, x, y, fillColor, borderColor)
	{
		let scale = 1;

		if (canvas.dataset.scale)
		{
			scale = parseInt(canvas.dataset.scale, 10);
		}

		x *= scale;
		y *= scale;

		if (borderColor && canvas === this.refs.paletteInterfaceExtended)
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
			canvas.getContext('2d').strokeRect(x+0.5, y+0.5, scale, scale);
		}
	}

	// Works out the coordinate indicated on a canvas, relative to the canvas' scale.
	getCursorPosition(e, canvas)
	{
		let x, y, scale = 1;
		const canvasOffset = this.getCanvasOffset(canvas);

		if ((e.pageX != undefined) && (e.pageY != undefined))
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
		if ((x < 0) || (y < 0) || (x > canvas.width-1) || (y > canvas.height-1))
		{
			return false;
		}

		// cancel if user clicked outside display
		if (typeof(canvas.dataset.scale) !== 'undefined')
		{
			scale = parseInt(canvas.dataset.scale, 10);
		}

		x /= scale;
		y /= scale;
		x = Math.floor(x);
		y = Math.floor(y);

		// account for scale
		return [x, y];
	}

	// Works out the coordinates of a canvas relative to the page.
	getCanvasOffset(element)
	{
		let left, top;
		left = top = 0;

		if (element.offsetParent)
		{
			do
			{
				left += element.offsetLeft;
				top  += element.offsetTop;
			}
			while (element = element.offsetParent);
		}

		return [left, top];
	}

	changePalette(e)
	{
		this.resetPalette(String(e.target.value));
	}

	changeHue(e)
	{
		let {value, min, max} = e.target;
		min = Number(min), max = Number(max);

		if (isNaN(value) || value < min || value > max)
		{
			this.setState({
				hue: value,
			});

			return;
		}

		this.setState({
			hue: Math.max(min, Math.min(max, Number(value))),
		}, () => {
			this.updatePaletteColor();
		});
	}

	changeVividness(e)
	{
		let {value, min, max} = e.target;
		min = Number(min), max = Number(max);

		if (isNaN(value) || value < min || value > max)
		{
			this.setState({
				vividness: value,
			});

			return;
		}

		this.setState({
			vividness: Math.max(min, Math.min(max, Number(value))),
		}, () => {
			this.updatePaletteColor();
		});
	}

	changeBrightness(e)
	{
		let {value, min, max} = e.target;
		min = Number(min), max = Number(max);

		if (isNaN(value) || value < min || value > max)
		{
			this.setState({
				brightness: value,
			});

			return;
		}

		this.setState({
			brightness: Math.max(min, Math.min(max, Number(value))),
		}, () => {
			this.updatePaletteColor();
		});
	}

	// called after updating hue, vividness or brightness
	updatePaletteColor()
	{
		const {gameColorInfo} = this.props;
		const {gameId, hue, vividness, brightness, activePaletteId, formData,
			palette, colors} = this.state;

		// manually double-check hue, vividness, brightness
		if (hue < 1 || hue > 30 || vividness < 1 || vividness > 15 || brightness < 1 || brightness > 15)
		{
			return;
		}

		// update the palette to have new color
		let newPalette = [...palette];
		const newRgbIndex = gameColorInfo[gameId].findIndex(c => c.hue === hue &&
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
					dataArray[x][y] = gameColorInfo[gameId][newRgbIndex].hex;
				}
			}
		}

		this.setState({
			palette: newPalette,
			formData: dataArray,
			dataUrl: this.refs.patternInterface.toDataURL(),
		}, () => {
			this.drawPalette(activePaletteId);
			this.drawPattern(true, 0, 0, constants.pattern.paletteLength-1, constants.pattern.paletteLength-1);
		});
	}

	fillPatternColor(rgb)
	{
		const {gameId} = this.state;

		if (!rgb)
		{
			if (gameId === constants.gameIds.ACNH)
			{
				rgb = constants.pattern.transparentColorId;
			}
			else
			{
				return;
			}
		}

		let dataArray = [...this.state.formData];

		for (let x = 0; x < constants.pattern.paletteLength; x++)
		{
			for (let y = 0; y < constants.pattern.paletteLength; y++)
			{
				dataArray[x][y] = rgb;
			}
		}

		this.setState({
			formData: dataArray,
		}, () => {
			this.drawPattern(true, 0, 0, constants.pattern.paletteLength-1, constants.pattern.paletteLength-1);
		});
	}

	resetPalette(usePaletteId)
	{
		const {gameColors, gamePalettes, gameColorInfo} = this.props;
		const {colors, palette, formData, activePaletteId} = this.state;

		const newGamePaletteId = usePaletteId ? usePaletteId : this.state.gamePaletteId;
		const gameId = Number(newGamePaletteId.substr(0, newGamePaletteId.indexOf('-')));
		const paletteId = Number(newGamePaletteId.substr(newGamePaletteId.indexOf('-')+1));

		// need to load new colors into palette boxes
		const gamePaletteColors = gamePalettes[gameId][paletteId-1].colors;
		const newColors = gameColors[gameId];

		let newPalette = [];

		for (var key in palette)
		{
			newPalette[key] = newColors.indexOf(gamePaletteColors[key]);
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
		const color = gameColorInfo[gameId][palette[activePaletteId]];

		this.setState({
			gamePaletteId: newGamePaletteId,
			colors: newColors,
			palette: newPalette,
			gameId: gameId,
			formData: dataArray,
			hue: color ? color.hue : 0,
			vividness: color ? color.vividness : 0,
			brightness: color ? color.brightness : 0,
			activePaletteId: activePaletteId === constants.pattern.numberOfColors && gameId !== constants.gameIds.ACNH ? 0 : activePaletteId
		}, () => {
			for (let i = 0; i <= constants.pattern.numberOfColors; i++)
			{
				this.drawPalette(i);
			}

			this.drawPaletteExtended();
			this.drawPattern(true, 0, 0, constants.pattern.paletteLength-1, constants.pattern.paletteLength-1);
		});
	}

	render()
	{
		const {gamePalettes, acgames, gameColorInfo} = this.props;
		const {formData, dataUrl, gamePaletteId, hue, vividness, brightness,
			gameId, activePaletteId, paletteInterfaces, palette, paletteColorsKey,
			colors} = this.state;

		let palettes = [];

		for (var key in gamePalettes)
		{
			let game = acgames.find(g => g.id === Number(key));

			gamePalettes[key].map(palette => {
				palettes.push({
					'id': key + '-' + palette.paletteId,
					'game': game.shortname,
					'name': 'Palette #' + palette.paletteId
				});
			});
		}

		const paletteId = Number(gamePaletteId.substr(gamePaletteId.indexOf('-')+1));
		const curRgb = colors[palette[activePaletteId]];
		const defaultRgb = gamePalettes[gameId][paletteId-1].colors[activePaletteId];
		const defaultColor = gameColorInfo[gameId].find(c => c.hex === defaultRgb);

		return (
			<div className='PatternMaker'>
				<input type='hidden' name='data' value={formData.flat(2)} />
				<input type='hidden' name='dataUrl' value={dataUrl} />
				<input type='hidden' name='palette' value={palette} />

				<div className='PatternMaker_grid'>
					<canvas height='321' width='321' ref='patternInterface'
						data-scale='10' onMouseMove={this.editIfDrawing}
						onMouseDown={() => this.startDrawing()}
						onMouseUp={() => this.stopDrawing()}
						onMouseOut={() => this.stopDrawing()}
						onClick={this.editPattern}
						className='Pattern_transparent PatternMaker_canvas'
					/>

					<div className='PatternMaker_palette'>
						<h4 className='PatternMaker_paletteName'>
							Palette
						</h4>

						<div className='PatternMaker_paletteInterface'>
							<div className='PatternMaker_paletteAll'>
								<Select
									hideLabel
									label='Palette'
									name='gamePaletteId'
									options={palettes}
									optionsMapping={{value: 'id', label: 'name'}}
									groupBy='game'
									value={gamePaletteId}
									changeHandler={this.changePalette}
									required
								/>

								<div className='PatternMaker_palettes' key={paletteColorsKey}>
									{[...Array(constants.pattern.numberOfColors).keys()].map(i =>
										<div key={`paletteInterface${i}`}
											onClick={() => this.changeDrawingColor(i)}
											className={i === activePaletteId ?
												`paletteInterface paletteInterface${i} selected` :
												`paletteInterface paletteInterface${i}`}
											style={{backgroundColor: paletteInterfaces[i].backgroundColor,
												border: paletteInterfaces[i].border}}
										/>
									)}
									<div
										onClick={() => this.changeDrawingColor(15)}
										className={15 === activePaletteId ?
											`Pattern_transparent paletteInterface paletteInterface15 selected` :
											`Pattern_transparent paletteInterface paletteInterface15 ${(gameId !== constants.gameIds.ACNH ? ' hidden' : '')}`}
										style={{backgroundColor: paletteInterfaces[15].backgroundColor,
											border: paletteInterfaces[15].border}}
									/>
								</div>
							</div>
						</div>

						<div className='PatternMaker_buttons'>
							<Button
								clickHandler={() => this.fillPatternColor(curRgb)}
								label='Fill With Selected Color'
							/>

							{[constants.gameIds.ACNL, constants.gameIds.ACNH].includes(gameId) && (
								<Button
									clickHandler={() => this.resetPalette()}
									label='Reset Palette'
								/>
							)}
						</div>

						{[constants.gameIds.ACNL, constants.gameIds.ACNH].includes(gameId) && (
							<div className='PatternMaker_extended'>
								{gameId === constants.gameIds.ACNL && (
									<canvas height='256' width='226' ref='paletteInterfaceExtended'
										data-scale='15' onClick={this.changePaletteColor}
										className='PatternMaker_nlInterface'
									/>
								)}

								{gameId === constants.gameIds.ACNH && defaultColor && (
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
													changeHandler={this.changeHue}
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
													changeHandler={this.changeVividness}
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
													changeHandler={this.changeBrightness}
												/>
											</Form.Group>
										</div>
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			</div>
		);
	}
}

PatternMaker.propTypes = {
	data: PropTypes.arrayOf(PropTypes.string),
	dataUrl: PropTypes.string,
	gameColors: PropTypes.shape({
		'1': PropTypes.arrayOf(PropTypes.string),
		'2': PropTypes.arrayOf(PropTypes.string),
		'3': PropTypes.arrayOf(PropTypes.string),
		'4': PropTypes.arrayOf(PropTypes.string),
		'8': PropTypes.arrayOf(PropTypes.string),
	}),
	gamePalettes: PropTypes.shape({
		'1': PropTypes.arrayOf(PropTypes.shape({
			paletteId: PropTypes.number,
			colors: PropTypes.arrayOf(PropTypes.string),
		})),
		'2': PropTypes.arrayOf(PropTypes.shape({
			paletteId: PropTypes.number,
			colors: PropTypes.arrayOf(PropTypes.string),
		})),
		'3': PropTypes.arrayOf(PropTypes.shape({
			paletteId: PropTypes.number,
			colors: PropTypes.arrayOf(PropTypes.string),
		})),
		'4': PropTypes.arrayOf(PropTypes.shape({
			paletteId: PropTypes.number,
			colors: PropTypes.arrayOf(PropTypes.string),
		})),
		'8': PropTypes.arrayOf(PropTypes.shape({
			paletteId: PropTypes.number,
			colors: PropTypes.arrayOf(PropTypes.string),
		})),
	}),
	gameColorInfo: PropTypes.shape({
		'1': PropTypes.array,
		'2': PropTypes.array,
		'3': PropTypes.array,
		'4': PropTypes.array,
		'8': PropTypes.arrayOf(PropTypes.shape({
			hex: PropTypes.string,
			hue: PropTypes.number,
			vividness: PropTypes.number,
			brightness: PropTypes.number,
		})),
	}),
	acgames: PropTypes.arrayOf(acgameShape),
	gameId: PropTypes.number,
	paletteId: PropTypes.number,
};

export default PatternMaker;
