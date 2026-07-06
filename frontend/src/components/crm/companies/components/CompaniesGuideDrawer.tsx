import React from 'react';
import HelpGuideDrawer from '../../../common/guide/HelpGuideDrawer';
import { COMPANIES_GUIDE_CONTENT } from '../../../../data/companiesGuideData';

interface CompaniesGuideDrawerProps {
	open: boolean;
	onClose: () => void;
}

export const CompaniesGuideDrawer: React.FC<CompaniesGuideDrawerProps> = ({ open, onClose }) => (
	<HelpGuideDrawer open={open} onClose={onClose} content={COMPANIES_GUIDE_CONTENT} />
);

export default CompaniesGuideDrawer;
