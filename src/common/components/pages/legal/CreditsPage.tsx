import React from 'react';

import { ContentBox } from '@layout';

const CreditsPage = () =>
{
	return (
		<div className='CreditsPage'>
			<ContentBox>
				<p>Thank you to all Staff members who have contributed to the upkeep and development of the site.</p>
				<p>Although most of the site has been created by our users, some of the information used has been gathered by other groups. We give full acknowledgement to them here and list where the information is used on the site.</p>
				<ul>
					<li>
						The <a href={`https://docs.google.com/spreadsheets/d/13d_LAJPlxMa_DubPTuirkIV4DERBMXbrWQsmSh8ReK4`}>Data Spreadsheet for Animal Crossing: New Horizons</a> has been used for all data on Animal Crossing: New Horizons. This includes but is not limited to Items, Creatures, and Residents. You'll find it used in places such as the Trading Post, AC:NH Catalogs, and AC:NH Towns.
					</li>
					<li>
						The <a href={`https://www.spriters-resource.com/`}>Spriters Resource</a>, <a href={`https://www.textures-resource.com/`}>Textures Resource</a>, and <a href={`https://www.models-resource.com/`}>Models Resource</a> have been used for various graphics around the site such as some avatar elements, Animal Crossing game play icons and images, etc.
					</li>
					<li>
						<a href={`https://nookipedia.com/`}>Nookipedia</a>'s image assets have been used for various graphics in the user town feature, such as public works projects, fossil icons, sculpture icons, and villager icons.
					</li>
					<li>
						<a href={`https://tcrf.net/`}>TCRF</a>'s ripped assets have been used for AC:GC Nook upgrade textures.
					</li>
					<li>
						Thanks to <a href={`https://youtube.com/@Hunter-R./`}>Hunter R.</a> for providing the time data that controls grass shapes in the user town feature.
					</li>
				</ul>
			</ContentBox>
		</div>
	);
};

export default CreditsPage;
