import React from 'react';
import TrainingModuleLayout from '../../components/training/layout/TrainingModuleLayout';
import MockInterviewList from '../../components/training/mock-interview/MockInterviewList';

const MockInterviewPage: React.FC = () => {
	return (
		<TrainingModuleLayout
			title="Mock Interview Console"
			subtitle="Manage and monitor candidate interview readiness with enterprise-grade precision."
		>
			{({ selectedBatch, allocations }) => (
				<MockInterviewList batchId={selectedBatch.id} allocations={allocations} />
			)}
		</TrainingModuleLayout>
	);
};

export default MockInterviewPage;
