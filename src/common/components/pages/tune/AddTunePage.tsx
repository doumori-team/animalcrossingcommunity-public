import { RequireUser } from '@behavior';
import EditTune from '@/components/tunes/EditTune.tsx';
import { Header, Section } from '@layout';
import { routerUtils } from '@utils';

export const action = routerUtils.formAction;

const AddTunePage = () =>
{
	return (
		<div className='AddTunePage'>
			<RequireUser permission='modify-tunes'>
				<Header name='Town Tunes' link='/town-tunes' />

				<Section>
					<EditTune />
				</Section>
			</RequireUser>
		</div>
	);
};

export default AddTunePage;
