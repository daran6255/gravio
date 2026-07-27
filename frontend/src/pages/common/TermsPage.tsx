import React from 'react';
import LegalPageLayout from '../../components/common/LegalPageLayout';
import termsAndConditionsContent from '../../data/termsAndConditionsContent';

const TermsPage: React.FC = () => (
	<LegalPageLayout
		pageTitle="Terms and Conditions | Gravit"
		metaDescription="The terms governing access to and use of Gravit — CRM, Projects, Timesheets & Billing, HR & Payroll, Meeting Booking, and the IRIS AI agent."
		content={termsAndConditionsContent}
	/>
);

export default TermsPage;
