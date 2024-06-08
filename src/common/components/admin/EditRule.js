import React from 'react';
import PropTypes from 'prop-types';

import { Form, Text, TextArea, Select, Switch } from '@form';
import { constants } from '@utils';

const EditRule = ({rule, categories}) =>
{
	return (
		<div className='EditRule'>
			<Form action='v1/admin/rule/save' callback='/rules' showButton>
				<input type='hidden' name='id' value={rule ? rule.id : 0} />

				<Form.Group>
					<Select
						label='Category'
						name='categoryId'
						value={rule ? rule.categoryId : 0}
						options={categories}
						optionsMapping={{value: 'id', label: 'name'}}
						placeholder='Choose a category...'
						size={6}
						required
					/>
				</Form.Group>

				<Form.Group>
					<Text
						type='number'
						name='number'
						label='Number'
						value={rule ? rule.number : 1}
						required
						min={1}
						max={constants.max.ruleNumber}
					/>
				</Form.Group>

				<Form.Group>
					<Text
						name='name'
						label='Name'
						value={rule && rule.name ? rule.name : ''}
						maxLength={constants.max.ruleName}
					/>
				</Form.Group>

				<Form.Group>
					<Switch
						name='reportable'
						label='Reportable'
						value={rule ? rule.reportable : true}
					/>
				</Form.Group>

				<Form.Group>
					<TextArea
						name='description'
						label='Description'
						value={rule ? rule.description : ''}
						required
						maxLength={constants.max.ruleDescription}
					/>
				</Form.Group>
			</Form>
		</div>
	);
}

EditRule.propTypes = {
	rule: PropTypes.shape({
		id: PropTypes.number,
		number: PropTypes.number,
		name: PropTypes.string,
		description: PropTypes.string,
		categoryId: PropTypes.number,
		reportable: PropTypes.bool,
	}),
	categories: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.number,
		name: PropTypes.string,
	})),
};

export default EditRule;
