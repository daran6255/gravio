import React from 'react';
import { Stack, Typography } from '@mui/material';
import { AccountTree as TreeIcon } from '@mui/icons-material';
import OrgTreeNode, { type OrgTreeNodeProps } from './OrgTreeNode';
import type { TeamMember } from '../../../models/user';

type SharedNodeProps = Omit<OrgTreeNodeProps, 'user' | 'depth'>;

interface OrgHierarchyTreeProps extends SharedNodeProps {
	roots: TeamMember[];
}

export const OrgHierarchyTree: React.FC<OrgHierarchyTreeProps> = ({ roots, searchTerm, subtreeMatchesSearch, ...rest }) => {
	const visibleRoots = roots.filter((r) => subtreeMatchesSearch(r, searchTerm));

	if (visibleRoots.length === 0) {
		return (
			<Stack alignItems="center" spacing={1.5} sx={{ py: 8 }}>
				<TreeIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
				<Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 320 }}>
					{searchTerm
						? 'No teammates match your search.'
						: 'No reporting hierarchy yet — drag someone from Unassigned onto a manager, or use a manager\'s menu to assign a report.'}
				</Typography>
			</Stack>
		);
	}

	return (
		<Stack spacing={1}>
			{visibleRoots.map((root) => (
				<OrgTreeNode
					key={root.public_id}
					user={root}
					depth={0}
					searchTerm={searchTerm}
					subtreeMatchesSearch={subtreeMatchesSearch}
					{...rest}
				/>
			))}
		</Stack>
	);
};

export default OrgHierarchyTree;
