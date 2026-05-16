import React from 'react';
import ModuleLayout from '../../../common/layout/ModuleLayout';

interface DSRModuleLayoutProps {
	title: string;
	subtitle: string;
	headerChildren?: React.ReactNode;
	children: (props: { loading: boolean }) => React.ReactNode;
}

/**
 * DSR Module Layout - Standardized Enterprise Outcome
 * uses the common ModuleLayout for consistency.
 */
const DSRModuleLayout: React.FC<DSRModuleLayoutProps> = ({
	title,
	subtitle,
	headerChildren,
	children
}) => {
	return (
		<ModuleLayout
			title={title}
			subtitle={subtitle}
			headerChildren={headerChildren}
		>
			{children({ loading: false })}
		</ModuleLayout>
	);
};

export default DSRModuleLayout;
