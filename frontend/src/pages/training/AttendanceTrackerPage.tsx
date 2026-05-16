import React from 'react';
import TrainingModuleLayout from '../../components/training/layout/TrainingModuleLayout';
import AttendanceTracker from '../../components/training/attendance/AttendanceTracker';

const AttendanceTrackerPage: React.FC = () => {
	return (
		<TrainingModuleLayout
			title="Attendance Tracker"
			subtitle="Manage and monitor daily attendance records with enterprise-grade precision."
		>
			{({ selectedBatch, allocations }) => (
				<AttendanceTracker batch={selectedBatch} allocations={allocations} />
			)}
		</TrainingModuleLayout>
	);
};

export default AttendanceTrackerPage;
