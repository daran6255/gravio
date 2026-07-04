import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchProject, updateProject, clearCurrentProject } from '../../../../store/slices/projectsSlice';
import { fetchOwners } from '../../../../store/slices/crmSlice';
import useToast from '../../../../hooks/useToast';
import type { ProjectUpdate } from '../../../../models/projects/project';

export const useProjectDetail = () => {
	const { publicId } = useParams<{ publicId: string }>();
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const location = useLocation();
	const toast = useToast();
	const { currentProject, currentProjectLoading, currentProjectError, projectMutating } = useAppSelector((state) => state.projects);
	const { owners } = useAppSelector((state) => state.crm);

	const [editOpen, setEditOpen] = useState(false);

	useEffect(() => {
		if (publicId) dispatch(fetchProject(publicId));
		return () => {
			dispatch(clearCurrentProject());
		};
	}, [dispatch, publicId]);

	useEffect(() => {
		dispatch(fetchOwners());
	}, [dispatch]);

	// `projects/:publicId` and `projects` are flat sibling routes (not nested), so
	// `navigate('..')` resolves against the route tree and lands on the layout's
	// own path ("/") instead of the projects list. Strip the trailing /:publicId
	// segment from the actual URL instead, which works under both /projects/:id
	// and /org/:orgId/projects/:id.
	const handleBack = () => navigate(location.pathname.replace(/\/[^/]+\/?$/, ''));

	const handleEditClick = () => setEditOpen(true);

	const handleEditSubmit = async (payload: ProjectUpdate) => {
		if (!publicId) return;
		try {
			await dispatch(updateProject({ publicId, payload })).unwrap();
			// The update response can come back with owner/company/deal names
			// unresolved (the repository's post-update refresh expires those
			// relationships), so re-fetch to get the fully enriched project.
			await dispatch(fetchProject(publicId));
			toast.success('Project updated');
			setEditOpen(false);
		} catch (err: any) {
			toast.error(err || 'Failed to update project');
		}
	};

	return {
		project: currentProject,
		loading: currentProjectLoading,
		error: currentProjectError,
		owners,
		editOpen,
		setEditOpen,
		projectMutating,
		handleBack,
		handleEditClick,
		handleEditSubmit,
	};
};

export default useProjectDetail;
