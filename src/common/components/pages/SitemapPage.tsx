import SiteMenu from '@/components/layout/SiteMenu.tsx';
import { routerUtils } from '@utils';

export const action = routerUtils.formAction;

// This page is used to hold the main site menu if for some reason the dropdown
// doesn't work

const SitemapPage = () =>
{
	return (
		<SiteMenu />
	);
};

export default SitemapPage;
