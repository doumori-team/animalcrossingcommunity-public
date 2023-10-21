import React from 'react';
import PropTypes from 'prop-types';

import { constants } from '@utils';
import { Form, RichTextArea, Text, Select, Check, Switch, TextArea } from '@form';
import { featureShape, featureCategoryShape, featureStatusShape, emojiSettingsShape } from '@propTypes';
import { RequirePermission } from '@behavior';

const EditFeature = ({categories, statuses, feature, userEmojiSettings}) =>
{
	return (
		<section className='EditPattern'>
			<Form action='v1/feature/save' callback='/feature/:id' showButton>
				<input type='hidden' name='id' value={feature ? feature.id : 0} />

				<Form.Group>
					<Text
						name='title'
						label='Title'
						maxLength={constants.max.postTitle}
						value={feature ? feature.title : ''}
						required
					/>
				</Form.Group>
				<Form.Group>
					<RichTextArea
						textName='description'
						formatName='format'
						label='Description'
						textValue={feature ? feature.description : ''}
						formatValue={feature ? feature.format : 'markdown'}
						maxLength={constants.max.post}
						emojiSettings={userEmojiSettings}
						required
					/>
				</Form.Group>
				<Form.Group>
					<Select
						name='categoryId'
						value={feature ? feature.categoryId : ''}
						required
						label='Category'
						options={categories.concat([{id: '', name: 'Other'}])}
						optionsMapping={{value: 'id', label: 'name'}}
					/>
				</Form.Group>
				<Form.Group>
					<Check
						label='Type'
						options={[
							{ id: true, name: 'Bug Report' },
							{ id: false, name: 'Feature Request' },
						]}
						name='isBug'
						defaultValue={feature ? [feature.isBug] : [false]}
					/>
				</Form.Group>
				{!feature && (
					<Form.Group>
						<Switch
							name='isExploit'
							label='Is Exploit'
							value={false}
						/>
					</Form.Group>
				)}
				<RequirePermission permission='claim-features' silent>
					<Form.Group>
						<RichTextArea
							textName='staffDescription'
							formatName='staffDescriptionFormat'
							label='Staff Description'
							textValue={feature ? feature.staffDescription : ''}
							formatValue={feature ? feature.staffDescriptionFormat : 'markdown'}
							maxLength={constants.max.post}
							emojiSettings={userEmojiSettings}
						/>
					</Form.Group>
				</RequirePermission>
				<RequirePermission permission='manage-features' silent>
					<Form.Group>
						<Switch
							name='staffOnly'
							label='Staff Only'
							value={feature ? feature.staffOnly : true}
						/>
					</Form.Group>
					<Form.Group>
						<Switch
							name='readOnly'
							label='Read Only'
							value={feature ? feature.readOnly : true}
						/>
					</Form.Group>
					<Form.Group>
						<Text
							label='Assigned User(s)'
							name='assignedUsers'
							value={feature && feature.assignedUsers ? feature.assignedUsers.map(u => u.username).toString() : ''}
							maxLength={constants.max.addMultipleUsers}
						/>
					</Form.Group>
					<Form.Group>
						<Select
							name='statusId'
							label='Status'
							value={feature ? feature.statusId : ''}
							options={statuses}
							optionsMapping={{value: 'id', label: 'name'}}
						/>
					</Form.Group>
				</RequirePermission>
			</Form>
		</section>
	);
}

EditFeature.propTypes = {
	categories: PropTypes.arrayOf(featureCategoryShape).isRequired,
	statuses: PropTypes.arrayOf(featureStatusShape).isRequired,
	feature: featureShape,
	userEmojiSettings: emojiSettingsShape,
}

export default EditFeature;