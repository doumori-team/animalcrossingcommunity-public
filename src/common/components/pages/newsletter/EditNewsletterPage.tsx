import { RequirePermission } from '@behavior';
import EditNewsletter from '@/components/newsletter/EditNewsletter.tsx';
import { Header, Section } from '@layout';
import { APIThisType, NewsletterType } from '@types';
import { routerUtils } from '@utils';
import { Alert } from '@form';

export const action = routerUtils.formAction;

const EditNewsletterPage = ({ loaderData }: { loaderData: EditNewsletterPageProps }) =>
{
	const { newsletter } = loaderData;

	if (newsletter.pdfOnly)
	{
		return (
			<Alert>
				This newsletter is PDF only!
			</Alert>
		);
	}

	if (newsletter.published)
	{
		return (
			<Alert>
				This newsletter is published!
			</Alert>
		);
	}

	return (
		<div className='EditGuidePage'>
			<RequirePermission permission='modify-newsletter'>
				<Header
					name='Newsletters'
					link='/newsletters'
				/>

				<Section>
					<EditNewsletter
						key={newsletter.id}
						newsletter={newsletter}
					/>
				</Section>
			</RequirePermission>
		</div>
	);
};

async function loadData(this: APIThisType, { id }: { id: string })
{
	const [newsletter] = await Promise.all([
		this.query('v1/newsletter', { id: id }),
	]);

	return { newsletter };
}

export const loader = routerUtils.wrapLoader(loadData);

type EditNewsletterPageProps = {
	newsletter: NewsletterType
};

export default EditNewsletterPage;
