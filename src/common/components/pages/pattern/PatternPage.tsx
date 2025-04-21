import { useState } from 'react';
import { Link } from 'react-router';

import { utils, constants, routerUtils } from '@utils';
import { RequireClientJS, RequireUser, RequirePermission } from '@behavior';
import Pattern from '@/components/pattern/Pattern.tsx';
import { Header, Section, RequireLargeScreen } from '@layout';
import { Checkbox } from '@form';
import { APIThisType, PatternType } from '@types';

export const action = routerUtils.formAction;

const PatternPage = ({ loaderData }: { loaderData: PatternPageProps }) =>
{
	const [toggleTransparent, setToggleTransparent] = useState<boolean>(false);
	const [toggleColor, setToggleColor] = useState<any>([]);

	const { pattern } = loaderData;

	// Convert the 1D array to 2D array for printing
	// also record all unique colors included in the pattern
	let decoded: any = [], includedColors: any = [], transparentIncluded = false;

	for (let i = 0; i < constants.pattern.paletteLength; i++)
	{
		decoded[i] = [];
	}

	for (let i = 0; i < constants.pattern.length; i++)
	{
		let x = i % constants.pattern.paletteLength;
		let y = Math.floor(i / constants.pattern.paletteLength);

		let rgb = pattern.data[i];
		decoded[x][y] = rgb;

		if (!includedColors.includes(rgb))
		{
			if (Number(rgb) !== constants.pattern.transparentColorId)
			{
				includedColors.push(rgb);
			}
			else
			{
				transparentIncluded = true;
			}
		}
	}

	// start off with the colors in the palette
	const palettes = utils.getPatternPalettes(pattern.gameId);
	const orgPalette = [...(palettes as any)[pattern.paletteId - 1].colors];
	let palette = [...orgPalette];

	// for AC:NL & AC:NH, you can change out colors
	// change out any colors that aren't used for ones that are

	// what colors are in the pattern that isn't in the palette
	const incColors = includedColors.filter((x: any) => !palette.includes(x));

	if (incColors.length > 0)
	{
		// colors in the palette not used in the pattern
		const palColors = palette.filter(x => !includedColors.includes(x));
		let i = 0;

		for (let key in palette)
		{
			// if this color is one not used
			if (palColors.includes(palette[key]))
			{
				// replace unused palette color with used pattern color
				palette[key] = incColors[i];
				i++;
			}

			if (incColors.length === i)
			{
				break;
			}
		}
	}

	// for GC, WW and CF, colors can't be changed out from the palette,
	// so the palette color numbers are always 1-15. For NH, we give the
	// hue, vividness and brightness for each color in case the palette was
	// changed, so the color number doesn't matter and thus is 1-15. However
	// there isn't a game lookup for NL colors, so we give an image of all
	// the colors numbers and use that for the numbers.
	let indexes: any = [];
	let i = 1;
	const colors = utils.getPatternColors(pattern.gameId);

	for (let key in palette)
	{
		if (pattern.gameId === constants.gameIds.ACNL)
		{
			indexes[key] = (colors as any).indexOf(palette[key]) + 1;
		}
		else
		{
			indexes[key] = i;
			i++;
		}
	}

	// add 'transparent color'
	if (pattern.gameId === constants.gameIds.ACNH)
	{
		palette.push(constants.pattern.transparentColorId);
		indexes[constants.pattern.numberOfColors] = 16;

		if (transparentIncluded)
		{
			includedColors.push(constants.pattern.transparentColorId);
		}
	}

	const colorInfo = utils.getPatternColorInfo(pattern.gameId);

	const toggleColorFunc = (rgb: string, index: number): void =>
	{
		let newToggleColor = [...toggleColor];
		newToggleColor[index] = newToggleColor[index] && newToggleColor[index] === 'white' ? rgb : 'white';

		setToggleColor(newToggleColor);
	};

	const toggleTransparentColor = (): void =>
	{
		setToggleTransparent(!toggleTransparent);
	};

	return (
		<div className='PatternPage'>
			<RequirePermission permission='view-patterns'>
				<Header
					name='Patterns'
					link='/patterns'
					links={
						<RequireUser permission='modify-patterns' silent>
							<Link to={`/patterns/add`}>
								Create a Pattern
							</Link>
						</RequireUser>
					}
				/>

				<Section>
					<Pattern pattern={pattern} />

					<div className='PatternPage_copyManual'>
						<h3>Manually Copy Pattern:</h3>

						<RequireLargeScreen size='657'>
							<div className='PatternPage_copyPattern'>
								<div className='PatternPage_pattern'>
									{decoded.map((inner: any, key: any) =>
									{
										return (
											<div key={key} className='PatternPage_gridRow'>
												{inner.map((rgb: any, index: any) =>
												{
													let number = -1;

													if (Number(rgb) === constants.pattern.transparentColorId)
													{
														return (
															<div key={index}
																className={`PatternPage_grid ${toggleTransparent ? '' : 'Pattern_transparent'}`}
															>
																<span className={`${toggleTransparent ? 'hideNumber' : ''}`}>
																	{indexes[constants.pattern.numberOfColors]}
																</span>
															</div>
														);
													}
													else
													{
														number = indexes[palette.indexOf(rgb)];
													}

													let color = 'white';

													// if the color is white, we need a black color for the number to show
													if (utils.isColorLight(rgb))
													{
														color = 'black';
													}

													return (
														<div key={index} className='PatternPage_grid'
															style={{ backgroundColor: toggleColor[number] ? toggleColor[number] : rgb, color: color }}
														>
															<span className={`${toggleColor[number] && toggleColor[number] === 'white' ? 'hideNumber' : ''}`}>
																{number}
															</span>
														</div>
													);
												})}
											</div>
										);
									})}
								</div>

								<div className='PatternPage_palette'>
									<div className='PatternPage_palettes'>
										{palette.map((rgb, index) =>
										{
											let number = indexes[index], addInfo = '';

											if (rgb === constants.pattern.transparentColorId)
											{
												return (
													<div key={index} className='PatternPage_paletteColor'>
														<div className='palette Pattern_transparent'>
															{number}
														</div>
														<RequireClientJS>
															{includedColors.includes(constants.pattern.transparentColorId) &&
																<Checkbox
																	checked={true}
																	clickHandler={() => toggleTransparentColor()}
																	label='Toggle Transparent Color'
																	hideLabels
																/>
															}
														</RequireClientJS>
													</div>
												);
											}
											// grab hue, vividness, brightness if NH
											else if (pattern.gameId === constants.gameIds.ACNH && orgPalette.indexOf(rgb) < 0)
											{
												let patternColor = (colorInfo as any).find((c: any) => c.hex === rgb);
												addInfo = `Hue: ${patternColor.hue}
													Vividness: ${patternColor.vividness}
													Brightness: ${patternColor.brightness}
												`;
											}

											let color = 'white';

											// if the color is white, we need a black color for the number to show
											if (utils.isColorLight(rgb))
											{
												color = 'black';
											}

											return (
												<div key={index} className='PatternPage_paletteColor'>
													<div className='palette'
														style={{ backgroundColor: rgb, color: color }}
													>
														{number}
													</div>
													<RequireClientJS>
														{includedColors.includes(rgb) &&
															<Checkbox
																checked={true}
																clickHandler={() => toggleColorFunc(rgb, number)}
																label='Toggle Color'
																hideLabels
															/>
														}
													</RequireClientJS>
													<div className='PatternPage_paletteAdd'>{addInfo}</div>
												</div>
											);
										})}
									</div>
									<div className='PatternPage_paletteName'>
										{incColors.length > 0 &&
											'Modified '
										}
										Palette #{pattern.paletteId}
									</div>
								</div>

								{pattern.gameId === constants.gameIds.ACNL &&
									<img src={`${constants.AWS_URL}/images/pattern/acnl_color_reference.jpg`}
										alt='AC:NL Color Reference'
										className='PatternPage_nlColorReference'
									/>
								}
							</div>
						</RequireLargeScreen>
					</div>

					{pattern.qrCodeUrl &&
						<div className='PatternPage_copyQr'>
							<h3>Copy via QR Code:</h3>
							<img src={pattern.qrCodeUrl} alt='QR Code' />
						</div>
					}
				</Section>
			</RequirePermission>
		</div>
	);
};

async function loadData(this: APIThisType, { id }: { id: string }): Promise<PatternPageProps>
{
	const [pattern] = await Promise.all([
		this.query('v1/pattern', { id: id }),
	]);

	return { pattern };
}

export const loader = routerUtils.wrapLoader(loadData);

type PatternPageProps = {
	pattern: PatternType
};

export default PatternPage;
