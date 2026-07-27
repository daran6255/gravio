import React, { useMemo } from 'react';
import { Box, Typography, alpha, keyframes, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
	ReactFlow,
	ReactFlowProvider,
	Handle,
	Position,
	BaseEdge,
	getBezierPath,
	type NodeProps,
	type EdgeProps,
	type Node,
	type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
	AutoAwesome as AutoAwesomeIcon,
	Groups as GroupsIcon,
	AccountTree as AccountTreeIcon,
	Schedule as ScheduleIcon,
	Badge as BadgeIcon,
	CalendarMonth as CalendarMonthIcon,
	type SvgIconComponent,
} from '@mui/icons-material';

const prefersReducedMotion = () =>
	typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface SourceModule {
	id: string;
	label: string;
	icon: SvgIconComponent;
	color: string;
}

// Same five modules + colors as the bento grid below, so this visual reads as
// connected to it rather than introducing a new palette.
const SOURCE_MODULES: SourceModule[] = [
	{ id: 'crm', label: 'CRM', icon: GroupsIcon, color: '#8B7CF6' },
	{ id: 'projects', label: 'Projects', icon: AccountTreeIcon, color: '#4EA8FF' },
	{ id: 'timesheets', label: 'Timesheets', icon: ScheduleIcon, color: '#f59e0b' },
	{ id: 'hr', label: 'HR & Payroll', icon: BadgeIcon, color: '#10b981' },
	{ id: 'booking', label: 'Booking', icon: CalendarMonthIcon, color: '#ef4444' },
];

// Non-uniform stagger so the five edges never look like synchronized clocks.
const EDGE_DELAYS_MS = [0, 90, 210, 140, 270];

const nodeIn = keyframes`
	from { opacity: 0; transform: scale(0.8); }
	to { opacity: 1; transform: scale(1); }
`;

const irisPulse = keyframes`
	0%, 100% { box-shadow: 0 12px 30px -10px var(--iris-glow, rgba(139,124,246,0.5)); transform: scale(1); }
	50% { box-shadow: 0 18px 42px -8px var(--iris-glow, rgba(139,124,246,0.5)); transform: scale(1.03); }
`;

const edgeIn = keyframes`
	from { opacity: 0; }
	to { opacity: 1; }
`;

const flowDash = keyframes`
	from { stroke-dashoffset: 30; }
	to { stroke-dashoffset: 0; }
`;

type SourceNodeData = { label: string; icon: SvgIconComponent; color: string; delayMs: number; compact: boolean };
type IrisNodeData = { reducedMotion: boolean; compact: boolean };

const SourceNode: React.FC<NodeProps<Node<SourceNodeData>>> = ({ data }) => {
	const theme = useTheme();
	const Icon = data.icon;
	const reduced = prefersReducedMotion();

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: data.compact ? 'column' : 'row',
				alignItems: 'center',
				justifyContent: 'center',
				gap: data.compact ? 0.5 : 1.1,
				px: data.compact ? 0.75 : 1.75,
				py: data.compact ? 0.75 : 1,
				width: data.compact ? 66 : 168,
				borderRadius: data.compact ? theme.layout.radius.card : theme.layout.radius.pill,
				border: `1px solid ${theme.palette.divider}`,
				bgcolor: theme.palette.background.paper,
				boxShadow: '0 2px 10px rgba(15, 23, 42, 0.06)',
				textAlign: 'center',
				opacity: reduced ? 1 : 0,
				animation: reduced ? 'none' : `${nodeIn} 420ms ease-out ${data.delayMs}ms both`,
			}}
		>
			<Handle type="source" position={data.compact ? Position.Bottom : Position.Right} style={{ opacity: 0 }} />
			<Box
				sx={{
					width: data.compact ? 26 : 28,
					height: data.compact ? 26 : 28,
					flexShrink: 0,
					borderRadius: '50%',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					bgcolor: alpha(data.color, 0.14),
				}}
			>
				<Icon sx={{ fontSize: data.compact ? 14 : 16, color: data.color }} />
			</Box>
			<Typography
				sx={{
					fontSize: data.compact ? '0.58rem' : '0.8rem',
					fontWeight: 700,
					color: theme.palette.text.primary,
					lineHeight: 1.2,
					whiteSpace: data.compact ? 'normal' : 'nowrap',
				}}
			>
				{data.label}
			</Typography>
		</Box>
	);
};

const IrisNode: React.FC<NodeProps<Node<IrisNodeData>>> = ({ data }) => {
	const theme = useTheme();

	return (
		<Box
			sx={{
				position: 'relative',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				gap: 1.5,
				px: data.compact ? 2.25 : 3,
				py: data.compact ? 1.75 : 2.25,
				width: data.compact ? 190 : 220,
				borderRadius: theme.layout.radius.card,
				background: theme.gradients.brandDiagonal,
				boxShadow: `0 12px 30px -10px ${alpha(theme.palette.primary.main, 0.5)}`,
				opacity: data.reducedMotion ? 1 : 0,
				'--iris-glow': alpha(theme.palette.primary.main, 0.55),
				animation: data.reducedMotion
					? 'none'
					: `${nodeIn} 480ms ease-out 380ms both, ${irisPulse} 3.4s ease-in-out 900ms infinite`,
			} as React.CSSProperties}
		>
			<Handle type="target" position={data.compact ? Position.Top : Position.Left} style={{ opacity: 0 }} />
			<AutoAwesomeIcon sx={{ color: '#ffffff', flexShrink: 0 }} />
			<Box sx={{ minWidth: 0 }}>
				<Typography sx={{ fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>IRIS</Typography>
				<Typography sx={{ fontSize: '0.75rem', color: alpha('#ffffff', 0.85) }}>
					One AI, full cross-module context
				</Typography>
			</Box>
		</Box>
	);
};

type FlowEdgeData = { color: string; delayMs: number; reducedMotion: boolean };

const FlowEdge: React.FC<EdgeProps<Edge<FlowEdgeData>>> = ({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
	data,
}) => {
	const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
	const color = data?.color ?? '#8B7CF6';
	const delayMs = data?.delayMs ?? 0;
	const reduced = data?.reducedMotion ?? false;

	return (
		<>
			<BaseEdge id={id} path={edgePath} style={{ stroke: color, strokeWidth: 1.5, opacity: 0.18 }} />
			<path
				d={edgePath}
				fill="none"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeDasharray="6 9"
				style={{
					opacity: reduced ? 0.55 : 0,
					animation: reduced
						? 'none'
						: `${edgeIn} 380ms ease-out ${delayMs}ms both, ${flowDash} 1.05s linear ${delayMs}ms infinite`,
				}}
			/>
		</>
	);
};

const nodeTypes = { sourceNode: SourceNode, irisNode: IrisNode };
const edgeTypes = { flowEdge: FlowEdge };

const buildFlow = (compact: boolean, reducedMotion: boolean): { nodes: Node[]; edges: Edge[] } => {
	if (compact) {
		// Mobile: five compact nodes in a row up top, converging downward into IRIS.
		const rowGap = 82;
		const nodes: Node[] = SOURCE_MODULES.map((mod, i) => ({
			id: mod.id,
			type: 'sourceNode',
			position: { x: i * rowGap, y: 0 },
			data: { label: mod.label, icon: mod.icon, color: mod.color, delayMs: EDGE_DELAYS_MS[i], compact: true },
			draggable: false,
			selectable: false,
		}));
		nodes.push({
			id: 'iris',
			type: 'irisNode',
			position: { x: rowGap * 2 - 95 + 33, y: 150 },
			data: { reducedMotion, compact: true },
			draggable: false,
			selectable: false,
		});
		const edges: Edge[] = SOURCE_MODULES.map((mod, i) => ({
			id: `${mod.id}-iris`,
			source: mod.id,
			target: 'iris',
			type: 'flowEdge',
			data: { color: mod.color, delayMs: EDGE_DELAYS_MS[i], reducedMotion },
		}));
		return { nodes, edges };
	}

	// Desktop: five nodes stacked on the left, one IRIS node on the right.
	const colGap = 78;
	const nodes: Node[] = SOURCE_MODULES.map((mod, i) => ({
		id: mod.id,
		type: 'sourceNode',
		position: { x: 0, y: i * colGap },
		data: { label: mod.label, icon: mod.icon, color: mod.color, delayMs: EDGE_DELAYS_MS[i], compact: false },
		draggable: false,
		selectable: false,
	}));
	nodes.push({
		id: 'iris',
		type: 'irisNode',
		position: { x: 460, y: colGap * 2 - 22 },
		data: { reducedMotion, compact: false },
		draggable: false,
		selectable: false,
	});
	const edges: Edge[] = SOURCE_MODULES.map((mod, i) => ({
		id: `${mod.id}-iris`,
		source: mod.id,
		target: 'iris',
		type: 'flowEdge',
		data: { color: mod.color, delayMs: EDGE_DELAYS_MS[i], reducedMotion },
	}));
	return { nodes, edges };
};

/**
 * Decorative hero visual: five business tools converging into IRIS. Built with
 * @xyflow/react but fully non-interactive — it's an illustration, not a diagram editor.
 */
const HeroFlowDiagram: React.FC = () => {
	const theme = useTheme();
	const isCompact = useMediaQuery(theme.breakpoints.down('sm'));
	const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

	const { nodes, edges } = useMemo(() => buildFlow(isCompact, reducedMotion), [isCompact, reducedMotion]);

	return (
		<Box
			sx={{
				height: isCompact ? 300 : 340,
				width: '100%',
				// Neutralize xyflow's default light-theme chrome so this reads as a custom
				// illustration rather than an embedded diagram editor.
				'& .react-flow__pane': { cursor: 'default' },
				'& .react-flow__attribution': {
					background: 'transparent',
					fontSize: '0.6rem',
					opacity: 0.4,
				},
			}}
		>
			<ReactFlowProvider key={isCompact ? 'compact' : 'wide'}>
				<ReactFlow
					nodes={nodes}
					edges={edges}
					nodeTypes={nodeTypes}
					edgeTypes={edgeTypes}
					fitView
					fitViewOptions={{ padding: 0.2 }}
					proOptions={{ hideAttribution: true }}
					nodesDraggable={false}
					nodesConnectable={false}
					elementsSelectable={false}
					panOnDrag={false}
					zoomOnScroll={false}
					zoomOnPinch={false}
					zoomOnDoubleClick={false}
					preventScrolling={false}
				/>
			</ReactFlowProvider>
		</Box>
	);
};

export default HeroFlowDiagram;
