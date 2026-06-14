import { Link } from 'react-router';

import { RequirePermission } from '@behavior';
import { Header, Section } from '@layout';
import { APIThisType, NewsletterType } from '@types';
import { routerUtils } from '@utils';

export const action = routerUtils.formAction;

const NewslettersPage = ({ loaderData }: { loaderData: NewslettersPageProps }) =>
{
	const { newsletters } = loaderData;

	return (
		<div className='NewslettersPage'>
			<RequirePermission permission='view-newsletter'>
				<Header
					name='Newsletters'
					links={
						<RequirePermission permission='modify-newsletter' silent>
							<Link to={`/newsletters/add`}>
								Add Newsletter
							</Link>
						</RequirePermission>
					}
				/>

				<Section>
					{newsletters.length > 0 ?
						newsletters.map(newsletter =>
							<div className='NewslettersPage_issueContainer' key={newsletter.id}>
								<h1>Issue {newsletter.issue}</h1>
								<div
									className='NewslettersPage_issue'
									style={{
										background: `url(${newsletter.header}) top center / contain`,
									}}
								>
									<footer>
										{newsletter.pdfOnly && newsletter.pdfDownload ?
											<a href={newsletter.pdfDownload} download={`ACC Newsletter - Issue ${newsletter.issue} - ${newsletter.formattedIssueDate}.pdf`}>Download</a>
											:
											<Link to={`/newsletter/${encodeURIComponent(newsletter.id)}`}>
												View
											</Link>
										}
									</footer>
								</div>
							</div>,
						)
						:
						'No newsletters found.'
					}
				</Section>
			</RequirePermission>
		</div>
	);
};

async function loadData(this: APIThisType): Promise<NewslettersPageProps>
{
	const [newsletters] = await Promise.all([
		this.query('v1/newsletters'),
	]);

	return { newsletters };
}

export const loader = routerUtils.wrapLoader(loadData);

type NewslettersPageProps = {
	newsletters: NewsletterType[]
};

export default NewslettersPage;
