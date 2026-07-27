import React from 'react';
import LegalPageLayout from '../../components/common/LegalPageLayout';
import privacyPolicyContent from '../../data/privacyPolicyContent';

const PrivacyPolicyPage: React.FC = () => (
	<LegalPageLayout
		pageTitle="Privacy Policy | Gravit"
		metaDescription="How Gravit collects, uses, stores, and protects personal data across CRM, Projects, Timesheets, HR & Payroll, Booking, and the IRIS AI agent."
		content={privacyPolicyContent}
	/>
);

export default PrivacyPolicyPage;
