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

/** Matches backend's CRMPipelineStageCreate — used both standalone and nested in CRMPipelineCreate. */
export interface PipelineStageCreate {
	name: string;
	order?: number;
	probability?: number;
	color?: string;
	is_won_stage?: boolean;
	is_lost_stage?: boolean;
	custom_fields?: Record<string, any>;
}

/** Matches backend's CRMPipelineCreate. */
export interface PipelineCreate {
	name: string;
	is_default?: boolean;
	custom_fields?: Record<string, any>;
	stages: PipelineStageCreate[];
}

/** Matches backend's CRMPipelineStageUpsert — omit `id` to create a new stage;
 * any existing stage whose id is not present in the request is deleted. */
export interface PipelineStageUpsert extends PipelineStageCreate {
	id?: number;
}
