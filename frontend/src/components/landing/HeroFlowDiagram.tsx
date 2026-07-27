import React, { useMemo } from 'react';
import { Box, Stack, Typography, alpha, keyframes, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
	ReactFlow,
	ReactFlowProvider,
	Handle,
	Position,
	BaseEdge,
	getBezierPath,
	MarkerType,
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

// Real sub-features per module (sourced from navigation.ts / AppRouter routes / the
// existing FeaturesSection.tsx copy). Trimmed to 3 per module — enough to read as
// "there's real depth here" inside a compact card without forcing the card wide enough
// to make five-across illegible.
const SUB_ITEMS: Record<string, string[]> = {
	crm: ['Companies', 'Leads', 'Deals'],
	projects: ['Boards', 'Tasks', 'Timelines'],
	timesheets: ['My Timesheet', 'Approvals', 'Reports'],
	hr: ['Employees', 'Departments', 'Leave Types'],
	booking: ['My Meetings', 'Team Meetings', 'Booking Page'],
};

// Evenly spread fan-in points along IRIS's top edge, in the same left-to-right order
// as the source row so curves never cross. Spread close to the full edge width (rather
// than clustering near center) to soften the convergence angle for the outer edges.
const HANDLE_OFFSETS = ['6%', '28%', '50%', '72%', '94%'];

// Non-uniform stagger so the five edges never look like synchronized clocks.
const EDGE_DELAYS_MS = [0, 90, 210, 140, 270];

// nodeIn/irisPulse/haloPulse below are only ever used inside MUI `sx` props (on real
// Box/Typography components), so emotion's normal sx pipeline picks them up correctly —
// no GlobalStyles needed for these.
const nodeIn = keyframes`
	from { opacity: 0; transform: scale(0.85); }
	to { opacity: 1; transform: scale(1); }
`;

const irisPulse = keyframes`
	0%, 100% { box-shadow: 0 14px 34px -10px var(--iris-glow, rgba(139,124,246,0.55)); transform: scale(1); }
	50% { box-shadow: 0 20px 48px -8px var(--iris-glow, rgba(139,124,246,0.55)); transform: scale(1.035); }
`;

const haloPulse = keyframes`
	0%, 100% { opacity: 0.55; transform: scale(0.92); }
	50% { opacity: 0.9; transform: scale(1.08); }
`;

type SourceNodeData = {
	label: string;
	icon: SvgIconComponent;
	color: string;
	delayMs: number;
	compact: boolean;
	subItems: string[];
};
type IrisNodeData = { reducedMotion: boolean; compact: boolean };

const SourceNode: React.FC<NodeProps<Node<SourceNodeData>>> = ({ data }) => {
	const theme = useTheme();
	const Icon = data.icon;
	const reduced = prefersReducedMotion();

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				gap: data.compact ? 0.5 : 0.85,
				width: data.compact ? 62 : 150,
				px: data.compact ? 0.75 : 1.5,
				py: data.compact ? 0.75 : 1.25,
				borderRadius: theme.layout.radius.card,
				border: `1px solid ${theme.palette.divider}`,
				bgcolor: theme.palette.background.paper,
				boxShadow: '0 2px 10px rgba(15, 23, 42, 0.06)',
				opacity: reduced ? 1 : 0,
				animation: reduced ? 'none' : `${nodeIn} 420ms ease-out ${data.delayMs}ms both`,
			}}
		>
			<Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
			<Stack
				direction={data.compact ? 'column' : 'row'}
				alignItems="center"
				spacing={data.compact ? 0.5 : 0.9}
				sx={{ textAlign: data.compact ? 'center' : 'left' }}
			>
				<Box
					sx={{
						width: data.compact ? 24 : 25,
						height: data.compact ? 24 : 25,
						flexShrink: 0,
						borderRadius: '50%',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						bgcolor: alpha(data.color, 0.14),
					}}
				>
					<Icon sx={{ fontSize: data.compact ? 13 : 14, color: data.color }} />
				</Box>
				<Typography
					sx={{
						fontSize: data.compact ? '0.58rem' : '0.78rem',
						fontWeight: 700,
						color: theme.palette.text.primary,
						lineHeight: 1.25,
						whiteSpace: 'normal',
					}}
				>
					{data.label}
				</Typography>
			</Stack>

			{!data.compact && (
				<Stack spacing={0.45} sx={{ mt: 0.15, pt: 0.85, borderTop: `1px solid ${theme.palette.divider}` }}>
					{data.subItems.map((item) => (
						<Stack key={item} direction="row" alignItems="center" spacing={0.65}>
							<Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: alpha(data.color, 0.8), flexShrink: 0 }} />
							<Typography
								noWrap
								sx={{ fontSize: '0.7rem', fontWeight: 500, color: theme.palette.text.secondary, lineHeight: 1.3 }}
							>
								{item}
							</Typography>
						</Stack>
					))}
				</Stack>
			)}
		</Box>
	);
};

const IrisNode: React.FC<NodeProps<Node<IrisNodeData>>> = ({ data }) => {
	const theme = useTheme();

	return (
		<Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
			{!data.reducedMotion && (
				<Box
					sx={{
						position: 'absolute',
						inset: -20,
						borderRadius: '50%',
						background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.35)} 0%, transparent 72%)`,
						filter: 'blur(6px)',
						animation: `${haloPulse} 3.4s ease-in-out 900ms infinite`,
						pointerEvents: 'none',
					}}
				/>
			)}
			<Box
				sx={{
					position: 'relative',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					gap: 1.35,
					px: data.compact ? 2.25 : 2.75,
					py: data.compact ? 1.75 : 2.1,
					width: data.compact ? 180 : 220,
					borderRadius: theme.layout.radius.card,
					background: theme.gradients.brandDiagonal,
					boxShadow: `0 14px 34px -10px ${alpha(theme.palette.primary.main, 0.55)}`,
					opacity: data.reducedMotion ? 1 : 0,
					'--iris-glow': alpha(theme.palette.primary.main, 0.55),
					animation: data.reducedMotion
						? 'none'
						: `${nodeIn} 480ms ease-out 380ms both, ${irisPulse} 3.4s ease-in-out 900ms infinite`,
				} as React.CSSProperties}
			>
				{SOURCE_MODULES.map((mod, i) => (
					<Handle
						key={mod.id}
						id={mod.id}
						type="target"
						position={Position.Top}
						style={{ opacity: 0, left: HANDLE_OFFSETS[i] }}
					/>
				))}
				<AutoAwesomeIcon sx={{ color: '#ffffff', flexShrink: 0, fontSize: data.compact ? 20 : 24 }} />
				<Box sx={{ minWidth: 0 }}>
					<Typography sx={{ fontWeight: 800, color: '#ffffff', lineHeight: 1.2, fontSize: data.compact ? '0.9rem' : '1rem' }}>
						IRIS
					</Typography>
					<Typography sx={{ fontSize: data.compact ? '0.65rem' : '0.72rem', color: alpha('#ffffff', 0.85), lineHeight: 1.3 }}>
						One AI, full cross-module context
					</Typography>
				</Box>
			</Box>
		</Box>
	);
};

type FlowEdgeData = { color: string; delayMs: number; reducedMotion: boolean; brandColor: string };

const FlowEdge: React.FC<EdgeProps<Edge<FlowEdgeData>>> = ({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
	markerEnd,
	data,
}) => {
	const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
	const color = data?.color ?? '#8B7CF6';
	const brandColor = data?.brandColor ?? '#8B7CF6';
	const delayMs = data?.delayMs ?? 0;
	const reduced = data?.reducedMotion ?? false;

	// Sanitise `id` so it's safe as both a CSS class name and @keyframes identifier.
	// ReactFlow edge IDs look like "crm-iris"; hyphens are valid in class names but
	// not in @keyframes names (they're parsed as a minus operator in some engines).
	const safeId = id.replace(/[^a-zA-Z0-9]/g, '_');
	const gradientId = `hfg_${safeId}`;
	const animName = `hfdraw_${safeId}`;
	const pathClass = `hfedge_${safeId}`;

	// A dash-length large enough to exceed any ReactFlow Bezier path. ReactFlow's
	// internal coordinate space is in the hundreds-to-low-thousands range before the
	// fitView scale is applied. 4000 covers all realistic layouts with headroom.
	const DASH = 4000;

	// Inject the @keyframes and class rule as a <style> element inside the SVG's own
	// <defs>. Styles placed there are scoped to the SVG document and apply without
	// any of the CSS cascade issues that occur when trying to animate SVG <path>
	// elements from an external stylesheet (e.g. via MUI GlobalStyles or emotion).
	const inlineCss = !reduced
		? `@keyframes ${animName}{from{stroke-dashoffset:${DASH}}to{stroke-dashoffset:0}}
.${pathClass}{stroke-dasharray:${DASH};stroke-dashoffset:${DASH};
  animation:${animName} 700ms cubic-bezier(.4,0,.2,1) ${delayMs}ms forwards;}`
		: '';

	return (
		<>
			<defs>
				<linearGradient
					id={gradientId}
					gradientUnits="userSpaceOnUse"
					x1={sourceX} y1={sourceY}
					x2={targetX} y2={targetY}
				>
					<stop offset="0%" stopColor={color} stopOpacity={0.9} />
					<stop offset="100%" stopColor={brandColor} stopOpacity={0.95} />
				</linearGradient>
				{!reduced && <style>{inlineCss}</style>}
			</defs>

			{/* Edge line — the CSS class above drives the draw-on animation */}
			<path
				className={reduced ? undefined : pathClass}
				d={edgePath}
				fill="none"
				stroke={`url(#${gradientId})`}
				strokeWidth={2}
				opacity={reduced ? 0.85 : 1}
			/>

			{/* Transparent BaseEdge just to render the arrowhead marker */}
			<BaseEdge
				id={id}
				path={edgePath}
				markerEnd={markerEnd}
				style={{ stroke: 'transparent', strokeWidth: 0 }}
			/>

			{/* Travelling particle: glow orb + white dot moving along the edge */}
			{!reduced && (
				<>
					<circle r={7} fill={color} opacity={0.35} style={{ filter: 'blur(1px)' }}>
						<animateMotion
							dur="1.8s"
							repeatCount="indefinite"
							path={edgePath}
							begin={`${delayMs + 500}ms`}
						/>
					</circle>
					<circle r={3.5} fill="#ffffff" stroke={color} strokeWidth={1.5}>
						<animateMotion
							dur="1.8s"
							repeatCount="indefinite"
							path={edgePath}
							begin={`${delayMs + 500}ms`}
						/>
					</circle>
				</>
			)}
		</>
	);
};

const nodeTypes = { sourceNode: SourceNode, irisNode: IrisNode };
const edgeTypes = { flowEdge: FlowEdge };

const buildFlow = (compact: boolean, reducedMotion: boolean, brandColor: string): { nodes: Node[]; edges: Edge[] } => {
	const cardW = compact ? 62 : 150;
	const colGap = compact ? 78 : 168;
	const irisW = compact ? 180 : 220;
	const approxCardH = compact ? 66 : 138;
	// Generous vertical run before IRIS: the bezier control points for a Bottom-source /
	// Top-target edge only offset vertically (never horizontally), so a wide row of five
	// converging into one narrow target needs real vertical room or the outer edges get a
	// flattened, wiggly "S" instead of a smooth funnel. This is what actually straightens them.
	const gapBelowCards = compact ? 110 : 150;

	const rowWidth = (SOURCE_MODULES.length - 1) * colGap + cardW;
	const rowCenterX = rowWidth / 2;

	const nodes: Node[] = SOURCE_MODULES.map((mod, i) => ({
		id: mod.id,
		type: 'sourceNode',
		position: { x: i * colGap, y: 0 },
		data: {
			label: mod.label,
			icon: mod.icon,
			color: mod.color,
			delayMs: EDGE_DELAYS_MS[i],
			compact,
			subItems: SUB_ITEMS[mod.id],
		},
		draggable: false,
		selectable: false,
	}));
	nodes.push({
		id: 'iris',
		type: 'irisNode',
		position: { x: rowCenterX - irisW / 2, y: approxCardH + gapBelowCards },
		data: { reducedMotion, compact },
		draggable: false,
		selectable: false,
	});

	const edges: Edge[] = SOURCE_MODULES.map((mod, i) => ({
		id: `${mod.id}-iris`,
		source: mod.id,
		target: 'iris',
		targetHandle: mod.id,
		type: 'flowEdge',
		data: { color: mod.color, delayMs: EDGE_DELAYS_MS[i], reducedMotion, brandColor },
		markerEnd: { type: MarkerType.ArrowClosed, color: mod.color, width: 16, height: 16 },
	}));

	return { nodes, edges };
};

/**
 * Decorative hero visual: five business tools (each showing its real sub-features)
 * converging into IRIS. Built with @xyflow/react but fully non-interactive — it's an
 * illustration, not a diagram editor.
 */
const HeroFlowDiagram: React.FC = () => {
	const theme = useTheme();
	const isCompact = useMediaQuery(theme.breakpoints.down('sm'));
	const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

	const { nodes, edges } = useMemo(
		() => buildFlow(isCompact, reducedMotion, theme.palette.primary.main),
		[isCompact, reducedMotion, theme.palette.primary.main],
	);

	return (
		<>
			<Box
				sx={{
					height: isCompact ? 280 : 400,
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
						fitViewOptions={{ padding: 0.18 }}
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
		</>
	);
};

export default HeroFlowDiagram;
