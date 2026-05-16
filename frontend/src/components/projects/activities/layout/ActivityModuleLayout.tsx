import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchProjects, fetchActivitiesForProject } from '../../../../store/slices/dsrSlice';
import type { DSRProject } from '../../../../models/dsr';
import ProjectSelectionHeader from '../common/ProjectSelectionHeader';
import { ProjectInfoBar } from '../../../common/header';
import ModuleLayout from '../../../common/layout';

interface ActivityModuleLayoutProps {
	title: string;
	subtitle: string;
	children: (props: { selectedProject: DSRProject; loading: boolean }) => React.ReactNode;
}

const ActivityModuleLayout: React.FC<ActivityModuleLayoutProps> = ({
	title,
	subtitle,
	children
}) => {
	const dispatch = useAppDispatch();
	const [searchParams, setSearchParams] = useSearchParams();

	const { projects, loading, activitiesByProject } = useAppSelector((state) => state.dsr);
	const [selectedProject, setSelectedProject] = useState<DSRProject | null>(null);

	const projectId = searchParams.get('projectId');

	useEffect(() => {
		dispatch(fetchProjects({ limit: 500, active_only: true }));
	}, [dispatch]);

	useEffect(() => {
		if (projects.length > 0) {
			if (projectId) {
				const project = projects.find(p => p.public_id === projectId);
				if (project) {
					setSelectedProject(project);
				} else {
					setSearchParams({});
				}
			}
		}
	}, [projects, projectId, setSearchParams]);

	// Fetch activities for the selected project to get stats
	useEffect(() => {
		if (selectedProject && !activitiesByProject[selectedProject.public_id]) {
			dispatch(fetchActivitiesForProject({ projectId: selectedProject.public_id }));
		}
	}, [selectedProject, activitiesByProject, dispatch]);

	// Calculate Stats for the Info Bar
	const projectStats = useMemo(() => {
		if (!selectedProject) return undefined;
		const activities = activitiesByProject[selectedProject.public_id] || [];
		if (activities.length === 0) return undefined;

		return {
			totalActivities: activities.length,
			completedActivities: activities.filter(a => a.status === 'completed').length,
			inProgressActivities: activities.filter(a => a.status === 'in_progress').length,
			totalActualHours: activities.reduce((sum, a) => sum + (a.total_actual_hours || 0), 0),
			totalEstimatedHours: activities.reduce((sum, a) => sum + (a.estimated_hours || 0), 0),
		};
	}, [selectedProject, activitiesByProject]);

	const handleProjectChange = (newValue: DSRProject | null) => {
		setSelectedProject(newValue);
		if (newValue) {
			setSearchParams({ projectId: newValue.public_id });
		} else {
			setSearchParams({});
		}
	};

	return (
		<ModuleLayout
			title={title}
			subtitle={subtitle}
			headerExtra={
				<ProjectSelectionHeader
					projects={projects}
					selectedProject={selectedProject}
					onProjectChange={handleProjectChange}
				/>
			}
			headerChildren={
				selectedProject && (
					<ProjectInfoBar 
						project={selectedProject} 
						stats={projectStats} 
					/>
				)
			}
			isEmpty={!selectedProject}
			emptyTitle="No Project Selected"
			emptyMessage="Please select an active project from the header to view and manage its activity planning."
			loading={loading}
		>
			{selectedProject && children({ selectedProject, loading })}
		</ModuleLayout>
	);
};

export default ActivityModuleLayout;
