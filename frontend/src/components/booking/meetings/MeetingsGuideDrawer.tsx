import React from 'react';
import HelpGuideDrawer from '../../common/guide/HelpGuideDrawer';
import { MEETINGS_GUIDE_CONTENT } from '../../../data/meetingsGuideData';

interface MeetingsGuideDrawerProps {
	open: boolean;
	onClose: () => void;
}

export const MeetingsGuideDrawer: React.FC<MeetingsGuideDrawerProps> = ({ open, onClose }) => (
	<HelpGuideDrawer open={open} onClose={onClose} content={MEETINGS_GUIDE_CONTENT} />
);

export default MeetingsGuideDrawer;
