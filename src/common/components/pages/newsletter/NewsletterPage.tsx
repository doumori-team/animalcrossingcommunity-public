import { Link } from 'react-router';

import { RequirePermission } from '@behavior';
import { Confirm, Alert } from '@form';
import { Header } from '@layout';
import { APIThisType, NewsletterType, NewsletterArticleType } from '@types';
import { routerUtils } from '@utils';
import TableOfContents from '@/components/newsletter/TableOfContents.tsx';

export const action = routerUtils.formAction;

const NewsletterPage = ({ loaderData }: { loaderData: NewsletterPageProps }) =>
{
	const { newsletter, articles } = loaderData;

	if (newsletter.pdfOnly)
	{
		return (
			<Alert>
				This newsletter is PDF only!
			</Alert>
		);
	}

	const encodedId = encodeURIComponent(newsletter.id);

	return (
		<div className='NewsletterPage'>
			<RequirePermission permission='view-newsletter'>
				<Header
					name={`Issue ${newsletter.issue} - ${newsletter.formattedIssueDate}`}
					links={
						<>
							<Link to='/newsletters'>
								Newsletters
							</Link>
							{!newsletter.published &&
								<RequirePermission permission='modify-guides' silent>
									<Link to={`/newsletter/${encodedId}/edit`}>
										Edit
									</Link>

									<Link to={`/newsletter/${encodedId}/add`}>
										Add Article
									</Link>

									<RequirePermission permission='publish-newsletter' silent>
										<Confirm
											action='v1/newsletter/publish'
											callback={`/newsletter/${encodedId}`}
											id={newsletter.id}
											label='Publish'
											message='Are you sure you want to publish this newsletter?'
										/>
									</RequirePermission>
								</RequirePermission>
							}
						</>
					}
				/>

				<TableOfContents
					newsletterId={newsletter.id}
					articles={articles}
				/>
			</RequirePermission>
		</div>
	);
};

async function loadData(this: APIThisType, { id }: { id: string }): Promise<NewsletterPageProps>
{
	const [newsletter, articles] = await Promise.all([
		this.query('v1/newsletter', { id: id }),
		this.query('v1/newsletter/articles', { id: id }),
	]);

	return { newsletter, articles };
}

export const loader = routerUtils.wrapLoader(loadData);

type NewsletterPageProps = {
	newsletter: NewsletterType
	articles: NewsletterArticleType[]
};

export default NewsletterPage;
