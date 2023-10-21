import React from 'react';
import PropTypes from 'prop-types';

import { utils, constants } from '@utils';
import { Form, Check, Button } from '@form';

class MapDesigner extends React.Component
{
	constructor(props)
	{
		super(props);

		const {data, dataUrl, colors, width, height, cursorData, flipData, imageData} = this.props;

		this.editIfDrawing = this.editIfDrawing.bind(this);
		this.editMap = this.editMap.bind(this);
		this.stopDrawing = this.stopDrawing.bind(this);
		this.startDrawing = this.startDrawing.bind(this);
		this.changeDrawingColor = this.changeDrawingColor.bind(this);
		this.drawPalette = this.drawPalette.bind(this);
		this.drawMap = this.drawMap.bind(this);
		this.clearCanvas = this.clearCanvas.bind(this);
		this.drawScaledSquare = this.drawScaledSquare.bind(this);
		this.getCursorPosition = this.getCursorPosition.bind(this);
		this.getCanvasOffset = this.getCanvasOffset.bind(this);
		this.changeCursor = this.changeCursor.bind(this);
		this.drawImage = this.drawImage.bind(this);
		this.drawImages = this.drawImages.bind(this);
		this.changeImage = this.changeImage.bind(this);
		this.addImage = this.addImage.bind(this);
		this.deleteAllImage = this.deleteAllImage.bind(this);
		this.drawLine = this.drawLine.bind(this);
		this.getImage = this.getImage.bind(this);

		// initialize 2D array used for storing colors used on canvas in X, Y positions
		let formData = [], cursorFormData = [], flipFormData = [], imageFormData = [];

		for (let i = 0; i < width; i++)
		{
			formData[i] = [];
			cursorFormData[i] = [];
			flipFormData[i] = [];
			imageFormData[i] = [];
		}

		const stateColors = Object.values(colors);

		if (data.length > 0)
		{
			// convert 1D array to 2D for X Y positions
			// this actually goes column by column instead of row by row
			for (let i = 0; i < data.length; i++)
			{
				let x = i % height;
				let y = Math.floor(i / height);

				formData[y][x] = data[i];
				cursorFormData[y][x] = cursorData[i];
				flipFormData[y][x] = flipData[i];
				imageFormData[y][x] = imageData[i];
			}
		}
		else
		{
			// default is water everywhere
			for (let x = 0; x < width; x++)
			{
				for (let y = 0; y < height; y++)
				{
					formData[x][y] = stateColors[3];
					cursorFormData[x][y] = 'rect';
					flipFormData[x][y] = formData[x][y];
					imageFormData[x][y] = constants.town.noImageId;
				}
			}
		}

		let paletteInterfaces = [];

		for (let i = 0; i <= constants.town.numberOfColors; i++)
		{
			paletteInterfaces[i] = {
				border: '',
				backgroundColor: '',
			}
		}

		this.state = {
			currentlyDrawing: false,
			palette: [...Array(constants.town.numberOfColors).keys()],
			activePaletteId: 0,
			paletteInterfaces: paletteInterfaces,
			dataUrl: dataUrl,
			formData: formData,
			colors: stateColors,
			cursor: 'rect',
			cursorFormData: cursorFormData,
			flipFormData: flipFormData,
			imageFormData: imageFormData,
			currentlyDragging: false,
			draggingImageX: null,
			draggingImageY: null,
			scale: 1,
			curImageName: 'airport',
		};
	}

	componentDidMount()
	{
		const {width, height, data} = this.props;
		const {imageFormData} = this.state;

		let imageArray = [...imageFormData];

		// change out image name for Image class
		if (data.length > 0)
		{
			for (let x = 0; x < imageFormData.length; x++)
			{
				for (let y = 0; y < imageFormData[x].length; y++)
				{
					let imageName = imageFormData[x][y];

					if (imageName !== constants.town.noImageId)
					{
						imageArray[x][y] = this.getImage(imageName);
					}
				}
			}
		}

		const canvas = this.refs.mapInterface;
		let scale = 1;

		if (canvas.dataset.scale)
		{
			scale = parseInt(canvas.dataset.scale, 10);
		}

		for (let i = 0; i < constants.town.numberOfColors; i++)
		{
			this.drawPalette(i);
		}

		this.setState({
			imageFormData: imageArray,
			scale: scale,
		}, () => {
			this.drawMap(true, 0, 0, width-1, height-1);

			// load the image on canvas
			// we always drawImages AFTER drawMap
			if (data.length > 0)
			{
				for (let x = 0; x < imageArray.length; x++)
				{
					for (let y = 0; y < imageArray[x].length; y++)
					{
						let image = imageArray[x][y];

						if (image !== constants.town.noImageId)
						{
							image.onload = () => {
								this.drawImage(image, image.x, image.y);
							}
						}
					}
				}
			}
		});
	}

	// figure out what is needed when adding image to array
	getImage(imageName)
	{
		const {images} = this.props;

		let image = new Image();
		image.src = '/images/maps/acnh/' + imageName + '.png';

		const imageInfo = images[imageName];

		image.data = {
			width: imageInfo.width ? imageInfo.width : image.width,
			height: imageInfo.height ? imageInfo.height : image.height,
		};

		return image;
	}

	editIfDrawing(e)
	{
		const {currentlyDrawing, currentlyDragging} = this.state;

		if (currentlyDrawing || currentlyDragging)
		{
			this.editMap(e);
		}
	}

	// Changes the color of the 'pixel' indicated.
	editMap(e)
	{
		const {width, height} = this.props;
		const {colors, palette, activePaletteId, cursor, formData,
			draggingImageX, draggingImageY, currentlyDragging, scale, cursorFormData} = this.state;

		const pos = this.getCursorPosition(e, this.refs.mapInterface);

		if (!pos)
		{
			return false;
		}

		const posx = pos[0], posy = pos[1];

		if (posx >= width || posy >= height)
		{
			return false;
		}

		// are we moving an image?
		if (currentlyDragging)
		{
			// otherwise we end up setting that position in the array to nothing
			// losing the ability to move the image on the canvas
			if (posx === draggingImageX && posy === draggingImageY)
			{
				return;
			}

			// move the image from the old to the new position
			let imageArray = [...this.state.imageFormData];
			imageArray[posx][posy] = imageArray[draggingImageX][draggingImageY];
			imageArray[draggingImageX][draggingImageY] = constants.town.noImageId;

			this.setState({
				imageFormData: imageArray,
				draggingImageX: posx,
				draggingImageY: posy,
			}, () => {
				// best to just update the places where the image was and where it will be
				const image = imageArray[posx][posy];
				const imageWidth = draggingImageX + Math.ceil(image.data.width / scale);
				const imageHeight = draggingImageY + Math.ceil(image.data.height / scale);

				this.drawMap(true, draggingImageX, draggingImageY, imageWidth, imageHeight);
				this.drawImage(image, posx, posy);
			});
		}
		else
		{
			// for drawing curved lines, otherwise if the user stays at that square
			// it just colors in whole square
			if (formData[posx][posy] === colors[palette[activePaletteId]] &&
				cursorFormData[posx][posy] === cursor)
			{
				return;
			}

			// we set the 'other side' of the square to whatever color is there
			let flipArray = [...this.state.flipFormData];
			flipArray[posx][posy] = formData[posx][posy];

			let dataArray = [...formData];
			dataArray[posx][posy] = colors[palette[activePaletteId]];

			let cursorArray = [...cursorFormData];
			cursorArray[posx][posy] = cursor;

			this.setState({
				formData: dataArray,
				cursorFormData: cursorArray,
				flipFormData: flipArray,
			}, () => {
				this.drawMap(true, posx, posy, posx, posy);
			});
		}
	}

	stopDrawing()
	{
		const {width, height} = this.props;

		// clear the canvas of grid to save prettified map
		const canvas = this.refs.mapInterface;
		this.clearCanvas(canvas, 0, 0, width, height);
		this.drawMap(false, 0, 0, width-1, height-1);
		this.drawImages(0, 0, width-1, height-1);

		this.setState({
			currentlyDrawing: false,
			currentlyDragging: false,
			draggingImageX: null,
			draggingImageY: null,
			dataUrl: canvas.toDataURL(),
		}, () => {
			this.drawMap(true, 0, 0, width-1, height-1);
			this.drawImages(0, 0, width-1, height-1);
		});
	}

	startDrawing(e)
	{
		// are we moving an image?
		const {width, height} = this.props;
		const {imageFormData, scale} = this.state;

		const pos = this.getCursorPosition(e, this.refs.mapInterface);

		if (!pos)
		{
			return;
		}

		const posx = pos[0], posy = pos[1];

		if (posx >= width || posy >= height)
		{
			return;
		}

		// we need to determine when we start drawing whether we're moving an
		// image or coloring. We don't want to do both.
		let draggingImageX = null, draggingImageY = null;

		outer: for (let x = 0; x < imageFormData.length; x++)
		{
			for (let y = 0; y < imageFormData[x].length; y++)
			{
				let image = imageFormData[x][y];

				if (image !== constants.town.noImageId)
				{
					// detect whether the mouse is inside the image boundaries
					if (posx >= x &&
						posx <= (x + Math.floor(image.data.width / scale)) &&
						posy >= y &&
						posy <= (y + Math.floor(image.data.height / scale)))
					{
						draggingImageX = x;
						draggingImageY = y;

						break outer;
					}
				}
			}
		}

		if (draggingImageX)
		{
			this.setState({
				currentlyDragging: true,
				draggingImageX: draggingImageX,
				draggingImageY: draggingImageY,
			});
		}
		else
		{
			this.setState({
				currentlyDrawing: true,
			});
		}
	}

	// Changes the active palette color to the one clicked on.
	changeDrawingColor(index)
	{
		const {activePaletteId} = this.state;

		const oldColorIndex = activePaletteId;

		if (index === oldColorIndex)
		{
			return;
		}

		this.setState({
			activePaletteId: index,
		}, () => {
			this.drawPalette(oldColorIndex);
			this.drawPalette(index);
		});
	}

	// Draws one of the colors of the palette on the appropriate canvas.
	drawPalette(index)
	{
		const {colors, palette, paletteInterfaces} = this.state;

		let rgb = colors[palette[index]];

		paletteInterfaces[index].backgroundColor = rgb;

		// if the fill color is white, we won't be able to see the palette color otherwise
		if (utils.isColorLight(rgb))
		{
			rgb = '#7E7B7B';
		}

		paletteInterfaces[index].border = '1px solid ' + rgb;
	}

	// Draws the map on the canvas
	drawMap(drawGrid, x1, y1, x2, y2)
	{
		const {formData, cursorFormData, flipFormData} = this.state;

		const canvas = this.refs.mapInterface;

		const rectTypes = constants.town.rectTypes;

		for (let x = x1; x <= x2; x++)
		{
			for (let y = y1; y <= y2; y++)
			{
				const rgb = formData[x][y];
				const pos = cursorFormData[x][y];
				const flipRgb = flipFormData[x][y];

				if (drawGrid)
				{
					// for curved lines, we first draw the triangle (pos), then
					// draw the triangle for the opposite side
					this.drawScaledSquare(canvas, x, y, rgb, '#888', pos);

					if (pos === rectTypes[2].value) // top-right
					{
						this.drawScaledSquare(canvas, x, y, flipRgb, '#888', rectTypes[3].value);
					}
					else if (pos === rectTypes[4].value) // bottom-right
					{
						this.drawScaledSquare(canvas, x, y, flipRgb, '#888', rectTypes[5].value);
					}
					else if (pos === rectTypes[3].value) // bottom-left
					{
						this.drawScaledSquare(canvas, x, y, flipRgb, '#888', rectTypes[2].value);
					}
					else if (pos === rectTypes[5].value) // top-left
					{
						this.drawScaledSquare(canvas, x, y, flipRgb, '#888', rectTypes[4].value);
					}

					// for the grid, so it's easier to manually copy
					this.drawLine(canvas, x, y);
				}
				else
				{
					this.drawScaledSquare(canvas, x, y, rgb, false, pos);

					if (pos === rectTypes[2].value) // top-right
					{
						this.drawScaledSquare(canvas, x, y, flipRgb, false, rectTypes[3].value);
					}
					else if (pos === rectTypes[4].value) // bottom-right
					{
						this.drawScaledSquare(canvas, x, y, flipRgb, false, rectTypes[5].value);
					}
					else if (pos === rectTypes[3].value) // bottom-left
					{
						this.drawScaledSquare(canvas, x, y, flipRgb, false, rectTypes[2].value);
					}
					else if (pos === rectTypes[5].value) // top-left
					{
						this.drawScaledSquare(canvas, x, y, flipRgb, false, rectTypes[4].value);
					}
				}
			}
		}
	}

	// Clears the contents of a canvas.
	clearCanvas(canvas, x1, y1, x2, y2)
	{
		const {scale} = this.state;

		x1 *= scale;
		y1 *= scale;
		x2 *= scale;
		y2 *= scale;

		const height = y2 - y1 + 1;
		const width = x2 - x1 + 1;

		canvas.getContext('2d').clearRect(x1, y1, width, height);
	}

	// draw a line at x, y position along the grid
	drawLine(canvas, x, y)
	{
		const {width, height, gridLength} = this.props;
		const {scale} = this.state;

		const xCalc = x+1;
		const yCalc = y+1;
		const xPos = x*scale;
		const yPos = y*scale;
		const color = '#ff0000';
		const lineWidth = 1.2;

		const context = canvas.getContext('2d');

		if (xCalc % gridLength === 0 && xCalc !== width)
		{
			context.beginPath();
			context.moveTo(xPos+scale, yPos);
			context.lineTo(xPos+scale, yPos+scale);
			context.lineWidth = lineWidth;
			context.strokeStyle = color;
			context.stroke();
		}

		if (yCalc % gridLength === 0 && yCalc !== height)
		{
			context.beginPath();
			context.moveTo(xPos+scale, yPos+scale);
			context.lineTo(xPos, yPos+scale);
			context.lineWidth = lineWidth;
			context.strokeStyle = color;
			context.stroke();
		}
	}

	// Draws a one-unit square on a canvas.
	drawScaledSquare(canvas, x, y, fillColor, borderColor, fillType)
	{
		const {scale} = this.state;

		x *= scale;
		y *= scale;

		const context = canvas.getContext('2d');

		if (fillColor)
		{
			context.fillStyle = fillColor;

			if (fillType === 'rect')
			{
				context.fillRect(x, y, scale, scale);
			}
			else
			{
				context.beginPath();

				const rectTypes = constants.town.rectTypes;

				// drawing a triangle is how you draw a curved line
				if (fillType === rectTypes[2].value) // top-right
				{
					context.moveTo(x, y);
					context.lineTo(x+scale, y);
					context.lineTo(x+scale, y+scale);
				}
				else if (fillType === rectTypes[4].value) // bottom-right
				{
					context.moveTo(x+scale, y);
					context.lineTo(x+scale, y+scale);
					context.lineTo(x, y+scale);
				}
				else if (fillType === rectTypes[3].value) // bottom-left
				{
					context.moveTo(x, y);
					context.lineTo(x, y+scale);
					context.lineTo(x+scale, y+scale);
				}
				else if (fillType === rectTypes[5].value) // top-left
				{
					context.moveTo(x, y);
					context.lineTo(x+scale, y);
					context.lineTo(x, y+scale);
				}

				context.closePath();
				context.fill();
			}
		}

		if (borderColor)
		{
			context.strokeStyle = borderColor;
			context.strokeRect(x+0.5, y+0.5, scale, scale);
		}
	}

	// Works out the coordinate indicated on a canvas, relative to the canvas' scale.
	getCursorPosition(e, canvas)
	{
		const {scale} = this.state;

		let x, y;
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

	// change how we're filling in the square
	changeCursor(e)
	{
		this.setState({
			cursor: String(e.target.value),
		});
	}

	// draw that image on the canvas at x, y
	drawImage(image, x, y)
	{
		const {scale} = this.state;

		const canvas = this.refs.mapInterface;

		let xPos = x*scale;
		let yPos = y*scale;

		canvas.getContext('2d').drawImage(image, xPos, yPos, image.data.width, image.data.height);
	}

	// re-draw images between positions
	drawImages(x1, y1, x2, y2)
	{
		const {imageFormData} = this.state;

		for (let x = x1; x <= x2; x++)
		{
			for (let y = y1; y <= y2; y++)
			{
				let image = imageFormData[x][y];

				if (image !== constants.town.noImageId)
				{
					this.drawImage(image, x, y);
				}
			}
		}
	}

	// change what image is selected to add to canvas
	changeImage(e)
	{
		this.setState({
			curImageName: String(e.target.value),
		});
	}

	// add an image to the canvas
	addImage()
	{
		const {curImageName} = this.state;

		const x = 1;
		const y = 1;

		const image = this.getImage(curImageName);
		let imageArray = [...this.state.imageFormData];
		imageArray[x][y] = image;

		this.setState({
			imageFormData: imageArray,
		}, () => {
			image.onload = () => {
				this.drawImage(image, image.x, image.y);
			}
		});
	}

	// delete all images of that type from the canvas
	deleteAllImage()
	{
		const {width, height} = this.props;
		const {curImageName, imageFormData} = this.state;

		let imageArray = [...imageFormData];

		outer: for (let x = 0; x < imageFormData.length; x++)
		{
			for (let y = 0; y < imageFormData[x].length; y++)
			{
				let image = imageFormData[x][y];

				if (image !== constants.town.noImageId && image.src.includes(curImageName))
				{
					imageArray[x][y] = constants.town.noImageId;

					break outer;
				}
			}
		}

		this.setState({
			imageFormData: imageArray,
		}, () => {
			this.drawMap(true, 0, 0, width-1, height-1);
			this.drawImages(0, 0, width-1, height-1);
		});
	}

	render()
	{
		const {townId, images} = this.props;
		const {formData, dataUrl, cursorFormData, flipFormData, imageFormData,
			curImageName, cursor, paletteInterfaces, activePaletteId} = this.state;

		const rectTypes = constants.town.rectTypes;

		const showRectTypes = Object.keys(rectTypes)
			.map(i => {
				return {
					id: rectTypes[i].value,
					name: rectTypes[i].name,
				};
			});

		const showImages = Object.keys(images)
			.map(i => {
				const image = images[i];

				return {
					id: i,
					name: image.title,
					width: image.width,
					height: image.height,
					filename: `${i}.png`,
				};
			});

		return (
			<div className='MapDesigner'>
				<div className='MapMakerPage_description'>
					To create a map of your island use the Paintbrush tool to emulate your in-game town map down to the fine details. You can also add images such as the airport, bridges, and more by clicking on the desired image, clicking "Add Image", and then dragging the image around the map.
				</div>

				<div className='MapDesigner_grid'>
					<canvas height='960' width='1120' ref='mapInterface'
						data-scale='10' onMouseMove={this.editIfDrawing}
						onMouseDown={this.startDrawing}
						onMouseUp={() => this.stopDrawing()}
						onMouseOut={() => this.stopDrawing()}
						onClick={this.editIfDrawing}
						className='MapDesigner_canvas'
					/>
					<div className='MapPalette'>
						<h4 className='MapPalette_header'>
							Palette
						</h4>
						<div className='MapPaletter_palettes'>
							{[...Array(constants.town.numberOfColors).keys()].map(i =>
								<div key={`paletteInterface${i}`}
									onClick={() => this.changeDrawingColor(i)}
									className={i === activePaletteId ?
										`paletteInterface paletteInterface${i} selected` :
										`paletteInterface paletteInterface${i}`}
									style={{backgroundColor: paletteInterfaces[i].backgroundColor,
										border: paletteInterfaces[i].border}}
								/>
							)}
						</div>
						<h4 className='MapPalette_header'>
							Paintbrush
						</h4>
						<Check
							options={showRectTypes}
							name='paintbrush'
							defaultValue={[showRectTypes.find(rt => rt.id === cursor)?.id]}
							onChangeHandler={this.changeCursor}
							label='Paintbrush'
							hideLabel
						/>
						<div className='MapDesigner_imageSection'>
							<h4 className='MapPalette_header'>
								Images
							</h4>
							<Check
								options={showImages}
								name='icons'
								defaultValue={[curImageName]}
								onChangeHandler={this.changeImage}
								imageLocation='maps/acnh'
								useImageFilename
								hideName
								label='Images'
								hideLabel
							/>
							<Button
								clickHandler={() => this.addImage()}
								label='Add Image'
							/>
							<Button
								clickHandler={() => this.deleteAllImage()}
								label='Delete All Of Image'
							/>
						</div>
					</div>
				</div>

				<Form action='v1/town/map/designer/save' callback='/profile/:userId/towns' showButton>
					<input type='hidden' name='townId' value={townId} />
					<input type='hidden' name='data' value={formData.flat(2)} />
					<input type='hidden' name='dataUrl' value={dataUrl} />
					<input type='hidden' name='cursorData' value={cursorFormData.flat(2)} />
					<input type='hidden' name='flipData' value={flipFormData.flat(2)} />
					<input type='hidden' name='imageData'
						value={imageFormData.flat(2).map(image =>
							!image.src ? image : image.src.replace(/^.*[\\\/]/, '').replace(/\.[^/.]+$/, '')
						)}
					/>
				</Form>
			</div>
		);
	}
}

MapDesigner.propTypes = {
	townId: PropTypes.number,
	images: PropTypes.object, // shape of: name { title: string required, width: string, height: string }
	colors: PropTypes.object, // shape of: colorName: rgb (string)
	data: PropTypes.arrayOf(PropTypes.string),
	dataUrl: PropTypes.string,
	gridLength: PropTypes.number,
	width: PropTypes.number,
	height: PropTypes.number,
	cursorData: PropTypes.arrayOf(PropTypes.string),
	flipData: PropTypes.arrayOf(PropTypes.string),
	imageData: PropTypes.arrayOf(PropTypes.string)
};

export default MapDesigner;
