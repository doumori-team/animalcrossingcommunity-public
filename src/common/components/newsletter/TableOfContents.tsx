import { Link } from 'react-router';

import { NewsletterArticleType } from '@types';
import { ContentBox } from '@layout';

const TableOfContents = ({
	newsletterId,
	articles,
}: TableOfContentsProps) =>
{
	return (
		<section className='TableOfContents'>
			<ContentBox>
				<h3>In This Issue...</h3>

				{articles.length > 0 ?
					<ul>
						{articles.map(article =>
							<li className='TableOfContents_article' key={article.id}>
								<Link className='TableOfContents_articleTitle'
									to={`/newsletter/${encodeURIComponent(newsletterId)}/${encodeURIComponent(article.id)}`}
								>
									{article.title}
								</Link>
							</li>,
						)}
					</ul>
					:
					'No articles found.'
				}
			</ContentBox>
		</section>
	);
};

type TableOfContentsProps = {
	newsletterId: number
	articles: NewsletterArticleType[]
};

export default TableOfContents;
