import { useContext } from 'react';
import { Link, useNavigate } from 'react-router';

import { RequireClientJS } from '@behavior';
import { utils } from '@utils';
import { Select, Alert } from '@form';
import { UserContext } from '@contexts';

/*
 * purpose: Gives the links that allows users to navigate pages of data.
 *
 * parameters:
 * 	page - number - current page
 * 	pageSize - number - total pages
 * 	totalCount - number - total amount of data
 * 	startLink - string - current url
 * 	endLink - string - an additional parameters
 * 	onPageChange - function - change the current page without changing route
 */
const Pagination = ({
	page,
	pageSize,
	totalCount,
	startLink,
	endLink = '',
	queryParam = true,
	onPageChange,
	pageName = 'page',
}: PaginationProps) =>
{
	const userContext = useContext(UserContext);
	const navigate = useNavigate();

	if (totalCount === 0)
	{
		return null;
	}

	if (!userContext)
	{
		return (
			<Alert type='info'>
				Interested in seeing more? <Link to='/sign-up' reloadDocument>Come join the community!</Link> ACC is suitable for all ages, does not track you, is ad-free with no required subscriptions and does not sell your information.
			</Alert>
		);
	}

	const lastPage = Math.ceil(totalCount / pageSize);

	let numbers = [], allNumbers = [];
	const sideNum = 3;
	const lowEnd = page <= sideNum ? 1 : page - sideNum;
	const highEnd = page === lastPage ? page :
		page + (lastPage - page < sideNum ? lastPage - page : sideNum);

	for (let i = lowEnd; i <= highEnd; i++)
	{
		numbers.push(i);
	}

	if (lastPage > sideNum + 1)
	{
		for (let i = 1; i <= lastPage; i++)
		{
			allNumbers.push({ value: i, label: i });
		}
	}

	let startPageLink = `?${pageName}=`;
	let endPageLink = '';

	if (!queryParam)
	{
		startPageLink = `/`;

		if (utils.realStringLength(endLink) > 0)
		{
			endPageLink = `?`;
		}
	}

	const changePage = (e: any): void =>
	{
		navigate(`/${startLink}${startPageLink}${encodeURIComponent(Number(e.target.value))}${endPageLink}${endLink}`);
	};

	return (
		<>
			<div className='Pagination'>
				{page > 1 && (
					onPageChange ?
						<button
							className='Pagination_first'
							type='button'
							onClick={() => onPageChange(1)}
						>
							First
						</button>
						:
						<Link to={`/${startLink}${startPageLink}1${endPageLink}${endLink}`}
							className='Pagination_first' reloadDocument
						>
							First
						</Link>

				)}
				{page > 2 && (
					onPageChange ?
						<button
							className='Pagination_previous'
							type='button'
							onClick={() => onPageChange(page - 1)}
						>
							Previous
						</button>
						:
						<Link to={`/${startLink}${startPageLink}${encodeURIComponent(page - 1)}${endPageLink}${endLink}`}
							className='Pagination_previous' reloadDocument
						>
							Previous
						</Link>

				)}
				{numbers.map(i =>
					onPageChange ?
						<button
							key={i}
							className={`Pagination_number ${i === page ? 'Pagination_currentNumber' : ''}`}
							type='button'
							onClick={() => onPageChange(i)}
						>
							{i}
						</button>
						:
						<Link key={i} to={`/${startLink}${startPageLink}${encodeURIComponent(i)}${endPageLink}${endLink}`}
							className={`Pagination_number ${i === page ? 'Pagination_currentNumber' : ''}`} reloadDocument
						>
							{i}
						</Link>
					,
				)}
				{page < lastPage - 1 && (
					onPageChange ?
						<button
							className='Pagination_next'
							type='button'
							onClick={() => onPageChange(page + 1)}
						>
							Next
						</button>
						:
						<Link to={`/${startLink}${startPageLink}${encodeURIComponent(page + 1)}${endPageLink}${endLink}`}
							className='Pagination_next' reloadDocument
						>
							Next
						</Link>

				)}
				{page < lastPage && (
					onPageChange ?
						<button
							className='Pagination_last'
							type='button'
							onClick={() => onPageChange(lastPage)}
						>
							Last
						</button>
						:
						<Link to={`/${startLink}${startPageLink}${encodeURIComponent(lastPage)}${endPageLink}${endLink}`}
							className='Pagination_last' reloadDocument
						>
							Last
						</Link>

				)}
			</div>
			{allNumbers.length > 0 &&
				<RequireClientJS>
					{onPageChange ?
						<div className='Pagination_dropdown'>
							<Select
								label='Pagination'
								hideLabels
								name='page'
								options={allNumbers}
								value={page}
								changeHandler={(e: any) => onPageChange(Number(e.target.value))}
							/>
						</div>
						:
						<div className='Pagination_dropdown'>
							<Select
								label='Pagination'
								hideLabels
								name='page'
								options={allNumbers}
								value={page}
								changeHandler={(e: any) => changePage(e)}
								key={page}
							/>
						</div>
					}
				</RequireClientJS>
			}
		</>
	);
};

type PaginationProps = {
	page: number
	pageSize: number
	totalCount: number
	startLink?: string
	endLink?: string
	queryParam?: boolean
	onPageChange?: (pageNumber: number) => void
	pageName?: string
};

export default Pagination;
