import React from 'react';
import HelpGuideDrawer from '../../../common/guide/HelpGuideDrawer';
import { LEADS_GUIDE_CONTENT } from '../../../../data/leadsGuideData';

interface LeadsGuideDrawerProps {
	open: boolean;
	onClose: () => void;
}

export const LeadsGuideDrawer: React.FC<LeadsGuideDrawerProps> = ({ open, onClose }) => (
	<HelpGuideDrawer open={open} onClose={onClose} content={LEADS_GUIDE_CONTENT} />
);

export default LeadsGuideDrawer;
