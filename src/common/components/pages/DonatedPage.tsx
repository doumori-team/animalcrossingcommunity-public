import { ContentBox } from '@layout';
import { constants, routerUtils } from '@utils';

export const action = routerUtils.formAction;

const DonatedPage = () =>
{
	return (
		<div className='DonatedPage'>
			<ContentBox>
				<img src={`${constants.AWS_URL}/images/layout/thank_you.png`} alt='Thank You!' />
				<div>Thank you for supporting Animal Crossing Community.</div>
			</ContentBox>
		</div>
	);
};

export default DonatedPage;
