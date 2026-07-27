import React from 'react';
import LegalPageLayout from '../../components/common/LegalPageLayout';
import cookiePolicyContent from '../../data/cookiePolicyContent';

const CookiePolicyPage: React.FC = () => (
	<LegalPageLayout
		pageTitle="Cookie Policy | Gravit"
		metaDescription="How Gravit uses cookies and similar tracking technologies, the categories we use, and how to manage your preferences."
		content={cookiePolicyContent}
	/>
);

export default CookiePolicyPage;
