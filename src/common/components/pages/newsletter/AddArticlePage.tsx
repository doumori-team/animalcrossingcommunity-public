import { Link, Params } from 'react-router';

import { RequirePermission } from '@behavior';
import EditNewsletterArticle from '@/components/newsletter/EditNewsletterArticle.tsx';
import { Header, Section } from '@layout';
import { APIThisType, NewsletterType, NewsletterArticleType } from '@types';
import { routerUtils } from '@utils';
import { Alert } from '@form';

export const action = routerUtils.formAction;

const AddNewsletterArticlePage = ({ loaderData, params }: { loaderData: AddNewsletterArticlePageProps, params: Params }) =>
{
	const { newsletter } = loaderData;
	const { type } = params;

	if (newsletter.published)
	{
		return (
			<Alert>
				This newsletter is published!
			</Alert>
		);
	}

	return (
		<div className='AddNewsletterArticlePage'>
			<RequirePermission permission='modify-newsletter'>
				<Header
					name='Newsletter'
					link={`/newsletter/${encodeURIComponent(newsletter.id)}`}
				/>

				<Section>
					<h3>What type of article is it?</h3>

					<div className='AddNewsletterArticlePage_links'>
						<Link
							to={`/newsletter/${newsletter.id}/add/text`}
							className='AddNewsletterArticlePage_text'
							aria-label='Text'
							preventScrollReset={true}
						>
							Text
						</Link>
						<Link
							to={`/newsletter/${newsletter.id}/add/quiz`}
							className='AddNewsletterArticlePage_quiz'
							aria-label='Quiz'
							preventScrollReset={true}
						>
							Quiz
						</Link>
						<Link
							to={`/newsletter/${newsletter.id}/add/silhouette`}
							className='AddNewsletterArticlePage_silhouette'
							aria-label='Silhouette'
							preventScrollReset={true}
						>
							Silhouette
						</Link>
					</div>
				</Section>

				{!!type &&
					<Section>
						<Alert>
							More configurable options - such as images - will become available once the article is created.
						</Alert>

						<EditNewsletterArticle
							key={newsletter.id}
							newsletterId={newsletter.id}
							type={type as NewsletterArticleType['type']}
						/>
					</Section>
				}
			</RequirePermission>
		</div>
	);
};

async function loadData(this: APIThisType, { id }: { id: string }): Promise<AddNewsletterArticlePageProps>
{
	const [newsletter] = await Promise.all([
		this.query('v1/newsletter', { id: id }),
	]);

	return { newsletter };
}

export const loader = routerUtils.wrapLoader(loadData);

type AddNewsletterArticlePageProps = {
	newsletter: NewsletterType
};

export default AddNewsletterArticlePage;
