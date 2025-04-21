import { RequireUser } from '@behavior';
import EditShop from '@/components/shop/EditShop.tsx';
import { Header, Section } from '@layout';
import { Alert } from '@form';
import { APIThisType, ACGameType } from '@types';
import { routerUtils } from '@utils';

export const action = routerUtils.formAction;

const AddShopPage = ({ loaderData }: { loaderData: AddShopPageProps }) =>
{
	const { acgames } = loaderData;

	return (
		<div className='AddShopPage'>
			<RequireUser permission='modify-shops'>
				<Header
					name='Shops'
					link='/shops'
				/>

				<Section>
					<Alert>
						More configurable options - such as services, roles and employees - will become available once the shop is created.
					</Alert>

					<EditShop
						acgames={acgames}
					/>
				</Section>
			</RequireUser>
		</div>
	);
};

async function loadData(this: APIThisType): Promise<AddShopPageProps>
{
	const [acgames] = await Promise.all([
		this.query('v1/acgames'),
	]);

	return { acgames };
}

export const loader = routerUtils.wrapLoader(loadData);

type AddShopPageProps = {
	acgames: ACGameType[]
};

export default AddShopPage;
