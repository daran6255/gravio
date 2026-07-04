import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchProject, clearCurrentProject } from '../../../../store/slices/projectsSlice';

export const useProjectDetail = () => {
	const { publicId } = useParams<{ publicId: string }>();
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const { currentProject, currentProjectLoading, currentProjectError } = useAppSelector((state) => state.projects);

	useEffect(() => {
		if (publicId) dispatch(fetchProject(publicId));
		return () => {
			dispatch(clearCurrentProject());
		};
	}, [dispatch, publicId]);

	// Relative navigation (no leading slash) so it resolves under whichever base
	// is currently active (/projects or /org/:orgId/projects).
	const handleBack = () => navigate('..');

	return {
		project: currentProject,
		loading: currentProjectLoading,
		error: currentProjectError,
		handleBack,
	};
};

export default useProjectDetail;
