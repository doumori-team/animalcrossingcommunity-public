import React from 'react';
import { Link, useAsyncValue } from 'react-router-dom';

import { RequireUser, RequirePermission } from '@behavior';
import Pattern from '@/components/pattern/Pattern.js';
import { Form, Text, Check, Select } from '@form';
import { Pagination, Header, Section, Search, Grid } from '@layout';
import { utils, constants } from '@utils';

const PatternsPage = () =>
{
	const {totalCount, patterns, page, name, creator, pageSize, published,
		favorite, acgames, games} = getData(useAsyncValue());

	const link = `&creator=${encodeURIComponent(creator)}
		&name=${encodeURIComponent(name)}
		&published=${encodeURIComponent(published)}
		&favorite=${encodeURIComponent(favorite)}
		&games=${encodeURIComponent(games.join(','))}
	`;

	return (
		<div className='PatternsPage'>
			<RequirePermission permission='view-patterns'>
				<Header
					name='Patterns'
					description='Time to test those art skills! You can create your own pattern to be shared with all by clicking "Create a Pattern" above. While creating a pattern you can switch between different palettes from each of the mainline Animal Crossing games. When finished with a pattern, a QR code (if possible) will be created for you to allow easy transfer into AC:NL and AC:NH. You can also search for patterns below by using the pattern name or the username of its creator or by choosing a game. Favoriting a pattern will make it easier for you to search for it later.'
					links={
						<RequireUser permission='modify-patterns' silent>
							<Link to={`/patterns/add`}>
								Create a Pattern
							</Link>
						</RequireUser>
					}
				/>

				<Search callback='/patterns'>
					<Form.Group>
						<Text
							label='Pattern Name'
							name='name'
							value={name}
							maxLength={constants.max.patternName}
						/>
					</Form.Group>
					<Form.Group>
						<Text
							label='Pattern Creator'
							name='creator'
							value={creator}
							maxLength={constants.max.searchUsername}
						/>
					</Form.Group>
					<Form.Group>
						<Check
							label='Complete'
							options={constants.boolOptions}
							name='published'
							defaultValue={utils.realStringLength(published) > 0 ?
								[published] : ['both']}
						/>
					</Form.Group>
					<Form.Group>
						<Check
							label='Favorite'
							options={constants.boolOptions}
							name='favorite'
							defaultValue={utils.realStringLength(favorite) > 0 ?
								[favorite] : ['both']}
						/>
					</Form.Group>
					<Form.Group>
						<Select
							label='Game(s)'
							name='games'
							multiple
							value={games.length > 0 ? games : []}
							options={acgames.filter(g => g.hasTown === true)}
							optionsMapping={{value: 'id', label: 'name'}}
							placeholder='Choose an Animal Crossing game...'
							size={5}
						/>
					</Form.Group>
				</Search>

				<Section>
					<Grid name='pattern' options={patterns}>
						{patterns.map((pattern, index) =>
							<Pattern key={index} pattern={pattern} />
						)}
					</Grid>

					<Pagination
						page={page}
						pageSize={pageSize}
						totalCount={totalCount}
						startLink={`patterns`}
						endLink={link}
					/>
				</Section>
			</RequirePermission>
		</div>
	);
}

export async function loadData(_, {page, name, creator, published, favorite, games})
{
	return Promise.all([
		this.query('v1/acgames'),
		this.query('v1/patterns', {
			page: page ? page : 1,
			name: name ? name : '',
			creator: creator ? creator : '',
			published: published ? published : 'both',
			favorite: favorite ? favorite : 'both',
			games: games ? games : '',
		}),
	]);
}

function getData(data)
{
	const [acgames, returnValue] = data;

	return {
		patterns: returnValue.results,
		totalCount: returnValue.count,
		page: returnValue.page,
		name: returnValue.name,
		creator: returnValue.creator,
		pageSize: returnValue.pageSize,
		published: returnValue.published,
		favorite: returnValue.favorite,
		acgames: acgames,
		games: returnValue.games,
	};
}

export default PatternsPage;
