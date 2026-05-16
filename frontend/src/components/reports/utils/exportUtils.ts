import { format } from 'date-fns';

export const formatReportData = (data: any[], visibleColumns: string[], columns: any[], isTraining: boolean) => {
	return data.map(item => {
		const rowData: Record<string, any> = {};
		
		visibleColumns.forEach(virtColId => {
			const col = columns.find(ac => ac.id === virtColId);
			if (!col) return;

			let val: any = undefined;

			if (isTraining) {
				const allocation = item as any;
				if (virtColId === 'batch_name') val = allocation.batch?.batch_name;
				else if (virtColId === 'batch_status') val = allocation.batch?.status;
				else if (virtColId === 'domain') val = allocation.batch?.domain;
				else if (virtColId === 'training_mode') val = allocation.batch?.training_mode;
				else if (virtColId === 'courses') {
					if (Array.isArray(allocation.batch?.courses)) {
						val = allocation.batch.courses.map((c: any) => typeof c === 'string' ? c : c.name).join(', ');
					} else {
						val = '-';
					}
				}
				else if (virtColId === 'duration') {
					const dur = allocation.batch?.duration;
					let dateStr = '';
					if (allocation.batch?.start_date) {
						dateStr = format(new Date(allocation.batch.start_date), 'dd MMM yyyy');
						if (allocation.batch?.approx_close_date) {
							dateStr += ` to ${format(new Date(allocation.batch.approx_close_date), 'dd MMM yyyy')}`;
						}
					}

					if (dur && (dur.weeks || dur.days)) {
						val = `${dur.weeks || 0} weeks, ${dur.days || 0} days${dateStr ? ` (${dateStr})` : ''}`;
					} else {
						val = dateStr || '-';
					}
				}
				else if (virtColId === 'name') val = allocation.candidate?.name;
				else if (virtColId === 'gender') val = allocation.candidate?.gender;
				else if (virtColId === 'email') val = allocation.candidate?.email;
				else if (virtColId === 'phone') val = allocation.candidate?.phone;
				else if (virtColId === 'disability_type') val = allocation.candidate?.disability_details?.disability_type || allocation.candidate?.disability_details?.type;
				else if (virtColId === 'attendance_percentage') val = allocation.attendance_percentage !== null ? `${allocation.attendance_percentage}%` : '-';
				else if (virtColId === 'assessment_score') val = allocation.assessment_score !== null ? allocation.assessment_score : '-';
				else val = allocation[virtColId];
			} else {
				const c = item as any;
				if (virtColId.startsWith('screening_others.')) {
					const fieldName = virtColId.substring('screening_others.'.length);
					val = (c.screening?.others as any)?.[fieldName] ?? (c as any)[fieldName];
				} else if (virtColId.startsWith('counseling_others.')) {
					const fieldName = virtColId.substring('counseling_others.'.length);
					val = (c.counseling?.others as any)?.[fieldName] ?? (c as any)[fieldName];
				} else {
					val = (c as any)[virtColId];
					if (val === undefined || val === null) {
						if (col.group === 'screening' && c.screening) val = (c.screening as any)[virtColId];
						if ((val === undefined || val === null) && col.group === 'counseling' && c.counseling) val = (c.counseling as any)[virtColId];
					}
				}
			}

			if ((virtColId === 'created_at' || virtColId === 'dob' || virtColId === 'counseling_date' || virtColId === 'screening_date' || virtColId === 'screening_updated_at') && val) {
				try {
					val = format(new Date(val), 'dd MMM yyyy');
				} catch (e) {
					val = '-';
				}
			}

			if (Array.isArray(val)) {
				if (virtColId === 'skills') {
					val = val.map((s: any) => `${s.name} (${s.level})`).join(', ');
				} else if (virtColId === 'family_details') {
					val = val.map((f: any) => `${f.relation}: ${f.name} (${f.occupation || 'N/A'})`).join('; ');
				} else if (virtColId === 'questions') {
					val = val.map((q: any) => `Q: ${q.question} A: ${q.answer}`).join(' | ');
				} else if (virtColId === 'workexperience') {
					val = val.map((w: any) => `${w.job_title} at ${w.company}`).join(', ');
				} else if (virtColId === 'documents_uploaded') {
					val = val.join(', ');
				} else {
					val = val.map((v: any) => String(v)).join(', ');
				}
			} else if (typeof val === 'boolean') {
				val = val ? 'Yes' : 'No';
			} else if (val === null || val === undefined) {
				val = '';
			}

			rowData[col.label] = val;
		});

		return rowData;
	});
};
