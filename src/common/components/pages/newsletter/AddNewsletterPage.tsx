import { RequirePermission } from '@behavior';
import EditNewsletter from '@/components/newsletter/EditNewsletter.tsx';
import { Header, Section } from '@layout';
import { routerUtils } from '@utils';
import { Alert } from '@form';

export const action = routerUtils.formAction;

const AddNewsletterPage = () =>
{
	return (
		<div className='AddNewsletterPage'>
			<RequirePermission permission='modify-newsletter'>
				<Header
					name='Newsletters'
					link='/newsletters'
				/>

				<Section>
					<Alert>
						More configurable options - such as images - will become available once the newsletter is created.
					</Alert>

					<EditNewsletter />
				</Section>
			</RequirePermission>
		</div>
	);
};

export default AddNewsletterPage;
