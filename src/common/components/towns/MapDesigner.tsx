import React, { useState, useEffect, useRef } from 'react';

import { utils, constants } from '@utils';
import { Form, Check, Button } from '@form';
import { TownType, MapDesignerColorsType, MapDesignerImagesType, MapDesignerMapInfoType } from '@types';

const MapDesigner = ({
	townId,
	images,
	initialColors,
	data,
	initialDataUrl,
	gridLength,
	width,
	height,
	cursorData,
	flipData,
	imageData,
}: MapDesignerProps) =>
{
	// initialize 2D array used for storing colors used on canvas in X, Y positions
	let initialFormData: any = [], initialCursorFormData: any = [], initialFlipFormData: any = [], initialImageFormData: any = [];

	for (let i = 0; i < width; i++)
	{
		initialFormData[i] = [];
		initialCursorFormData[i] = [];
		initialFlipFormData[i] = [];
		initialImageFormData[i] = [];
	}

	const colors = Object.values(initialColors);

	if (data.length > 0)
	{
		// convert 1D array to 2D for X Y positions
		// this actually goes column by column instead of row by row
		for (let i = 0; i < data.length; i++)
		{
			let x = i % height;
			let y = Math.floor(i / height);

			initialFormData[y][x] = data[i];
			initialCursorFormData[y][x] = cursorData[i];
			initialFlipFormData[y][x] = flipData[i];
			initialImageFormData[y][x] = imageData[i];
		}
	}
	else
	{
		// default is water everywhere
		for (let x = 0; x < width; x++)
		{
			for (let y = 0; y < height; y++)
			{
				initialFormData[x][y] = colors[3];
				initialCursorFormData[x][y] = 'rect';
				initialFlipFormData[x][y] = initialFormData[x][y];
				initialImageFormData[x][y] = constants.town.noImageId;
			}
		}
	}

	let initialPaletteInterfaces = [];

	for (let i = 0; i <= constants.town.numberOfColors; i++)
	{
		initialPaletteInterfaces[i] = {
			border: '',
			backgroundColor: '',
		};
	}

	// figure out what is needed when adding image to array
	const getImage = (imageName: string): any =>
	{
		let image: any = new Image();
		image.src = '/images/maps/acnh/' + imageName + '.png';

		image.data = {
			width: images[imageName].width ? images[imageName].width : image.width,
			height: images[imageName].height ? images[imageName].height : image.height,
		};

		return image;
	};

	let imageArray = [...initialImageFormData];

	// change out image name for Image class
	if (data.length > 0)
	{
		for (let x = 0; x < initialImageFormData.length; x++)
		{
			for (let y = 0; y < initialImageFormData[x].length; y++)
			{
				let imageName = initialImageFormData[x][y];

				if (imageName !== constants.town.noImageId)
				{
					imageArray[x][y] = getImage(imageName);
				}
			}
		}
	}

	const [currentlyDrawing, setCurrentlyDrawing] = useState<boolean>(false);
	const [currentlyDragging, setCurrentlyDragging] = useState<boolean>(false);
	const [activePaletteId, setActivePaletteId] = useState<number>(0);
	const [formData, setFormData] = useState<any>(initialFormData);
	const [cursor, setCursor] = useState<string>('rect');
	const [draggingImageX, setDraggingImageX] = useState<number | null>(null);
	const [draggingImageY, setDraggingImageY] = useState<number | null>(null);
	const [scale, setScale] = useState<number>(1);
	const [cursorFormData, setCursorFormData] = useState<any>(initialCursorFormData);
	const [imageFormData, setImageFormData] = useState<any>(imageArray);
	const [flipFormData, setFlipFormData] = useState<any>(initialFlipFormData);
	const [dataUrl, setDataUrl] = useState<any>(initialDataUrl);
	const [paletteInterfaces, setPaletteInterfaces] = useState<any>(initialPaletteInterfaces);
	const [curImageName, setCurImageName] = useState<string>('airport');
	const [posX, setPosX] = useState<number>(0);
	const [posY, setPosY] = useState<number>(0);
	const [allImagesChange, setAllImagesChange] = useState<number>(Math.random());

	const palette = [...Array(constants.town.numberOfColors).keys()];
	const mapInterface = useRef<any>();
	const didMount = useRef<any>();

	useEffect(() =>
	{
		let initialScale = 1;

		if (mapInterface.current.dataset.scale)
		{
			initialScale = parseInt(mapInterface.current.dataset.scale, 10);
		}

		for (let i = 0; i < constants.town.numberOfColors; i++)
		{
			drawPalette(i);
		}

		setScale(initialScale);
	}, []);

	useEffect(() =>
	{
		if (!(didMount as any).scale)
		{
			(didMount as any).scale = true;
			return;
		}

		drawMap(true, 0, 0, width - 1, height - 1);

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
						image.onload = () =>
						{
							drawImage(image, image.x, image.y);
						};
					}
				}
			}
		}
	}, [scale]);

	const editIfDrawing = (e: any): void =>
	{
		if (currentlyDrawing || currentlyDragging)
		{
			editMap(e);
		}
	};

	// Changes the color of the 'pixel' indicated.
	const editMap = (e: any): void =>
	{
		const pos = getCursorPosition(e, mapInterface.current);

		if (pos === false)
		{
			return;
		}

		const posx = (pos as any)[0], posy = (pos as any)[1];

		if (posx >= width || posy >= height)
		{
			return;
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

			if (draggingImageX == null || draggingImageY == null)
			{
				return;
			}

			// move the image from the old to the new position
			let imageArray = [...imageFormData];
			imageArray[posx][posy] = imageArray[draggingImageX][draggingImageY];
			imageArray[draggingImageX][draggingImageY] = constants.town.noImageId;

			setDraggingImageX(posx);
			setDraggingImageY(posy);
			setImageFormData(imageArray);

			// best to just update the places where the image was and where it will be
			const image = imageArray[posx][posy];
			const imageWidth = draggingImageX + Math.ceil(image.data.width / scale);
			const imageHeight = draggingImageY + Math.ceil(image.data.height / scale);

			drawMap(true, draggingImageX, draggingImageY, imageWidth, imageHeight);
			drawImage(image, posx, posy);
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
			let flipArray = [...flipFormData];
			flipArray[posx][posy] = formData[posx][posy];

			let dataArray = [...formData];
			dataArray[posx][posy] = colors[palette[activePaletteId]];

			let cursorArray = [...cursorFormData];
			cursorArray[posx][posy] = cursor;

			setCursorFormData(cursorArray);
			setFlipFormData(flipArray);
			setPosX(posx);
			setPosY(posy);
			setFormData(dataArray);
		}
	};

	useEffect(() =>
	{
		if (!(didMount as any).formData)
		{
			(didMount as any).formData = true;
			return;
		}

		drawMap(true, posX, posY, posX, posY);
	}, [formData]);

	const stopDrawing = (): void =>
	{
		// clear the canvas of grid to save prettified map
		clearCanvas(mapInterface.current, 0, 0, width, height);

		drawMap(false, 0, 0, width - 1, height - 1);
		drawImages(0, 0, width - 1, height - 1);

		setCurrentlyDrawing(false);
		setCurrentlyDragging(false);
		setDraggingImageX(null);
		setDraggingImageY(null);
		setDataUrl(mapInterface.current.toDataURL());

		drawMap(true, 0, 0, width - 1, height - 1);
		drawImages(0, 0, width - 1, height - 1);
	};

	const startDrawing = (e: any): void =>
	{
		// are we moving an image?
		const pos = getCursorPosition(e, mapInterface.current);

		if (pos === false)
		{
			return;
		}

		const posx = (pos as any)[0], posy = (pos as any)[1];

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
					if (
						posx >= x &&
						posx <= x + Math.floor(image.data.width / scale) &&
						posy >= y &&
						posy <= y + Math.floor(image.data.height / scale)
					)
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
			setCurrentlyDragging(true);
			setDraggingImageX(draggingImageX);
			setDraggingImageY(draggingImageY);
		}
		else
		{
			setCurrentlyDrawing(true);
		}
	};

	// Changes the active palette color to the one clicked on.
	const changeDrawingColor = (index: number): void =>
	{
		const oldColorIndex = activePaletteId;

		if (index === oldColorIndex)
		{
			return;
		}

		setActivePaletteId(index);

		drawPalette(oldColorIndex);
		drawPalette(index);
	};

	// Draws one of the colors of the palette on the appropriate canvas.
	const drawPalette = (index: number): void =>
	{
		let rgb: string = colors[palette[index]];

		let newPaletteInterfaces = [...paletteInterfaces];

		newPaletteInterfaces[index].backgroundColor = rgb;

		// if the fill color is white, we won't be able to see the palette color otherwise
		if (utils.isColorLight(rgb))
		{
			rgb = '#7E7B7B';
		}

		newPaletteInterfaces[index].border = '1px solid ' + rgb;

		setPaletteInterfaces(newPaletteInterfaces);
	};

	// Draws the map on the canvas
	const drawMap = (drawGrid: boolean, x1: number, y1: number, x2: number, y2: number): void =>
	{
		const canvas = mapInterface.current;

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
					drawScaledSquare(canvas, x, y, rgb, '#888', pos);

					if (pos === constants.town.rectTypes[2].value) // top-right
					{
						drawScaledSquare(canvas, x, y, flipRgb, '#888', constants.town.rectTypes[3].value);
					}
					else if (pos === constants.town.rectTypes[4].value) // bottom-right
					{
						drawScaledSquare(canvas, x, y, flipRgb, '#888', constants.town.rectTypes[5].value);
					}
					else if (pos === constants.town.rectTypes[3].value) // bottom-left
					{
						drawScaledSquare(canvas, x, y, flipRgb, '#888', constants.town.rectTypes[2].value);
					}
					else if (pos === constants.town.rectTypes[5].value) // top-left
					{
						drawScaledSquare(canvas, x, y, flipRgb, '#888', constants.town.rectTypes[4].value);
					}

					// for the grid, so it's easier to manually copy
					drawLine(canvas, x, y);
				}
				else
				{
					drawScaledSquare(canvas, x, y, rgb, false, pos);

					if (pos === constants.town.rectTypes[2].value) // top-right
					{
						drawScaledSquare(canvas, x, y, flipRgb, false, constants.town.rectTypes[3].value);
					}
					else if (pos === constants.town.rectTypes[4].value) // bottom-right
					{
						drawScaledSquare(canvas, x, y, flipRgb, false, constants.town.rectTypes[5].value);
					}
					else if (pos === constants.town.rectTypes[3].value) // bottom-left
					{
						drawScaledSquare(canvas, x, y, flipRgb, false, constants.town.rectTypes[2].value);
					}
					else if (pos === constants.town.rectTypes[5].value) // top-left
					{
						drawScaledSquare(canvas, x, y, flipRgb, false, constants.town.rectTypes[4].value);
					}
				}
			}
		}
	};

	// Clears the contents of a canvas.
	const clearCanvas = (canvas: any, x1: number, y1: number, x2: number, y2: number): void =>
	{
		x1 *= scale;
		y1 *= scale;
		x2 *= scale;
		y2 *= scale;

		const height = y2 - y1 + 1;
		const width = x2 - x1 + 1;

		canvas.getContext('2d').clearRect(x1, y1, width, height);
	};

	// draw a line at x, y position along the grid
	const drawLine = (canvas: any, x: number, y: number): void =>
	{
		const xCalc = x + 1;
		const yCalc = y + 1;
		const xPos = x * scale;
		const yPos = y * scale;
		const color = '#ff0000';
		const lineWidth = 1.2;

		const context = canvas.getContext('2d');

		if (xCalc % gridLength === 0 && xCalc !== width)
		{
			context.beginPath();
			context.moveTo(xPos + scale, yPos);
			context.lineTo(xPos + scale, yPos + scale);
			context.lineWidth = lineWidth;
			context.strokeStyle = color;
			context.stroke();
		}

		if (yCalc % gridLength === 0 && yCalc !== height)
		{
			context.beginPath();
			context.moveTo(xPos + scale, yPos + scale);
			context.lineTo(xPos, yPos + scale);
			context.lineWidth = lineWidth;
			context.strokeStyle = color;
			context.stroke();
		}
	};

	// Draws a one-unit square on a canvas.
	const drawScaledSquare = (canvas: any, x: number, y: number, fillColor: string, borderColor: string | boolean, fillType: string): void =>
	{
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

				// drawing a triangle is how you draw a curved line
				if (fillType === constants.town.rectTypes[2].value) // top-right
				{
					context.moveTo(x, y);
					context.lineTo(x + scale, y);
					context.lineTo(x + scale, y + scale);
				}
				else if (fillType === constants.town.rectTypes[4].value) // bottom-right
				{
					context.moveTo(x + scale, y);
					context.lineTo(x + scale, y + scale);
					context.lineTo(x, y + scale);
				}
				else if (fillType === constants.town.rectTypes[3].value) // bottom-left
				{
					context.moveTo(x, y);
					context.lineTo(x, y + scale);
					context.lineTo(x + scale, y + scale);
				}
				else if (fillType === constants.town.rectTypes[5].value) // top-left
				{
					context.moveTo(x, y);
					context.lineTo(x + scale, y);
					context.lineTo(x, y + scale);
				}

				context.closePath();
				context.fill();
			}
		}

		if (borderColor)
		{
			context.strokeStyle = borderColor;
			context.strokeRect(x + 0.5, y + 0.5, scale, scale);
		}
	};

	// Works out the coordinate indicated on a canvas, relative to the canvas' scale.
	const getCursorPosition = (e: any, canvas: any): [number, number] | boolean =>
	{
		let x, y;

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

		if (e.pageX != undefined && e.pageY != undefined)
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

		x /= scale;
		y /= scale;
		x = Math.floor(x);
		y = Math.floor(y);

		// account for scale
		return [x, y];
	};

	// draw that image on the canvas at x, y
	const drawImage = (image: any, x: number, y: number): void =>
	{
		mapInterface.current.getContext('2d').drawImage(image, x * scale, y * scale, image.data.width, image.data.height);
	};

	// re-draw images between positions
	const drawImages = (x1: number, y1: number, x2: number, y2: number): void =>
	{
		for (let x = x1; x <= x2; x++)
		{
			for (let y = y1; y <= y2; y++)
			{
				let image = imageFormData[x][y];

				if (image !== constants.town.noImageId)
				{
					drawImage(image, x, y);
				}
			}
		}
	};

	// add an image to the canvas
	const addImage = (): void =>
	{
		const image = getImage(curImageName);

		let imageArray = [...imageFormData];
		imageArray[1][1] = image;

		setImageFormData(imageArray);

		image.onload = () =>
		{
			drawImage(image, image.x, image.y);
		};
	};

	useEffect(() =>
	{
		if (!(didMount as any).allImagesChange)
		{
			(didMount as any).allImagesChange = true;
			return;
		}

		drawMap(true, 0, 0, width - 1, height - 1);
		drawImages(0, 0, width - 1, height - 1);
	}, [allImagesChange]);

	// delete all images of that type from the canvas
	const deleteAllImages = (): void =>
	{
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

		setImageFormData(imageArray);
		setAllImagesChange(Math.random());
	};

	const showRectTypes = Object.keys(constants.town.rectTypes)
		.map(i =>
		{
			return {
				id: (constants.town.rectTypes as any)[i].value,
				name: (constants.town.rectTypes as any)[i].name,
			};
		});

	const showImages = Object.keys(images)
		.map(i =>
		{
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
				<canvas height='960' width='1120' ref={mapInterface}
					data-scale='10' onMouseMove={editIfDrawing}
					onMouseDown={startDrawing}
					onMouseUp={() => stopDrawing()}
					onMouseOut={() => stopDrawing()}
					onClick={editIfDrawing}
					className='MapDesigner_canvas'
				/>
				<div className='MapPalette'>
					<h4 className='MapPalette_header'>
						Palette
					</h4>
					<div className='MapPaletter_palettes'>
						{[...Array(constants.town.numberOfColors).keys()].map(i =>
							<div key={`paletteInterface${i}`}
								onClick={() => changeDrawingColor(i)}
								className={i === activePaletteId ?
									`paletteInterface paletteInterface${i} selected` :
									`paletteInterface paletteInterface${i}`}
								style={{ backgroundColor: paletteInterfaces[i].backgroundColor,
									border: paletteInterfaces[i].border }}
							/>,
						)}
					</div>
					<h4 className='MapPalette_header'>
						Paintbrush
					</h4>
					<Check
						options={showRectTypes}
						name='paintbrush'
						defaultValue={[showRectTypes.find(rt => rt.id === cursor)?.id]}
						onChangeHandler={(e: any) => setCursor(String(e.target.value))}
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
							onChangeHandler={(e: any) => setCurImageName(String(e.target.value))}
							imageLocation='maps/acnh'
							useImageFilename
							hideName
							label='Images'
							hideLabel
						/>
						<Button
							clickHandler={() => addImage()}
							label='Add Image'
						/>
						<Button
							clickHandler={() => deleteAllImages()}
							label='Delete All Of Image'
						/>
					</div>
				</div>
			</div>
			<Form action='v1/town/map/designer/save' callback={`/profile/:userId/town/${townId}`} showButton>
				<input type='hidden' name='townId' value={townId} />
				<input type='hidden' name='data' value={formData.flat(2)} />
				<input type='hidden' name='dataUrl' value={dataUrl} />
				<input type='hidden' name='cursorData' value={cursorFormData.flat(2)} />
				<input type='hidden' name='flipData' value={flipFormData.flat(2)} />
				<input type='hidden' name='imageData'
					value={imageFormData.flat(2).map((image: any) =>
						!image.src ? image : image.src.replace(/^.*[\\/]/, '').replace(/\.[^/.]+$/, ''),
					)}
				/>
			</Form>
		</div>
	);
};

type MapDesignerProps = {
	townId: number
	images: MapDesignerImagesType
	initialColors: MapDesignerColorsType
	data: NonNullable<TownType['mapDesignData']>['colorData']
	initialDataUrl: NonNullable<TownType['mapDesignData']>['dataUrl']
	gridLength: MapDesignerMapInfoType['gridLength']
	width: MapDesignerMapInfoType['width']
	height: MapDesignerMapInfoType['height']
	cursorData: NonNullable<TownType['mapDesignData']>['cursorData']
	flipData: NonNullable<TownType['mapDesignData']>['flipData']
	imageData: NonNullable<TownType['mapDesignData']>['imageData']
};

export default MapDesigner;
