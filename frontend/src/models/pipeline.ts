/** Matches backend's CRMPipelineStageResponse exactly. */
export interface PipelineStage {
	id: number;
	pipeline_id: number;
	name: string;
	order: number;
	probability: number;
	color: string;
	is_won_stage: boolean;
	is_lost_stage: boolean;
	custom_fields?: Record<string, any>;
}

/** Matches backend's CRMPipelineResponse exactly. */
export interface Pipeline {
	id: number;
	name: string;
	is_default: boolean;
	custom_fields?: Record<string, any>;
	stages: PipelineStage[];
}
