import React from 'react';
import HelpGuideDrawer from '../../../common/guide/HelpGuideDrawer';
import { DEALS_GUIDE_CONTENT } from '../../../../data/dealsGuideData';

interface DealsGuideDrawerProps {
	open: boolean;
	onClose: () => void;
}

export const DealsGuideDrawer: React.FC<DealsGuideDrawerProps> = ({ open, onClose }) => (
	<HelpGuideDrawer open={open} onClose={onClose} content={DEALS_GUIDE_CONTENT} />
);

export default DealsGuideDrawer;
