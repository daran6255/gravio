import React from 'react';
import TrainingModuleLayout from '../../components/training/layout/TrainingModuleLayout';
import AssignmentTracker from '../../components/training/assignment/AssignmentTracker';

const AssignmentMatrixPage: React.FC = () => {
	return (
		<TrainingModuleLayout
			title="Assignment Matrix"
			subtitle="Manage and monitor weekly assignment performance with enterprise-grade precision."
		>
			{({ selectedBatch, allocations }) => (
				<AssignmentTracker batch={selectedBatch} allocations={allocations} />
			)}
		</TrainingModuleLayout>
	);
};

export default AssignmentMatrixPage;
