import { RequirePermission } from '@behavior';
import EditNewsletterArticle from '@/components/newsletter/EditNewsletterArticle.tsx';
import { Header, Section } from '@layout';
import { APIThisType, NewsletterArticleType } from '@types';
import { routerUtils } from '@utils';
import { Alert } from '@form';

export const action = routerUtils.formAction;

const EditNewsletterArticlePage = ({ loaderData }: { loaderData: EditNewsletterArticlePageProps }) =>
{
	const { article } = loaderData;

	if (article.published)
	{
		return (
			<Alert>
				This newsletter is published!
			</Alert>
		);
	}

	return (
		<div className='EditNewsletterArticlePage'>
			<RequirePermission permission='modify-newsletter'>
				<Header
					name='Newsletter'
					link={`/newsletter/${encodeURIComponent(article.newsletterId)}`}
				/>

				<Section>
					<EditNewsletterArticle
						key={article.id}
						newsletterId={article.newsletterId}
						type={article.type}
						article={article}
					/>
				</Section>
			</RequirePermission>
		</div>
	);
};

async function loadData(this: APIThisType, { articleId }: { articleId: string }): Promise<EditNewsletterArticlePageProps>
{
	const [article] = await Promise.all([
		this.query('v1/newsletter/article', { id: articleId }),
	]);

	return { article };
}

export const loader = routerUtils.wrapLoader(loadData);

type EditNewsletterArticlePageProps = {
	article: NewsletterArticleType
};

export default EditNewsletterArticlePage;
