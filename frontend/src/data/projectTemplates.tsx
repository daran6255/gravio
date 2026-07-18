import React from 'react';
import {
	Code,
	Construction,
	LocalPharmacy,
	PrecisionManufacturing,
	Campaign,
	TrendingUp,
	People
} from '@mui/icons-material';

export interface TemplateSubtask {
	title: string;
	description: string;
	start_offset_days?: number;
	due_offset_days?: number;
	priority?: string;
	tags?: { name: string; color: string }[];
}

export interface TemplateTask {
	title: string;
	description: string;
	start_offset_days?: number;
	due_offset_days?: number;
	priority?: string;
	tags?: { name: string; color: string }[];
	milestone?: { name: string; color: string };
	subtasks?: TemplateSubtask[];
}

export interface ProjectTemplate {
	key: string;
	name: string;
	description: string;
	tasks: TemplateTask[];
}

export interface Category {
	name: string;
	icon: React.ReactNode;
	templates: ProjectTemplate[];
}

export const TEMPLATE_CATEGORIES: Category[] = [
	{
		name: 'Software',
		icon: <Code />,
		templates: [
			{
				key: 'software_development',
				name: 'Software Development',
				description: 'Standard Agile software development lifecycle phases.',
				tasks: [
					{
						title: 'Requirements Analysis',
						description: 'Gather and document functional and non-functional requirements.',
						start_offset_days: 0,
						due_offset_days: 5,
						priority: 'high',
						tags: [{ name: 'analysis', color: '#4EA8FF' }, { name: 'planning', color: '#8B7CF6' }],
						milestone: { name: 'Requirements Sign-Off', color: '#9C27B0' },
						subtasks: [
							{ title: 'Stakeholder Interviews', description: 'Conduct interviews with key stakeholders.', start_offset_days: 0, due_offset_days: 2, priority: 'medium', tags: [{ name: 'interview', color: '#10B981' }] },
							{ title: 'Draft PRD Document', description: 'Create first draft of Product Requirement Document (PRD).', start_offset_days: 2, due_offset_days: 4, priority: 'high', tags: [{ name: 'documentation', color: '#F59E0B' }] },
							{ title: 'Requirements Review', description: 'Get formal review and approval from stakeholders.', start_offset_days: 4, due_offset_days: 5, priority: 'high', tags: [{ name: 'review', color: '#EF4444' }] }
						]
					},
					{
						title: 'Architecture & System Design',
						description: 'Design system architecture, database schema, and component diagrams.',
						start_offset_days: 5,
						due_offset_days: 10,
						priority: 'high',
						tags: [{ name: 'design', color: '#EC4899' }],
						milestone: { name: 'Architecture Approved', color: '#9C27B0' },
						subtasks: [
							{ title: 'Database Schema Design', description: 'Draft tables, relationships, and index layout.', start_offset_days: 5, due_offset_days: 7, priority: 'high', tags: [{ name: 'database', color: '#64748B' }] },
							{ title: 'API Contract Specifications', description: 'Define API endpoints and request/response payloads.', start_offset_days: 7, due_offset_days: 9, priority: 'medium', tags: [{ name: 'API', color: '#4EA8FF' }] },
							{ title: 'Architecture Review Board', description: 'Present system design to internal engineering board.', start_offset_days: 9, due_offset_days: 10, priority: 'medium', tags: [{ name: 'design', color: '#EC4899' }] }
						]
					},
					{
						title: 'Sprint Planning',
						description: 'Define sprint scope, estimate task effort, and assign initial tasks.',
						start_offset_days: 10,
						due_offset_days: 12,
						priority: 'medium',
						tags: [{ name: 'agile', color: '#10B981' }],
						subtasks: [
							{ title: 'Backlog Grooming', description: 'Review and prioritize user stories.', start_offset_days: 10, due_offset_days: 11, priority: 'medium', tags: [{ name: 'backlog', color: '#64748B' }] },
							{ title: 'Sprint Goal Definition', description: 'Define sprint theme and deliverables.', start_offset_days: 11, due_offset_days: 12, priority: 'low', tags: [{ name: 'sprint', color: '#8B7CF6' }] }
						]
					},
					{
						title: 'Development Phase',
						description: 'Build backend APIs and implement frontend user interfaces.',
						start_offset_days: 12,
						due_offset_days: 30,
						priority: 'high',
						tags: [{ name: 'development', color: '#8B7CF6' }],
						milestone: { name: 'Code Freeze', color: '#EF4444' },
						subtasks: [
							{ title: 'Backend API Implementation', description: 'Implement controllers, repository queries, and service layers.', start_offset_days: 12, due_offset_days: 25, priority: 'high', tags: [{ name: 'backend', color: '#4EA8FF' }] },
							{ title: 'Frontend UI Integration', description: 'Implement responsive layouts and bind with APIs.', start_offset_days: 15, due_offset_days: 28, priority: 'high', tags: [{ name: 'frontend', color: '#EC4899' }] },
							{ title: 'Code Review & Merging', description: 'Review pull requests and resolve merge conflicts.', start_offset_days: 28, due_offset_days: 30, priority: 'medium', tags: [{ name: 'review', color: '#EF4444' }] }
						]
					},
					{
						title: 'QA Testing & Bug Fixing',
						description: 'Perform unit testing, integration testing, and bug resolution.',
						start_offset_days: 30,
						due_offset_days: 37,
						priority: 'high',
						tags: [{ name: 'QA', color: '#EF4444' }],
						milestone: { name: 'Release Ready', color: '#10B981' },
						subtasks: [
							{ title: 'Unit & Integration Tests', description: 'Run test suites and measure coverage metrics.', start_offset_days: 30, due_offset_days: 33, priority: 'medium', tags: [{ name: 'testing', color: '#10B981' }] },
							{ title: 'Bug Verification & Hotfixes', description: 'Re-test reported issues and deploy fixes.', start_offset_days: 33, due_offset_days: 37, priority: 'high', tags: [{ name: 'bugs', color: '#EF4444' }] }
						]
					},
					{
						title: 'Deployment & DevOps',
						description: 'Setup CI/CD pipelines and deploy to staging and production environments.',
						start_offset_days: 37,
						due_offset_days: 40,
						priority: 'high',
						tags: [{ name: 'devops', color: '#64748B' }],
						subtasks: [
							{ title: 'CI/CD Pipeline Setup', description: 'Configure GitHub Actions or AWS CodePipeline yaml scripts.', start_offset_days: 37, due_offset_days: 39, priority: 'medium', tags: [{ name: 'pipeline', color: '#64748B' }] },
							{ title: 'Production Deployment', description: 'Run migration scripts, deploy container, and check server status.', start_offset_days: 39, due_offset_days: 40, priority: 'high', tags: [{ name: 'launch', color: '#10B981' }] }
						]
					},
					{
						title: 'User Acceptance Testing (UAT)',
						description: 'Facilitate testing by business stakeholders and gather feedback.',
						start_offset_days: 40,
						due_offset_days: 45,
						priority: 'high',
						tags: [{ name: 'client', color: '#F59E0B' }],
						milestone: { name: 'Client Handover', color: '#9C27B0' },
						subtasks: [
							{ title: 'UAT Feedback Collection', description: 'Deliver system to clients and record feedback.', start_offset_days: 40, due_offset_days: 43, priority: 'medium', tags: [{ name: 'feedback', color: '#4EA8FF' }] },
							{ title: 'Final Client Sign-off', description: 'Secure formal project handover approval.', start_offset_days: 43, due_offset_days: 45, priority: 'high', tags: [{ name: 'approval', color: '#10B981' }] }
						]
					},
					{
						title: 'Launch & Post-Release Support',
						description: 'Deploy final release, monitor systems, and address critical issues.',
						start_offset_days: 45,
						due_offset_days: 52,
						priority: 'medium',
						tags: [{ name: 'operations', color: '#10B981' }],
						subtasks: [
							{ title: 'System Performance Monitoring', description: 'Monitor server load, response time, and errors.', start_offset_days: 45, due_offset_days: 48, priority: 'low', tags: [{ name: 'monitoring', color: '#64748B' }] },
							{ title: 'Post-Release Bug Triage', description: 'Support users and resolve high priority launch issues.', start_offset_days: 48, due_offset_days: 52, priority: 'medium', tags: [{ name: 'support', color: '#F59E0B' }] }
						]
					}
				]
			},
			{
				key: 'product_launch',
				name: 'Product Launch Plan',
				description: 'Steps to launch a new product or feature to the market.',
				tasks: [
					{
						title: 'Market Research & Competitor Analysis',
						description: 'Analyze target market and competitor positioning.',
						start_offset_days: 0,
						due_offset_days: 7,
						priority: 'medium',
						tags: [{ name: 'research', color: '#4EA8FF' }],
						milestone: { name: 'Market Strategy Ready', color: '#9C27B0' },
						subtasks: [
							{ title: 'Competitor Feature Audit', description: 'Analyze competing software modules and pricing.', start_offset_days: 0, due_offset_days: 4, priority: 'low', tags: [{ name: 'audit', color: '#64748B' }] },
							{ title: 'Customer Demographics Survey', description: 'Identify target persona profile criteria.', start_offset_days: 4, due_offset_days: 7, priority: 'medium', tags: [{ name: 'survey', color: '#8B7CF6' }] }
						]
					},
					{
						title: 'Define Value Proposition & Pricing',
						description: 'Establish key messaging, pricing tiers, and licensing models.',
						start_offset_days: 7,
						due_offset_days: 12,
						priority: 'high',
						tags: [{ name: 'business', color: '#F59E0B' }],
						subtasks: [
							{ title: 'Draft Pricing Tiers', description: 'Establish monthly subscription costs and margins.', start_offset_days: 7, due_offset_days: 10, priority: 'medium', tags: [{ name: 'pricing', color: '#10B981' }] },
							{ title: 'Value Prop Messaging Deck', description: 'Define product slogans and sales pitches.', start_offset_days: 10, due_offset_days: 12, priority: 'high', tags: [{ name: 'strategy', color: '#8B7CF6' }] }
						]
					},
					{
						title: 'Marketing Collateral Creation',
						description: 'Design landing pages, banners, write copy, and create documentation.',
						start_offset_days: 12,
						due_offset_days: 22,
						priority: 'high',
						tags: [{ name: 'marketing', color: '#EC4899' }],
						milestone: { name: 'Collateral Ready', color: '#9C27B0' },
						subtasks: [
							{ title: 'Landing Page Design', description: 'Design layouts and wireframes.', start_offset_days: 12, due_offset_days: 17, priority: 'medium', tags: [{ name: 'design', color: '#EC4899' }] },
							{ title: 'Create Product One-Pager', description: 'Summarize product key metrics for distribution.', start_offset_days: 17, due_offset_days: 20, priority: 'low', tags: [{ name: 'content', color: '#64748B' }] },
							{ title: 'Write Launch Blog Post', description: 'Write and review product announcement article.', start_offset_days: 20, due_offset_days: 22, priority: 'low', tags: [{ name: 'copywriting', color: '#4EA8FF' }] }
						]
					},
					{
						title: 'Sales Enablement & Training',
						description: 'Train sales teams on product features and handle objections.',
						start_offset_days: 22,
						due_offset_days: 26,
						priority: 'medium',
						tags: [{ name: 'sales', color: '#F59E0B' }],
						subtasks: [
							{ title: 'Train Reps on Product Features', description: 'Demonstrate dashboard and tools to sales teams.', start_offset_days: 22, due_offset_days: 24, priority: 'medium', tags: [{ name: 'training', color: '#8B7CF6' }] },
							{ title: 'Prepare FAQ and Objection Sheet', description: 'List common queries and responses.', start_offset_days: 24, due_offset_days: 26, priority: 'high', tags: [{ name: 'documentation', color: '#EF4444' }] }
						]
					},
					{
						title: 'Beta Program Launch',
						description: 'Release product to beta testers and collect early feedback.',
						start_offset_days: 26,
						due_offset_days: 36,
						priority: 'high',
						tags: [{ name: 'beta', color: '#4EA8FF' }],
						milestone: { name: 'Beta Feedback Review', color: '#EF4444' },
						subtasks: [
							{ title: 'Onboard Beta Customers', description: 'Invite users and configure trial environments.', start_offset_days: 26, due_offset_days: 28, priority: 'high', tags: [{ name: 'onboarding', color: '#10B981' }] },
							{ title: 'Compile Beta Test Reports', description: 'Identify critical bugs from user tests.', start_offset_days: 28, due_offset_days: 36, priority: 'medium', tags: [{ name: 'testing', color: '#EF4444' }] }
						]
					},
					{
						title: 'Press Release & Media Outreach',
						description: 'Draft PR and contact journalists/influencers.',
						start_offset_days: 36,
						due_offset_days: 40,
						priority: 'medium',
						tags: [{ name: 'PR', color: '#EC4899' }],
						subtasks: [
							{ title: 'Draft Press Release', description: 'Write launch story for distribution.', start_offset_days: 36, due_offset_days: 38, priority: 'medium', tags: [{ name: 'copywriting', color: '#64748B' }] },
							{ title: 'Media Outreach Campaign', description: 'Email tech reporters and publish PR statement.', start_offset_days: 38, due_offset_days: 40, priority: 'high', tags: [{ name: 'media', color: '#4EA8FF' }] }
						]
					},
					{
						title: 'Public Launch & Analytics Tracking',
						description: 'Go live, launch campaign, and monitor traffic and signups.',
						start_offset_days: 40,
						due_offset_days: 45,
						priority: 'high',
						tags: [{ name: 'launch', color: '#10B981' }],
						milestone: { name: 'Product Live', color: '#10B981' },
						subtasks: [
							{ title: 'Launch Campaign Broadcast', description: 'Publish live announcement to all channels.', start_offset_days: 40, due_offset_days: 41, priority: 'high', tags: [{ name: 'broadcast', color: '#EF4444' }] },
							{ title: 'Monitor Analytics & Conversions', description: 'Track signups, active users, and billing conversions.', start_offset_days: 41, due_offset_days: 45, priority: 'medium', tags: [{ name: 'monitoring', color: '#64748B' }] }
						]
					}
				]
			},
			{
				key: 'website_development',
				name: 'Website Development',
				description: 'Standard process for building and launching a corporate website.',
				tasks: [
					{
						title: 'UI/UX Wireframing & Design',
						description: 'Create layouts, wireframes, and design mockups for approval.',
						start_offset_days: 0,
						due_offset_days: 6,
						priority: 'high',
						tags: [{ name: 'design', color: '#EC4899' }],
						milestone: { name: 'Design Sign-Off', color: '#9C27B0' },
						subtasks: [
							{ title: 'Home Page Layout Options', description: 'Create three homepage layouts.', start_offset_days: 0, due_offset_days: 3, priority: 'medium', tags: [{ name: 'wireframes', color: '#64748B' }] },
							{ title: 'Style Guide & Elements Design', description: 'Establish buttons, fonts, and system color guidelines.', start_offset_days: 3, due_offset_days: 5, priority: 'low', tags: [{ name: 'branding', color: '#8B7CF6' }] },
							{ title: 'Final Design Revision', description: 'Apply feedback to chosen homepage option.', start_offset_days: 5, due_offset_days: 6, priority: 'high', tags: [{ name: 'design', color: '#EC4899' }] }
						]
					},
					{
						title: 'Content Gathering & Copywriting',
						description: 'Collect images, write body copy, and organize site structure.',
						start_offset_days: 6,
						due_offset_days: 12,
						priority: 'medium',
						tags: [{ name: 'content', color: '#4EA8FF' }],
						subtasks: [
							{ title: 'Gather Brand Assets & Images', description: 'Collect photos, icons, and illustrations.', start_offset_days: 6, due_offset_days: 9, priority: 'low', tags: [{ name: 'assets', color: '#64748B' }] },
							{ title: 'Write Website Copy', description: 'Write home page and about section copy.', start_offset_days: 9, due_offset_days: 12, priority: 'medium', tags: [{ name: 'copywriting', color: '#4EA8FF' }] }
						]
					},
					{
						title: 'HTML/CSS Implementation',
						description: 'Build responsive frontend templates matching designs.',
						start_offset_days: 12,
						due_offset_days: 20,
						priority: 'high',
						tags: [{ name: 'development', color: '#8B7CF6' }],
						subtasks: [
							{ title: 'Setup Boilerplate & Grid', description: 'Initiate project repository and styling setup.', start_offset_days: 12, due_offset_days: 14, priority: 'medium', tags: [{ name: 'setup', color: '#64748B' }] },
							{ title: 'Responsive Page Coding', description: 'Write HTML and CSS matching designs.', start_offset_days: 14, due_offset_days: 20, priority: 'high', tags: [{ name: 'coding', color: '#8B7CF6' }] }
						]
					},
					{
						title: 'CMS Integration',
						description: 'Configure WordPress, Webflow, or headless CMS.',
						start_offset_days: 20,
						due_offset_days: 26,
						priority: 'medium',
						tags: [{ name: 'development', color: '#8B7CF6' }],
						milestone: { name: 'CMS Configured', color: '#10B981' },
						subtasks: [
							{ title: 'Setup CMS Database', description: 'Configure tables, posts, and page templates.', start_offset_days: 20, due_offset_days: 23, priority: 'medium', tags: [{ name: 'database', color: '#64748B' }] },
							{ title: 'Bind CMS with Frontend', description: 'Connect frontend templates with CMS endpoints.', start_offset_days: 23, due_offset_days: 26, priority: 'high', tags: [{ name: 'integration', color: '#4EA8FF' }] }
						]
					},
					{
						title: 'SEO Optimization',
						description: 'Setup meta tags, robots.txt, sitemaps, and optimize page load speed.',
						start_offset_days: 26,
						due_offset_days: 29,
						priority: 'medium',
						tags: [{ name: 'SEO', color: '#10B981' }],
						subtasks: [
							{ title: 'Add Meta Tags & Titles', description: 'Configure titles and page descriptions.', start_offset_days: 26, due_offset_days: 28, priority: 'medium', tags: [{ name: 'SEO', color: '#10B981' }] },
							{ title: 'Sitemap & Robots Setup', description: 'Generate XML sitemaps and configure rules.', start_offset_days: 28, due_offset_days: 29, priority: 'low', tags: [{ name: 'setup', color: '#64748B' }] }
						]
					},
					{
						title: 'Cross-browser Testing & QA',
						description: 'Test forms, links, responsiveness, and performance across browsers.',
						start_offset_days: 29,
						due_offset_days: 32,
						priority: 'high',
						tags: [{ name: 'testing', color: '#EF4444' }],
						subtasks: [
							{ title: 'Test Forms & Link Validations', description: 'Verify form inputs work.', start_offset_days: 29, due_offset_days: 31, priority: 'high', tags: [{ name: 'forms', color: '#EF4444' }] },
							{ title: 'Browser Responsiveness Test', description: 'Check layout in Safari, Chrome, and Mobile views.', start_offset_days: 31, due_offset_days: 32, priority: 'medium', tags: [{ name: 'layout', color: '#8B7CF6' }] }
						]
					},
					{
						title: 'Launch & DNS Configuration',
						description: 'Point domain to production server, configure SSL, and verify go-live.',
						start_offset_days: 32,
						due_offset_days: 35,
						priority: 'high',
						tags: [{ name: 'launch', color: '#10B981' }],
						milestone: { name: 'Website Launch', color: '#10B981' },
						subtasks: [
							{ title: 'DNS Configuration', description: 'Configure DNS records pointing to server.', start_offset_days: 32, due_offset_days: 34, priority: 'high', tags: [{ name: 'dns', color: '#64748B' }] },
							{ title: 'Install SSL Certificate', description: 'Configure SSL encryption for domain.', start_offset_days: 34, due_offset_days: 35, priority: 'high', tags: [{ name: 'security', color: '#8B7CF6' }] }
						]
					}
				]
			},
			{
				key: 'it_support',
				name: 'IT Support Project',
				description: 'Setting up internal or customer-facing IT service desk support.',
				tasks: [
					{
						title: 'Service Desk Tool Selection',
						description: 'Evaluate and choose support ticketing software.',
						start_offset_days: 0,
						due_offset_days: 5,
						priority: 'medium',
						tags: [{ name: 'evaluation', color: '#4EA8FF' }],
						milestone: { name: 'Tool Selected', color: '#9C27B0' },
						subtasks: [
							{ title: 'Research Ticketing Tools', description: 'Compare Jira, Zendesk, and Freshdesk.', start_offset_days: 0, due_offset_days: 3, priority: 'low', tags: [{ name: 'research', color: '#64748B' }] },
							{ title: 'Request Tool Trial', description: 'Configure demo systems to evaluate usability.', start_offset_days: 3, due_offset_days: 5, priority: 'medium', tags: [{ name: 'testing', color: '#8B7CF6' }] }
						]
					},
					{
						title: 'SLA & Priority Definitions',
						description: 'Define ticket priority levels, response times, and resolution targets.',
						start_offset_days: 5,
						due_offset_days: 10,
						priority: 'high',
						tags: [{ name: 'SLA', color: '#EF4444' }],
						subtasks: [
							{ title: 'Draft Service Levels Agreement', description: 'Establish response limits.', start_offset_days: 5, due_offset_days: 8, priority: 'high', tags: [{ name: 'documentation', color: '#64748B' }] },
							{ title: 'Define Ticket Priority Levels', description: 'Establish definitions for Urgent, High, and Medium.', start_offset_days: 8, due_offset_days: 10, priority: 'medium', tags: [{ name: 'definitions', color: '#EF4444' }] }
						]
					},
					{
						title: 'Knowledge Base Creation',
						description: 'Draft articles for self-service portal.',
						start_offset_days: 10,
						due_offset_days: 20,
						priority: 'low',
						tags: [{ name: 'content', color: '#4EA8FF' }],
						subtasks: [
							{ title: 'Draft FAQ Articles', description: 'Write instructions for password resets.', start_offset_days: 10, due_offset_days: 15, priority: 'low', tags: [{ name: 'FAQs', color: '#64748B' }] },
							{ title: 'Write Troubleshooting Guides', description: 'Document basic hardware connection issues.', start_offset_days: 15, due_offset_days: 20, priority: 'low', tags: [{ name: 'technical', color: '#8B7CF6' }] }
						]
					},
					{
						title: 'Ticketing System Integration',
						description: 'Setup support email channels, custom fields, and ticket assignment workflows.',
						start_offset_days: 20,
						due_offset_days: 27,
						priority: 'high',
						tags: [{ name: 'integration', color: '#8B7CF6' }],
						milestone: { name: 'System Integrated', color: '#9C27B0' },
						subtasks: [
							{ title: 'Setup Email Channels', description: 'Forward support emails into system.', start_offset_days: 20, due_offset_days: 23, priority: 'high', tags: [{ name: 'channels', color: '#64748B' }] },
							{ title: 'Configure Assignment Rules', description: 'Establish assignment automation rules.', start_offset_days: 23, due_offset_days: 27, priority: 'medium', tags: [{ name: 'automation', color: '#10B981' }] }
						]
					},
					{
						title: 'Support Staff Training',
						description: 'Train representatives on system tools, customer service, and escalations.',
						start_offset_days: 27,
						due_offset_days: 32,
						priority: 'medium',
						tags: [{ name: 'training', color: '#F59E0B' }],
						subtasks: [
							{ title: 'Train on System Console', description: 'Provide tutorials to agents.', start_offset_days: 27, due_offset_days: 30, priority: 'medium', tags: [{ name: 'system', color: '#64748B' }] },
							{ title: 'Mock Escalation Exercises', description: 'Perform exercises for resolving critical tickets.', start_offset_days: 30, due_offset_days: 32, priority: 'medium', tags: [{ name: 'exercises', color: '#EF4444' }] }
						]
					},
					{
						title: 'Pilot Run & Feedback Loop',
						description: 'Operate support system with a small test audience to identify issues.',
						start_offset_days: 32,
						due_offset_days: 38,
						priority: 'medium',
						tags: [{ name: 'pilot', color: '#10B981' }],
						subtasks: [
							{ title: 'Launch Beta Service Desk', description: 'Open portal to selected pilot group.', start_offset_days: 32, due_offset_days: 35, priority: 'medium', tags: [{ name: 'launch', color: '#10B981' }] },
							{ title: 'Gather Agent Feedback', description: 'Identify bottlenecks from agent inputs.', start_offset_days: 35, due_offset_days: 38, priority: 'low', tags: [{ name: 'feedback', color: '#4EA8FF' }] }
						]
					},
					{
						title: 'Go-Live & Customer Announcement',
						description: 'Open channels to all users and announce new support portal.',
						start_offset_days: 38,
						due_offset_days: 42,
						priority: 'high',
						tags: [{ name: 'launch', color: '#10B981' }],
						milestone: { name: 'IT Service Desk Live', color: '#10B981' },
						subtasks: [
							{ title: 'Public Launch Release', description: 'Open channels to all users.', start_offset_days: 38, due_offset_days: 40, priority: 'high', tags: [{ name: 'launch', color: '#10B981' }] },
							{ title: 'Publish Help Announcement', description: 'Send help documentation to customers.', start_offset_days: 40, due_offset_days: 42, priority: 'low', tags: [{ name: 'broadcast', color: '#8B7CF6' }] }
						]
					}
				]
			}
		]
	},
	{
		name: 'Construction',
		icon: <Construction />,
		templates: [
			{
				key: 'residential_building',
				name: 'Residential Building',
				description: 'Standard steps to build a single-family residential home.',
				tasks: [
					{
						title: 'Permits & Architectural Approval',
						description: 'Acquire building permits, soil tests, and final blueprint approvals.',
						start_offset_days: 0,
						due_offset_days: 15,
						priority: 'high',
						tags: [{ name: 'permits', color: '#EF4444' }],
						milestone: { name: 'Permits Issued', color: '#9C27B0' },
						subtasks: [
							{ title: 'Conduct Soil Test', description: 'Analyze soil capacity on site.', start_offset_days: 0, due_offset_days: 5, priority: 'medium', tags: [{ name: 'testing', color: '#64748B' }] },
							{ title: 'Submit Blueprints', description: 'File blueprints with local building council.', start_offset_days: 5, due_offset_days: 10, priority: 'high', tags: [{ name: 'documents', color: '#8B7CF6' }] },
							{ title: 'Receive Permits', description: 'Verify approvals are signed.', start_offset_days: 10, due_offset_days: 15, priority: 'high', tags: [{ name: 'permits', color: '#EF4444' }] }
						]
					},
					{
						title: 'Excavation & Foundation',
						description: 'Excavate the site, pour footings, and construct the foundation.',
						start_offset_days: 15,
						due_offset_days: 30,
						priority: 'high',
						tags: [{ name: 'excavation', color: '#F59E0B' }],
						milestone: { name: 'Foundation Poured', color: '#9C27B0' },
						subtasks: [
							{ title: 'Excavate Ground', description: 'Clear and dig site according to plan.', start_offset_days: 15, due_offset_days: 20, priority: 'high', tags: [{ name: 'excavation', color: '#F59E0B' }] },
							{ title: 'Pour Footings & Slab', description: 'Pour concrete foundation base.', start_offset_days: 20, due_offset_days: 30, priority: 'high', tags: [{ name: 'concrete', color: '#64748B' }] }
						]
					},
					{
						title: 'Framing & Roofing',
						description: 'Construct floor, wall, and roof framing. Install roofing shingles.',
						start_offset_days: 30,
						due_offset_days: 50,
						priority: 'high',
						tags: [{ name: 'framing', color: '#8B7CF6' }],
						milestone: { name: 'Structural Lockup', color: '#10B981' },
						subtasks: [
							{ title: 'Wall & Floor Framing', description: 'Construct wooden structural framework.', start_offset_days: 30, due_offset_days: 42, priority: 'high', tags: [{ name: 'framing', color: '#8B7CF6' }] },
							{ title: 'Roof Installation', description: 'Install shingles and roof waterproofing.', start_offset_days: 42, due_offset_days: 50, priority: 'high', tags: [{ name: 'roofing', color: '#4EA8FF' }] }
						]
					},
					{
						title: 'Plumbing, Electrical & HVAC',
						description: 'Rough-in pipes, electrical wiring, and HVAC ducting.',
						start_offset_days: 50,
						due_offset_days: 70,
						priority: 'high',
						tags: [{ name: 'utilities', color: '#EF4444' }],
						subtasks: [
							{ title: 'Rough-in Plumbing', description: 'Install main pipes.', start_offset_days: 50, due_offset_days: 58, priority: 'medium', tags: [{ name: 'plumbing', color: '#64748B' }] },
							{ title: 'Electrical Wiring Setup', description: 'Route main lines to panel.', start_offset_days: 58, due_offset_days: 65, priority: 'high', tags: [{ name: 'electrical', color: '#EF4444' }] },
							{ title: 'HVAC Duct Setup', description: 'Install central ventilation ducts.', start_offset_days: 65, due_offset_days: 70, priority: 'medium', tags: [{ name: 'HVAC', color: '#F59E0B' }] }
						]
					},
					{
						title: 'Drywall & Insulation',
						description: 'Install insulation batts and drywall panels. Tape and mud joints.',
						start_offset_days: 70,
						due_offset_days: 85,
						priority: 'medium',
						tags: [{ name: 'insulation', color: '#4EA8FF' }],
						subtasks: [
							{ title: 'Install Insulation Batts', description: 'Fit insulation inside framing walls.', start_offset_days: 70, due_offset_days: 75, priority: 'medium', tags: [{ name: 'insulation', color: '#4EA8FF' }] },
							{ title: 'Hang Drywall Panels', description: 'Install board sheets and tape seams.', start_offset_days: 75, due_offset_days: 85, priority: 'medium', tags: [{ name: 'drywall', color: '#64748B' }] }
						]
					},
					{
						title: 'Interior & Exterior Finishing',
						description: 'Paint, install flooring, trim, doors, cabinets, and siding.',
						start_offset_days: 85,
						due_offset_days: 110,
						priority: 'medium',
						tags: [{ name: 'finishing', color: '#EC4899' }],
						milestone: { name: 'Finishes Completed', color: '#10B981' },
						subtasks: [
							{ title: 'Paint Interior Walls', description: 'Apply primers and two finish coats.', start_offset_days: 85, due_offset_days: 95, priority: 'medium', tags: [{ name: 'paint', color: '#EC4899' }] },
							{ title: 'Install Flooring & Cabinets', description: 'Lay wood floor boards and set cabinets.', start_offset_days: 95, due_offset_days: 105, priority: 'medium', tags: [{ name: 'joinery', color: '#8B7CF6' }] },
							{ title: 'Exterior Siding Installation', description: 'Mount vinyl siding panels.', start_offset_days: 105, due_offset_days: 110, priority: 'low', tags: [{ name: 'exterior', color: '#64748B' }] }
						]
					},
					{
						title: 'Final Inspection & Handover',
						description: 'Perform safety inspections, clean site, and hand keys to owner.',
						start_offset_days: 110,
						due_offset_days: 120,
						priority: 'high',
						tags: [{ name: 'handover', color: '#10B981' }],
						milestone: { name: 'Keys Transferred', color: '#10B981' },
						subtasks: [
							{ title: 'Council Safety Inspection', description: 'Pass compliance code checks.', start_offset_days: 110, due_offset_days: 115, priority: 'high', tags: [{ name: 'inspection', color: '#EF4444' }] },
							{ title: 'Handover & Sign Documentation', description: 'Transfer keys and sign completion document.', start_offset_days: 115, due_offset_days: 120, priority: 'high', tags: [{ name: 'handover', color: '#10B981' }] }
						]
					}
				]
			},
			{
				key: 'commercial_renovation',
				name: 'Commercial Renovation',
				description: 'Renovating office space, retail units, or commercial properties.',
				tasks: [
					{
						title: 'Demolition & Site Preparation',
						description: 'Remove old drywall, carpet, ceiling tiles, and debris.',
						start_offset_days: 0,
						due_offset_days: 5,
						priority: 'high',
						tags: [{ name: 'demolition', color: '#EF4444' }],
						milestone: { name: 'Demolition Complete', color: '#EF4444' },
						subtasks: [
							{ title: 'Clear Old Ceilings & Walls', description: 'Tear down panels and remove drywall.', start_offset_days: 0, due_offset_days: 3, priority: 'high', tags: [{ name: 'demolition', color: '#EF4444' }] },
							{ title: 'Haul Away Debris', description: 'Remove debris and dispose of waste safely.', start_offset_days: 3, due_offset_days: 5, priority: 'medium', tags: [{ name: 'waste', color: '#64748B' }] }
						]
					},
					{
						title: 'Structural Alterations',
						description: 'Modify walls, doors, or add load-bearing beams.',
						start_offset_days: 5,
						due_offset_days: 12,
						priority: 'high',
						tags: [{ name: 'structural', color: '#F59E0B' }],
						subtasks: [
							{ title: 'Frame Office Partitions', description: 'Build frames for new rooms.', start_offset_days: 5, due_offset_days: 9, priority: 'high', tags: [{ name: 'framing', color: '#8B7CF6' }] },
							{ title: 'Install Load Beams', description: 'Add structural steel beams.', start_offset_days: 9, due_offset_days: 12, priority: 'high', tags: [{ name: 'structural', color: '#F59E0B' }] }
						]
					},
					{
						title: 'HVAC & Lighting Upgrades',
						description: 'Install commercial lighting fixtures and upgrade air vents.',
						start_offset_days: 12,
						due_offset_days: 20,
						priority: 'medium',
						tags: [{ name: 'utilities', color: '#4EA8FF' }],
						milestone: { name: 'Services Rought-in', color: '#9C27B0' },
						subtasks: [
							{ title: 'Install LED Troffer Lights', description: 'Replace ceiling lighting panels.', start_offset_days: 12, due_offset_days: 16, priority: 'medium', tags: [{ name: 'electrical', color: '#EF4444' }] },
							{ title: 'Upgrade Air Vents & Ducts', description: 'Modify HVAC vents for office layouts.', start_offset_days: 16, due_offset_days: 20, priority: 'medium', tags: [{ name: 'HVAC', color: '#4EA8FF' }] }
						]
					},
					{
						title: 'Drywall, Tape & Mud',
						description: 'Build new office partitions, install drywall, and prep for paint.',
						start_offset_days: 20,
						due_offset_days: 30,
						priority: 'medium',
						tags: [{ name: 'drywall', color: '#64748B' }],
						subtasks: [
							{ title: 'Hang Board Panels', description: 'Mount panels on partitions.', start_offset_days: 20, due_offset_days: 25, priority: 'medium', tags: [{ name: 'drywall', color: '#64748B' }] },
							{ title: 'Tape & Joint mudding', description: 'Apply mud, tape, and sand walls smooth.', start_offset_days: 25, due_offset_days: 30, priority: 'low', tags: [{ name: 'finishing', color: '#EC4899' }] }
						]
					},
					{
						title: 'Flooring & Cabinetry',
						description: 'Install carpet tiles, laminate flooring, and built-in cabinets.',
						start_offset_days: 30,
						due_offset_days: 40,
						priority: 'medium',
						tags: [{ name: 'finishes', color: '#EC4899' }],
						subtasks: [
							{ title: 'Install Carpet Tiles', description: 'Glue down heavy-duty commercial tiles.', start_offset_days: 30, due_offset_days: 35, priority: 'medium', tags: [{ name: 'flooring', color: '#EC4899' }] },
							{ title: 'Assemble Kitchenette Cabinets', description: 'Install cabinets in staff breakroom.', start_offset_days: 35, due_offset_days: 40, priority: 'low', tags: [{ name: 'cabinets', color: '#8B7CF6' }] }
						]
					},
					{
						title: 'Fixtures & Hardware',
						description: 'Install light switches, outlet covers, door handles, and safety signs.',
						start_offset_days: 40,
						due_offset_days: 45,
						priority: 'low',
						tags: [{ name: 'hardware', color: '#64748B' }],
						subtasks: [
							{ title: 'Mount Door Handles & Locks', description: 'Install keyless access locks.', start_offset_days: 40, due_offset_days: 43, priority: 'medium', tags: [{ name: 'security', color: '#EF4444' }] },
							{ title: 'Mount Signage', description: 'Install emergency exits and bathroom signs.', start_offset_days: 43, due_offset_days: 45, priority: 'low', tags: [{ name: 'signage', color: '#64748B' }] }
						]
					},
					{
						title: 'Safety Certification',
						description: 'Obtain occupancy permit and verify fire alarm functionality.',
						start_offset_days: 45,
						due_offset_days: 50,
						priority: 'high',
						tags: [{ name: 'safety', color: '#EF4444' }],
						milestone: { name: 'Office Renovation Completed', color: '#10B981' },
						subtasks: [
							{ title: 'Test Fire Alarms & Sprinklers', description: 'Certify emergency alarms function.', start_offset_days: 45, due_offset_days: 47, priority: 'high', tags: [{ name: 'safety', color: '#EF4444' }] },
							{ title: 'Obtain Occupancy Certificate', description: 'Receive approval for occupation.', start_offset_days: 47, due_offset_days: 50, priority: 'high', tags: [{ name: 'approval', color: '#10B981' }] }
						]
					}
				]
			}
		]
	},
	{
		name: 'Pharma',
		icon: <LocalPharmacy />,
		templates: [
			{
				key: 'clinical_trial_p1',
				name: 'Clinical Trial Phase I',
				description: 'Planning and execution of initial human clinical trial phase.',
				tasks: [
					{
						title: 'Protocol Development & Approval',
						description: 'Draft clinical trial protocol and submit for internal medical review.',
						start_offset_days: 0,
						due_offset_days: 10,
						priority: 'high',
						tags: [{ name: 'protocol', color: '#8B7CF6' }],
						milestone: { name: 'Protocol Finalized', color: '#9C27B0' },
						subtasks: [
							{ title: 'Draft Protocol Outline', description: 'Write trial parameters and goals.', start_offset_days: 0, due_offset_days: 5, priority: 'medium', tags: [{ name: 'draft', color: '#64748B' }] },
							{ title: 'Internal Medical Sign-off', description: 'Obtain approval from medical board.', start_offset_days: 5, due_offset_days: 10, priority: 'high', tags: [{ name: 'approval', color: '#EF4444' }] }
						]
					},
					{
						title: 'IRB/IEC Submission',
						description: 'Submit protocol and consent forms to Institutional Review Board.',
						start_offset_days: 10,
						due_offset_days: 25,
						priority: 'high',
						tags: [{ name: 'regulatory', color: '#EF4444' }],
						milestone: { name: 'IRB Approved', color: '#10B981' },
						subtasks: [
							{ title: 'Assemble Submission Dossier', description: 'Compile forms, brochures, and checklists.', start_offset_days: 10, due_offset_days: 15, priority: 'medium', tags: [{ name: 'dossier', color: '#64748B' }] },
							{ title: 'Review IRB Queries', description: 'Respond to clarifications raised by board.', start_offset_days: 15, due_offset_days: 25, priority: 'high', tags: [{ name: 'review', color: '#EF4444' }] }
						]
					},
					{
						title: 'Investigator Site Selection',
						description: 'Select clinics/hospitals and train principal investigators.',
						start_offset_days: 25,
						due_offset_days: 40,
						priority: 'medium',
						tags: [{ name: 'sites', color: '#4EA8FF' }],
						subtasks: [
							{ title: 'Conduct Site Audits', description: 'Inspect candidate clinics for equipment compliance.', start_offset_days: 25, due_offset_days: 33, priority: 'medium', tags: [{ name: 'auditing', color: '#64748B' }] },
							{ title: 'Train Site Personnel', description: 'Train nurses on drug storage regulations.', start_offset_days: 33, due_offset_days: 40, priority: 'high', tags: [{ name: 'training', color: '#8B7CF6' }] }
						]
					},
					{
						title: 'Patient Recruitment',
						description: 'Advertise, screen candidates, and sign informed consent forms.',
						start_offset_days: 40,
						due_offset_days: 60,
						priority: 'high',
						tags: [{ name: 'recruitment', color: '#F59E0B' }],
						milestone: { name: 'Enrollment Completed', color: '#9C27B0' },
						subtasks: [
							{ title: 'Deploy Recruitment Ads', description: 'Publish campaigns to target forums.', start_offset_days: 40, due_offset_days: 45, priority: 'low', tags: [{ name: 'ads', color: '#EC4899' }] },
							{ title: 'Screen Candidates', description: 'Perform medical checks for criteria compliance.', start_offset_days: 45, due_offset_days: 55, priority: 'high', tags: [{ name: 'screening', color: '#EF4444' }] },
							{ title: 'Sign Informed Consent', description: 'Obtain signatures from patients.', start_offset_days: 55, due_offset_days: 60, priority: 'high', tags: [{ name: 'signatures', color: '#10B981' }] }
						]
					},
					{
						title: 'Dosing & Safety Monitoring',
						description: 'Administer investigational product and monitor safety/vitals.',
						start_offset_days: 60,
						due_offset_days: 90,
						priority: 'high',
						tags: [{ name: 'safety', color: '#EF4444' }],
						subtasks: [
							{ title: 'Administer Drug Product', description: 'Supervise patient dosing according to protocol.', start_offset_days: 60, due_offset_days: 75, priority: 'high', tags: [{ name: 'dosing', color: '#EF4444' }] },
							{ title: 'Record Adverse Events', description: 'Monitor and log side effects.', start_offset_days: 75, due_offset_days: 90, priority: 'high', tags: [{ name: 'monitoring', color: '#F59E0B' }] }
						]
					},
					{
						title: 'Data Analysis & Report',
						description: 'Aggregate lab results and write Clinical Study Report (CSR).',
						start_offset_days: 90,
						due_offset_days: 105,
						priority: 'medium',
						tags: [{ name: 'reporting', color: '#10B981' }],
						milestone: { name: 'CSR Submitted', color: '#10B981' },
						subtasks: [
							{ title: 'Aggregate Lab Data', description: 'Collect statistics from clinics.', start_offset_days: 90, due_offset_days: 98, priority: 'medium', tags: [{ name: 'data', color: '#64748B' }] },
							{ title: 'Draft Final CSR Study', description: 'Compile report of Phase I findings.', start_offset_days: 98, due_offset_days: 105, priority: 'high', tags: [{ name: 'report', color: '#10B981' }] }
						]
					}
				]
			},
			{
				key: 'drug_formulation',
				name: 'Drug Formulation',
				description: 'Developing stable drug recipes and scale-up feasibility.',
				tasks: [
					{
						title: 'Active Ingredient Characterization',
						description: 'Evaluate physical and chemical properties of the drug substance.',
						start_offset_days: 0,
						due_offset_days: 7,
						priority: 'medium',
						tags: [{ name: 'characterization', color: '#4EA8FF' }],
						subtasks: [
							{ title: 'Conduct Solubility Profile Test', description: 'Analyze substance behavior.', start_offset_days: 0, due_offset_days: 4, priority: 'medium', tags: [{ name: 'solubility', color: '#64748B' }] },
							{ title: 'Assess Solid-State Stability', description: 'Verify crystal structure integrity.', start_offset_days: 4, due_offset_days: 7, priority: 'low', tags: [{ name: 'stability', color: '#8B7CF6' }] }
						]
					},
					{
						title: 'Excipient Compatibility',
						description: 'Test interactions between active ingredient and inactive additives.',
						start_offset_days: 7,
						due_offset_days: 17,
						priority: 'high',
						tags: [{ name: 'compatibility', color: '#EF4444' }],
						milestone: { name: 'Excipients Selected', color: '#9C27B0' },
						subtasks: [
							{ title: 'Formulate Blends', description: 'Create sample mixtures with various binders.', start_offset_days: 7, due_offset_days: 12, priority: 'medium', tags: [{ name: 'blending', color: '#64748B' }] },
							{ title: 'Perform Chromatography Checks', description: 'Run HPLC scans to verify compatibility.', start_offset_days: 12, due_offset_days: 17, priority: 'high', tags: [{ name: 'analysis', color: '#EF4444' }] }
						]
					},
					{
						title: 'Prototype Formulation',
						description: 'Create sample batches of capsules, tablets, or liquids.',
						start_offset_days: 17,
						due_offset_days: 27,
						priority: 'high',
						tags: [{ name: 'prototyping', color: '#8B7CF6' }],
						subtasks: [
							{ title: 'Establish Tablet Compression Parameters', description: 'Determine ideal pressure weights.', start_offset_days: 17, due_offset_days: 22, priority: 'medium', tags: [{ name: 'machinery', color: '#64748B' }] },
							{ title: 'Produce Prototype Batches', description: 'Manufacture 500 prototype tablets.', start_offset_days: 22, due_offset_days: 27, priority: 'high', tags: [{ name: 'batching', color: '#8B7CF6' }] }
						]
					},
					{
						title: 'Stability Testing',
						description: 'Expose prototypes to heat and humidity to check degradation rate.',
						start_offset_days: 27,
						due_offset_days: 42,
						priority: 'high',
						tags: [{ name: 'stability', color: '#EF4444' }],
						milestone: { name: 'Stability Profile Verified', color: '#10B981' },
						subtasks: [
							{ title: 'Load Incubator Chambers', description: 'Configure chambers to 40C and 75% relative humidity.', start_offset_days: 27, due_offset_days: 30, priority: 'medium', tags: [{ name: 'setup', color: '#64748B' }] },
							{ title: 'Conduct Period Assay Scans', description: 'Analyze sample properties at weeks 1 and 2.', start_offset_days: 30, due_offset_days: 42, priority: 'high', tags: [{ name: 'testing', color: '#EF4444' }] }
						]
					},
					{
						title: 'Scale-up Feasibility Study',
						description: 'Analyze manufacturing parameters for larger production equipment.',
						start_offset_days: 42,
						due_offset_days: 49,
						priority: 'medium',
						tags: [{ name: 'scale-up', color: '#F59E0B' }],
						subtasks: [
							{ title: 'Identify Factory Equipment Specs', description: 'Compare production output sizes.', start_offset_days: 42, due_offset_days: 45, priority: 'low', tags: [{ name: 'logistics', color: '#64748B' }] },
							{ title: 'Perform Production Mock Runs', description: 'Simulate bulk powder blend steps.', start_offset_days: 45, due_offset_days: 49, priority: 'medium', tags: [{ name: 'simulation', color: '#F59E0B' }] }
						]
					},
					{
						title: 'Regulatory Documentation',
						description: 'Draft Chemistry, Manufacturing, and Controls (CMC) reports.',
						start_offset_days: 49,
						due_offset_days: 56,
						priority: 'high',
						tags: [{ name: 'documentation', color: '#10B981' }],
						milestone: { name: 'Dossier Ready', color: '#10B981' },
						subtasks: [
							{ title: 'Draft CMC Dossier Sections', description: 'Write formulation and testing reports.', start_offset_days: 49, due_offset_days: 53, priority: 'high', tags: [{ name: 'draft', color: '#64748B' }] },
							{ title: 'Regulatory Compliance Review', description: 'Verify report meets FDA guidelines.', start_offset_days: 53, due_offset_days: 56, priority: 'high', tags: [{ name: 'compliance', color: '#10B981' }] }
						]
					}
				]
			}
		]
	},
	{
		name: 'Manufacturing',
		icon: <PrecisionManufacturing />,
		templates: [
			{
				key: 'assembly_line_setup',
				name: 'Assembly Line Setup',
				description: 'Designing and deploying a new manufacturing line.',
				tasks: [
					{
						title: 'Line Layout & Workstation Design',
						description: 'Draft ergonomic layouts and coordinate logistics flow.',
						start_offset_days: 0,
						due_offset_days: 7,
						priority: 'medium',
						tags: [{ name: 'design', color: '#EC4899' }],
						milestone: { name: 'Layout Approved', color: '#9C27B0' },
						subtasks: [
							{ title: 'Draft Layout Blueprints', description: 'Create floor space CAD maps.', start_offset_days: 0, due_offset_days: 4, priority: 'medium', tags: [{ name: 'CAD', color: '#64748B' }] },
							{ title: 'Conduct Safety Clearance Check', description: 'Verify safe corridor walk distances.', start_offset_days: 4, due_offset_days: 7, priority: 'high', tags: [{ name: 'safety', color: '#EF4444' }] }
						]
					},
					{
						title: 'Equipment Procurement',
						description: 'Order conveyors, robots, tools, and assembly fixtures.',
						start_offset_days: 7,
						due_offset_days: 20,
						priority: 'high',
						tags: [{ name: 'procurement', color: '#F59E0B' }],
						subtasks: [
							{ title: 'Issue Equipment RFQs', description: 'Get quotes for conveyors.', start_offset_days: 7, due_offset_days: 12, priority: 'medium', tags: [{ name: 'RFQs', color: '#64748B' }] },
							{ title: 'Place Machinery Purchase Orders', description: 'Approve orders.', start_offset_days: 12, due_offset_days: 20, priority: 'high', tags: [{ name: 'orders', color: '#F59E0B' }] }
						]
					},
					{
						title: 'Installation & Calibration',
						description: 'Assemble machinery, wire controls, and verify calibrations.',
						start_offset_days: 20,
						due_offset_days: 35,
						priority: 'high',
						tags: [{ name: 'installation', color: '#8B7CF6' }],
						milestone: { name: 'Equipment Calibrated', color: '#9C27B0' },
						subtasks: [
							{ title: 'Assemble Conveyor Frames', description: 'Mount tracks and motors.', start_offset_days: 20, due_offset_days: 27, priority: 'high', tags: [{ name: 'assembly', color: '#64748B' }] },
							{ title: 'Wire Controls & Power', description: 'Connect power systems.', start_offset_days: 27, due_offset_days: 32, priority: 'high', tags: [{ name: 'electrical', color: '#EF4444' }] },
							{ title: 'Calibrate Robotic Gripper Sensors', description: 'Align laser sensors.', start_offset_days: 32, due_offset_days: 35, priority: 'medium', tags: [{ name: 'calibration', color: '#8B7CF6' }] }
						]
					},
					{
						title: 'Standard Operating Procedures (SOPs)',
						description: 'Write clear assembly instructions for technicians.',
						start_offset_days: 35,
						due_offset_days: 42,
						priority: 'low',
						tags: [{ name: 'SOPs', color: '#4EA8FF' }],
						subtasks: [
							{ title: 'Draft Assembly SOPs', description: 'Write steps for station operators.', start_offset_days: 35, due_offset_days: 39, priority: 'low', tags: [{ name: 'writing', color: '#64748B' }] },
							{ title: 'Take Action Photos', description: 'Include images in guides.', start_offset_days: 39, due_offset_days: 42, priority: 'low', tags: [{ name: 'media', color: '#4EA8FF' }] }
						]
					},
					{
						title: 'Operator Training',
						description: 'Train assembly operators on speed, quality, and safety.',
						start_offset_days: 42,
						due_offset_days: 47,
						priority: 'medium',
						tags: [{ name: 'training', color: '#F59E0B' }],
						subtasks: [
							{ title: 'Conduct Safety Induction', description: 'Train on emergency stops.', start_offset_days: 42, due_offset_days: 44, priority: 'high', tags: [{ name: 'safety', color: '#EF4444' }] },
							{ title: 'Perform Station Run Drills', description: 'Practice assembly operations.', start_offset_days: 44, due_offset_days: 47, priority: 'medium', tags: [{ name: 'training', color: '#F59E0B' }] }
						]
					},
					{
						title: 'Trial Run & Quality Check',
						description: 'Produce test units to find bottlenecks and defect rates.',
						start_offset_days: 47,
						due_offset_days: 54,
						priority: 'high',
						tags: [{ name: 'testing', color: '#EF4444' }],
						milestone: { name: 'Trial Target Met', color: '#10B981' },
						subtasks: [
							{ title: 'Run First Trial Batch', description: 'Assemble 100 sample units.', start_offset_days: 47, due_offset_days: 50, priority: 'high', tags: [{ name: 'batching', color: '#64748B' }] },
							{ title: 'Perform QA Defect Analysis', description: 'Inspect and record errors.', start_offset_days: 50, due_offset_days: 54, priority: 'high', tags: [{ name: 'testing', color: '#EF4444' }] }
						]
					},
					{
						title: 'Full Production Release',
						description: 'Transition to standard production schedule.',
						start_offset_days: 54,
						due_offset_days: 57,
						priority: 'high',
						tags: [{ name: 'launch', color: '#10B981' }],
						milestone: { name: 'Mass Production Active', color: '#10B981' },
						subtasks: [
							{ title: 'Handover to Operations Manager', description: 'Sign off release forms.', start_offset_days: 54, due_offset_days: 55, priority: 'medium', tags: [{ name: 'handover', color: '#64748B' }] },
							{ title: 'Scale to Target Capacity', description: 'Scale shift production.', start_offset_days: 55, due_offset_days: 57, priority: 'high', tags: [{ name: 'production', color: '#10B981' }] }
						]
					}
				]
			},
			{
				key: 'npi',
				name: 'New Product Introduction (NPI)',
				description: 'Transitioning a physical product from engineering design to factory floor.',
				tasks: [
					{
						title: 'Design for Manufacturing (DFM) Review',
						description: 'Analyze design for easy assembly and low cost.',
						start_offset_days: 0,
						due_offset_days: 5,
						priority: 'high',
						tags: [{ name: 'design', color: '#EC4899' }],
						milestone: { name: 'DFM Approved', color: '#9C27B0' },
						subtasks: [
							{ title: 'Review Tolerance Stack-ups', description: 'Check interface gaps.', start_offset_days: 0, due_offset_days: 3, priority: 'medium', tags: [{ name: 'review', color: '#64748B' }] },
							{ title: 'Identify Component Cost Reductions', description: 'Optimize materials.', start_offset_days: 3, due_offset_days: 5, priority: 'low', tags: [{ name: 'pricing', color: '#10B981' }] }
						]
					},
					{
						title: 'Tooling & Mold Creation',
						description: 'Fabricate custom steel molds and assembly fixtures.',
						start_offset_days: 5,
						due_offset_days: 20,
						priority: 'high',
						tags: [{ name: 'tooling', color: '#8B7CF6' }],
						subtasks: [
							{ title: 'Design Steel Injection Molds', description: 'Draft mold specifications.', start_offset_days: 5, due_offset_days: 10, priority: 'high', tags: [{ name: 'CAD', color: '#64748B' }] },
							{ title: 'Milling Mold Cavities', description: 'Cut steel cores in machine shop.', start_offset_days: 10, due_offset_days: 20, priority: 'high', tags: [{ name: 'machining', color: '#8B7CF6' }] }
						]
					},
					{
						title: 'First Article Inspection (FAI)',
						description: 'Validate that first parts off tooling meet tolerances.',
						start_offset_days: 20,
						due_offset_days: 25,
						priority: 'high',
						tags: [{ name: 'inspection', color: '#EF4444' }],
						milestone: { name: 'FAI Passed', color: '#10B981' },
						subtasks: [
							{ title: 'Measure Sample Dimensions', description: 'Use calipers to measure parts.', start_offset_days: 20, due_offset_days: 22, priority: 'high', tags: [{ name: 'metrology', color: '#64748B' }] },
							{ title: 'Sign FAI Approval Sheets', description: 'Accept sample quality.', start_offset_days: 22, due_offset_days: 25, priority: 'high', tags: [{ name: 'approval', color: '#10B981' }] }
						]
					},
					{
						title: 'Pilot Production Run',
						description: 'Manufacture a small batch to test assembly line tools.',
						start_offset_days: 25,
						due_offset_days: 32,
						priority: 'medium',
						tags: [{ name: 'pilot', color: '#4EA8FF' }],
						subtasks: [
							{ title: 'Assemble 50 Pilot Units', description: 'Run first assembly line test.', start_offset_days: 25, due_offset_days: 28, priority: 'medium', tags: [{ name: 'assembly', color: '#64748B' }] },
							{ title: 'Record Assembly Bottlenecks', description: 'Identify station issues.', start_offset_days: 28, due_offset_days: 32, priority: 'low', tags: [{ name: 'logistics', color: '#4EA8FF' }] }
						]
					},
					{
						title: 'Quality Control Protocol',
						description: 'Set testing standards and test fixture requirements.',
						start_offset_days: 32,
						due_offset_days: 37,
						priority: 'high',
						tags: [{ name: 'QC', color: '#EF4444' }],
						subtasks: [
							{ title: 'Draft QC Inspection Manual', description: 'List defect limits.', start_offset_days: 32, due_offset_days: 35, priority: 'medium', tags: [{ name: 'manual', color: '#64748B' }] },
							{ title: 'Build Test Fixture', description: 'Create device to scan electrical functions.', start_offset_days: 35, due_offset_days: 37, priority: 'high', tags: [{ name: 'testing', color: '#EF4444' }] }
						]
					},
					{
						title: 'Packaging & Shipping Design',
						description: 'Design retail boxes and protective shipping inserts.',
						start_offset_days: 37,
						due_offset_days: 42,
						priority: 'low',
						tags: [{ name: 'packaging', color: '#F59E0B' }],
						subtasks: [
							{ title: 'Drop Test Carton Box', description: 'Verify protection drop height.', start_offset_days: 37, due_offset_days: 40, priority: 'low', tags: [{ name: 'testing', color: '#64748B' }] },
							{ title: 'Print Box Art templates', description: 'Confirm colors look correct.', start_offset_days: 40, due_offset_days: 42, priority: 'low', tags: [{ name: 'artwork', color: '#F59E0B' }] }
						]
					},
					{
						title: 'Mass Production Sign-off',
						description: 'Sign off on final yields and begin bulk manufacturing.',
						start_offset_days: 42,
						due_offset_days: 45,
						priority: 'high',
						tags: [{ name: 'launch', color: '#10B981' }],
						milestone: { name: 'Product Released', color: '#10B981' },
						subtasks: [
							{ title: 'Conduct Yield Assessment Review', description: 'Review defect ratios.', start_offset_days: 42, due_offset_days: 44, priority: 'medium', tags: [{ name: 'review', color: '#64748B' }] },
							{ title: 'Launch Mass Production Run', description: 'Begin factory operations.', start_offset_days: 44, due_offset_days: 45, priority: 'high', tags: [{ name: 'production', color: '#10B981' }] }
						]
					}
				]
			}
		]
	},
	{
		name: 'Marketing',
		icon: <Campaign />,
		templates: [
			{
				key: 'social_media_campaign',
				name: 'Social Media Campaign',
				description: 'End-to-end planning of a multi-channel social media launch.',
				tasks: [
					{
						title: 'Audience Strategy & Platform Choice',
						description: 'Define target demographics and pick social channels.',
						start_offset_days: 0,
						due_offset_days: 4,
						priority: 'medium',
						tags: [{ name: 'strategy', color: '#8B7CF6' }],
						subtasks: [
							{ title: 'Define Target Demographics', description: 'Outline target demographics.', start_offset_days: 0, due_offset_days: 2, priority: 'low', tags: [{ name: 'personas', color: '#64748B' }] },
							{ title: 'Select Core Platforms', description: 'Choose Core Platforms.', start_offset_days: 2, due_offset_days: 4, priority: 'medium', tags: [{ name: 'selection', color: '#8B7CF6' }] }
						]
					},
					{
						title: 'Content Calendar Development',
						description: 'Plan posts, dates, and campaign themes.',
						start_offset_days: 4,
						due_offset_days: 8,
						priority: 'medium',
						tags: [{ name: 'planning', color: '#4EA8FF' }],
						milestone: { name: 'Calendar Approved', color: '#9C27B0' },
						subtasks: [
							{ title: 'Draft Content Calendar', description: 'Outline 12 posts.', start_offset_days: 4, due_offset_days: 6, priority: 'medium', tags: [{ name: 'calendar', color: '#64748B' }] },
							{ title: 'Review Messaging Goals', description: 'Align copy with branding objectives.', start_offset_days: 6, due_offset_days: 8, priority: 'low', tags: [{ name: 'review', color: '#4EA8FF' }] }
						]
					},
					{
						title: 'Creative Asset Production',
						description: 'Design graphics, edit videos, and write ad copy.',
						start_offset_days: 8,
						due_offset_days: 18,
						priority: 'high',
						tags: [{ name: 'creative', color: '#EC4899' }],
						milestone: { name: 'Creative Approved', color: '#9C27B0' },
						subtasks: [
							{ title: 'Design Post Graphics', description: 'Create banners.', start_offset_days: 8, due_offset_days: 13, priority: 'medium', tags: [{ name: 'design', color: '#EC4899' }] },
							{ title: 'Write Ad Copy Versions', description: 'Write three messaging options.', start_offset_days: 13, due_offset_days: 15, priority: 'medium', tags: [{ name: 'writing', color: '#8B7CF6' }] },
							{ title: 'Video Editing & Rendering', description: 'Edit short promotional video.', start_offset_days: 15, due_offset_days: 18, priority: 'high', tags: [{ name: 'video', color: '#EF4444' }] }
						]
					},
					{
						title: 'Ad Campaign Setup',
						description: 'Launch paid promotions on LinkedIn, Meta, or Google.',
						start_offset_days: 18,
						due_offset_days: 21,
						priority: 'high',
						tags: [{ name: 'paid', color: '#F59E0B' }],
						subtasks: [
							{ title: 'Configure Target Audiences', description: 'Define keyword tags.', start_offset_days: 18, due_offset_days: 20, priority: 'medium', tags: [{ name: 'setup', color: '#64748B' }] },
							{ title: 'Set Bid Budgets', description: 'Define campaign daily spending limits.', start_offset_days: 20, due_offset_days: 21, priority: 'high', tags: [{ name: 'billing', color: '#F59E0B' }] }
						]
					},
					{
						title: 'Monitoring & Engagement',
						description: 'Respond to comments and adjust ad spends daily.',
						start_offset_days: 21,
						due_offset_days: 28,
						priority: 'medium',
						tags: [{ name: 'operations', color: '#10B981' }],
						subtasks: [
							{ title: 'Reply to Comments', description: 'Engage with user comments.', start_offset_days: 21, due_offset_days: 28, priority: 'low', tags: [{ name: 'community', color: '#64748B' }] },
							{ title: 'Daily Spend Optimization', description: 'Adjust bids based on CPC.', start_offset_days: 22, due_offset_days: 28, priority: 'medium', tags: [{ name: 'optimization', color: '#10B981' }] }
						]
					},
					{
						title: 'Performance Reporting',
						description: 'Compile reach, clicks, conversions, and ROI metrics.',
						start_offset_days: 28,
						due_offset_days: 31,
						priority: 'medium',
						tags: [{ name: 'analytics', color: '#4EA8FF' }],
						milestone: { name: 'Campaign Complete', color: '#10B981' },
						subtasks: [
							{ title: 'Export Conversion Logs', description: 'Collect lead data from campaigns.', start_offset_days: 28, due_offset_days: 30, priority: 'medium', tags: [{ name: 'data', color: '#64748B' }] },
							{ title: 'Draft Return-on-Investment Report', description: 'Write final results report.', start_offset_days: 30, due_offset_days: 31, priority: 'medium', tags: [{ name: 'reporting', color: '#4EA8FF' }] }
						]
					}
				]
			},
			{
				key: 'email_marketing',
				name: 'Email Marketing Campaign',
				description: 'Designing and sending newsletters or sales drip sequences.',
				tasks: [
					{
						title: 'List Segmentation & Cleanup',
						description: 'Remove inactive emails and segment lists by interest.',
						start_offset_days: 0,
						due_offset_days: 3,
						priority: 'medium',
						tags: [{ name: 'database', color: '#4EA8FF' }],
						subtasks: [
							{ title: 'Identify Unsubscribe Lists', description: 'Remove inactive profiles.', start_offset_days: 0, due_offset_days: 2, priority: 'low', tags: [{ name: 'cleanup', color: '#64748B' }] },
							{ title: 'Apply Tag Segments', description: 'Group contacts by industry tags.', start_offset_days: 2, due_offset_days: 3, priority: 'medium', tags: [{ name: 'segmentation', color: '#4EA8FF' }] }
						]
					},
					{
						title: 'Email Template Customization',
						description: 'Build responsive HTML layout and brand headers.',
						start_offset_days: 3,
						due_offset_days: 7,
						priority: 'high',
						tags: [{ name: 'design', color: '#EC4899' }],
						milestone: { name: 'HTML Layout Complete', color: '#9C27B0' },
						subtasks: [
							{ title: 'Design Header Brand image', description: 'Insert company logo.', start_offset_days: 3, due_offset_days: 5, priority: 'low', tags: [{ name: 'creative', color: '#EC4899' }] },
							{ title: 'Write Mobile Responsive HTML', description: 'Ensure layout renders correctly on mobile devices.', start_offset_days: 5, due_offset_days: 7, priority: 'high', tags: [{ name: 'HTML', color: '#8B7CF6' }] }
						]
					},
					{
						title: 'Copywriting & Subject Line A/B Test',
						description: 'Write persuasive content and draft alternate subject lines.',
						start_offset_days: 7,
						due_offset_days: 10,
						priority: 'medium',
						tags: [{ name: 'copywriting', color: '#8B7CF6' }],
						subtasks: [
							{ title: 'Draft Subject Line Options', description: 'Create two subject lines.', start_offset_days: 7, due_offset_days: 8, priority: 'low', tags: [{ name: 'A/B Testing', color: '#10B981' }] },
							{ title: 'Write Email Body Copy', description: 'Write main call-to-action copy.', start_offset_days: 8, due_offset_days: 10, priority: 'high', tags: [{ name: 'copywriting', color: '#8B7CF6' }] }
						]
					},
					{
						title: 'Drip/Sequence Automation Setup',
						description: 'Configure triggers and delay timelines for auto-emails.',
						start_offset_days: 10,
						due_offset_days: 14,
						priority: 'high',
						tags: [{ name: 'automation', color: '#10B981' }],
						milestone: { name: 'Automation Live', color: '#9C27B0' },
						subtasks: [
							{ title: 'Map Sequence Logic', description: 'Design email timeline flowcharts.', start_offset_days: 10, due_offset_days: 12, priority: 'medium', tags: [{ name: 'logic', color: '#64748B' }] },
							{ title: 'Configure Delay Settings', description: 'Set 3-day delays between emails.', start_offset_days: 12, due_offset_days: 14, priority: 'high', tags: [{ name: 'triggers', color: '#10B981' }] }
						]
					},
					{
						title: 'Send/Schedule Test Email',
						description: 'Review rendering across Gmail, Outlook, and mobile devices.',
						start_offset_days: 14,
						due_offset_days: 16,
						priority: 'medium',
						tags: [{ name: 'testing', color: '#EF4444' }],
						subtasks: [
							{ title: 'Send Test Broadcast', description: 'Send test draft to internal inbox.', start_offset_days: 14, due_offset_days: 15, priority: 'low', tags: [{ name: 'internal', color: '#64748B' }] },
							{ title: 'Verify Link Redirection', description: 'Click all links to check landing page.', start_offset_days: 15, due_offset_days: 16, priority: 'medium', tags: [{ name: 'links', color: '#EF4444' }] }
						]
					},
					{
						title: 'Campaign Launch & Analytics Review',
						description: 'Send emails and track open rates, click-throughs, and unsubscribes.',
						start_offset_days: 16,
						due_offset_days: 21,
						priority: 'high',
						tags: [{ name: 'launch', color: '#10B981' }],
						milestone: { name: 'Campaign Complete', color: '#10B981' },
						subtasks: [
							{ title: 'Broadcast Campaign Live', description: 'Activate mailing sequence.', start_offset_days: 16, due_offset_days: 17, priority: 'high', tags: [{ name: 'broadcast', color: '#EF4444' }] },
							{ title: 'Compile Performance Metrics', description: 'Analyze click and unsubscribe statistics.', start_offset_days: 17, due_offset_days: 21, priority: 'medium', tags: [{ name: 'reporting', color: '#4EA8FF' }] }
						]
					}
				]
			}
		]
	},
	{
		name: 'Sales',
		icon: <TrendingUp />,
		templates: [
			{
				key: 'outbound_campaign',
				name: 'Outbound Sales Campaign',
				description: 'Setting up cold outreach campaigns to target leads.',
				tasks: [
					{
						title: 'Prospect List Building',
						description: 'Source emails and phone numbers of target decision-makers.',
						start_offset_days: 0,
						due_offset_days: 5,
						priority: 'high',
						tags: [{ name: 'database', color: '#4EA8FF' }],
						milestone: { name: 'Prospect List Verified', color: '#9C27B0' },
						subtasks: [
							{ title: 'Target Profile Research', description: 'Identify company targets.', start_offset_days: 0, due_offset_days: 3, priority: 'medium', tags: [{ name: 'profiles', color: '#64748B' }] },
							{ title: 'Verify Contacts', description: 'Verify email addresses.', start_offset_days: 3, due_offset_days: 5, priority: 'high', tags: [{ name: 'verification', color: '#EF4444' }] }
						]
					},
					{
						title: 'Cold Outreach Sequencing',
						description: 'Write email templates and schedule automated follow-ups.',
						start_offset_days: 5,
						due_offset_days: 10,
						priority: 'high',
						tags: [{ name: 'copywriting', color: '#8B7CF6' }],
						subtasks: [
							{ title: 'Draft Cold outreach Templates', description: 'Write email copy.', start_offset_days: 5, due_offset_days: 8, priority: 'medium', tags: [{ name: 'templates', color: '#64748B' }] },
							{ title: 'Setup Outreach Tool', description: 'Import leads and configure automated follow-ups.', start_offset_days: 8, due_offset_days: 10, priority: 'high', tags: [{ name: 'integration', color: '#10B981' }] }
						]
					},
					{
						title: 'Lead Qualification',
						description: 'Score leads based on initial replies or calls.',
						start_offset_days: 10,
						due_offset_days: 17,
						priority: 'high',
						tags: [{ name: 'qualification', color: '#F59E0B' }],
						subtasks: [
							{ title: 'Track Reply Rates', description: 'Log positive answers.', start_offset_days: 10, due_offset_days: 14, priority: 'medium', tags: [{ name: 'metrics', color: '#64748B' }] },
							{ title: 'Call Qualified Leads', description: 'Call prospects who showed interest.', start_offset_days: 14, due_offset_days: 17, priority: 'high', tags: [{ name: 'calls', color: '#EF4444' }] }
						]
					},
					{
						title: 'Product Demos',
						description: 'Deliver personalized demonstrations to interested prospects.',
						start_offset_days: 17,
						due_offset_days: 27,
						priority: 'high',
						tags: [{ name: 'demos', color: '#8B7CF6' }],
						milestone: { name: 'Demos Completed', color: '#9C27B0' },
						subtasks: [
							{ title: 'Schedule Demonstration Meetings', description: 'Coordinate calendar bookings.', start_offset_days: 17, due_offset_days: 20, priority: 'medium', tags: [{ name: 'scheduling', color: '#64748B' }] },
							{ title: 'Deliver Demos', description: 'Show dashboard features.', start_offset_days: 20, due_offset_days: 27, priority: 'high', tags: [{ name: 'presentations', color: '#8B7CF6' }] }
						]
					},
					{
						title: 'Proposal Submission',
						description: 'Send pricing options, scope, and contract drafts.',
						start_offset_days: 27,
						due_offset_days: 32,
						priority: 'high',
						tags: [{ name: 'proposals', color: '#F59E0B' }],
						subtasks: [
							{ title: 'Draft Custom Scope PDF', description: 'Outline requirements.', start_offset_days: 27, due_offset_days: 30, priority: 'medium', tags: [{ name: 'proposals', color: '#64748B' }] },
							{ title: 'Send Pricing Quotations', description: 'Email pricing structures.', start_offset_days: 30, due_offset_days: 32, priority: 'high', tags: [{ name: 'billing', color: '#10B981' }] }
						]
					},
					{
						title: 'Negotiation & Close',
						description: 'Resolve objections, sign contract, and receive payment.',
						start_offset_days: 32,
						due_offset_days: 37,
						priority: 'high',
						tags: [{ name: 'closing', color: '#10B981' }],
						milestone: { name: 'Contract Signed', color: '#10B981' },
						subtasks: [
							{ title: 'Address Contract Queries', description: 'Resolve terms with legal department.', start_offset_days: 32, due_offset_days: 35, priority: 'high', tags: [{ name: 'legal', color: '#EF4444' }] },
							{ title: 'Execute Signatures', description: 'Secure sign-offs.', start_offset_days: 35, due_offset_days: 37, priority: 'high', tags: [{ name: 'closing', color: '#10B981' }] }
						]
					}
				]
			},
			{
				key: 'sales_onboarding',
				name: 'Sales Onboarding Template',
				description: 'Standard path to get new sales hires up to speed.',
				tasks: [
					{
						title: 'Product & Market Training',
						description: 'Understand core product benefits, competitive edge, and pricing.',
						start_offset_days: 0,
						due_offset_days: 5,
						priority: 'high',
						tags: [{ name: 'training', color: '#8B7CF6' }],
						milestone: { name: 'Market Check Completed', color: '#9C27B0' },
						subtasks: [
							{ title: 'Read Product Playbook', description: 'Understand system capabilities.', start_offset_days: 0, due_offset_days: 3, priority: 'medium', tags: [{ name: 'playbook', color: '#64748B' }] },
							{ title: 'Pass Product Basics Quiz', description: 'Take baseline quiz.', start_offset_days: 3, due_offset_days: 5, priority: 'high', tags: [{ name: 'testing', color: '#EF4444' }] }
						]
					},
					{
						title: 'Sales Playbook & Pitch Review',
						description: 'Memorize script, handling common objections, and case studies.',
						start_offset_days: 5,
						due_offset_days: 10,
						priority: 'medium',
						tags: [{ name: 'pitch', color: '#F59E0B' }],
						subtasks: [
							{ title: 'Review Call Scripts', description: 'Read introductory sales templates.', start_offset_days: 5, due_offset_days: 8, priority: 'low', tags: [{ name: 'scripts', color: '#64748B' }] },
							{ title: 'Conduct Roleplay Demo Call', description: 'Practice call with team lead.', start_offset_days: 8, due_offset_days: 10, priority: 'medium', tags: [{ name: 'practice', color: '#F59E0B' }] }
						]
					},
					{
						title: 'CRM & Prospecting Tool Walkthrough',
						description: 'Train on lead database, CRM logging, and outreach tools.',
						start_offset_days: 10,
						due_offset_days: 14,
						priority: 'high',
						tags: [{ name: 'CRM', color: '#4EA8FF' }],
						milestone: { name: 'CRM Tool Certified', color: '#10B981' },
						subtasks: [
							{ title: 'CRM Tutorial', description: 'Complete CRM logging lessons.', start_offset_days: 10, due_offset_days: 12, priority: 'medium', tags: [{ name: 'lessons', color: '#64748B' }] },
							{ title: 'Lead Logging Test', description: 'Log mock leads to confirm correct workflow.', start_offset_days: 12, due_offset_days: 14, priority: 'high', tags: [{ name: 'testing', color: '#EF4444' }] }
						]
					},
					{
						title: 'Live Call Shadowing',
						description: 'Listen to calls and demos led by experienced reps.',
						start_offset_days: 14,
						due_offset_days: 21,
						priority: 'medium',
						tags: [{ name: 'shadowing', color: '#8B7CF6' }],
						subtasks: [
							{ title: 'Shadow 5 Live Calls', description: 'Listen to sales pitches.', start_offset_days: 14, due_offset_days: 18, priority: 'medium', tags: [{ name: 'shadowing', color: '#8B7CF6' }] },
							{ title: 'Discuss Objection Answers', description: 'Deconstruct difficult customer questions.', start_offset_days: 18, due_offset_days: 21, priority: 'low', tags: [{ name: 'review', color: '#64748B' }] }
						]
					},
					{
						title: 'First Solo Pitch',
						description: 'Conduct demo or cold call with manager supervision.',
						start_offset_days: 21,
						due_offset_days: 25,
						priority: 'high',
						tags: [{ name: 'calls', color: '#EF4444' }],
						milestone: { name: 'First Solo Demo Done', color: '#10B981' },
						subtasks: [
							{ title: 'Prepare Pitch Materials', description: 'Review client profile details.', start_offset_days: 21, due_offset_days: 23, priority: 'medium', tags: [{ name: 'prep', color: '#64748B' }] },
							{ title: 'Conduct Monitored Call', description: 'Run call with manager shadowing.', start_offset_days: 23, due_offset_days: 25, priority: 'high', tags: [{ name: 'demo', color: '#EF4444' }] }
						]
					},
					{
						title: 'Performance Review',
						description: 'Assess sales metrics and sign-off on onboarding.',
						start_offset_days: 25,
						due_offset_days: 28,
						priority: 'high',
						tags: [{ name: 'handover', color: '#10B981' }],
						milestone: { name: 'Onboarding Complete', color: '#10B981' },
						subtasks: [
							{ title: 'Review Call Stats', description: 'Review target quotas.', start_offset_days: 25, due_offset_days: 27, priority: 'medium', tags: [{ name: 'stats', color: '#64748B' }] },
							{ title: 'Sign-off Onboarding', description: 'Approve transfer to full-time quota status.', start_offset_days: 27, due_offset_days: 28, priority: 'high', tags: [{ name: 'approval', color: '#10B981' }] }
						]
					}
				]
			}
		]
	},
	{
		name: 'HR',
		icon: <People />,
		templates: [
			{
				key: 'employee_onboarding',
				name: 'Employee Onboarding',
				description: 'Standard checklist for welcoming a new team member.',
				tasks: [
					{
						title: 'IT Hardware & Account Setup',
						description: 'Configure laptop, email, Slack, and code repositories.',
						start_offset_days: 0,
						due_offset_days: 3,
						priority: 'high',
						tags: [{ name: 'IT', color: '#64748B' }],
						milestone: { name: 'Accounts Configured', color: '#9C27B0' },
						subtasks: [
							{ title: 'Configure Laptop', description: 'Install baseline security packages.', start_offset_days: 0, due_offset_days: 2, priority: 'high', tags: [{ name: 'setup', color: '#64748B' }] },
							{ title: 'Setup Email & Slack Accounts', description: 'Invite user to communication channels.', start_offset_days: 2, due_offset_days: 3, priority: 'high', tags: [{ name: 'communication', color: '#4EA8FF' }] }
						]
					},
					{
						title: 'HR Paperwork & Benefits',
						description: 'Collect ID, tax forms, direct deposit, and sign handbook.',
						start_offset_days: 0,
						due_offset_days: 4,
						priority: 'high',
						tags: [{ name: 'HR', color: '#EC4899' }],
						subtasks: [
							{ title: 'Submit Identity Docs', description: 'Upload ID scan to portal.', start_offset_days: 0, due_offset_days: 2, priority: 'high', tags: [{ name: 'identity', color: '#64748B' }] },
							{ title: 'Sign Direct Deposit Forms', description: 'Configure bank details.', start_offset_days: 2, due_offset_days: 4, priority: 'medium', tags: [{ name: 'payroll', color: '#10B981' }] }
						]
					},
					{
						title: 'Welcome & Team Introduction',
						description: 'Introduce new hire on Slack and schedule a welcome lunch.',
						start_offset_days: 2,
						due_offset_days: 4,
						priority: 'low',
						tags: [{ name: 'culture', color: '#8B7CF6' }],
						milestone: { name: 'First Day Complete', color: '#8B7CF6' },
						subtasks: [
							{ title: 'Slack Intro Announcement', description: 'Write introductory bio post.', start_offset_days: 2, due_offset_days: 3, priority: 'low', tags: [{ name: 'Slack', color: '#64748B' }] },
							{ title: 'Welcome Lunch', description: 'Confirm lunch meeting slots.', start_offset_days: 3, due_offset_days: 4, priority: 'low', tags: [{ name: 'lunch', color: '#8B7CF6' }] }
						]
					},
					{
						title: 'First-Week Orientation',
						description: 'Present company values, product demo, and team structure.',
						start_offset_days: 4,
						due_offset_days: 7,
						priority: 'medium',
						tags: [{ name: 'orientation', color: '#F59E0B' }],
						subtasks: [
							{ title: 'Company Values Presentation', description: 'Attend presentation with HR.', start_offset_days: 4, due_offset_days: 5, priority: 'medium', tags: [{ name: 'values', color: '#64748B' }] },
							{ title: 'Schedule Product Demo', description: 'Review primary tool layout.', start_offset_days: 5, due_offset_days: 7, priority: 'low', tags: [{ name: 'product', color: '#F59E0B' }] }
						]
					},
					{
						title: 'First Project/Task Assignment',
						description: 'Assign a small task to help them learn the workflows.',
						start_offset_days: 7,
						due_offset_days: 14,
						priority: 'medium',
						tags: [{ name: 'tasks', color: '#8B7CF6' }],
						milestone: { name: 'First Task Done', color: '#10B981' },
						subtasks: [
							{ title: 'Select Starter Task', description: 'Select low complexity backlog issue.', start_offset_days: 7, due_offset_days: 9, priority: 'low', tags: [{ name: 'planning', color: '#64748B' }] },
							{ title: 'Complete Starter Task Code', description: 'Submit code changes for approval.', start_offset_days: 9, due_offset_days: 14, priority: 'medium', tags: [{ name: 'development', color: '#8B7CF6' }] }
						]
					},
					{
						title: '30-60-90 Day Goal Check-in',
						description: 'Verify adjustment, performance, and answer questions.',
						start_offset_days: 14,
						due_offset_days: 90,
						priority: 'medium',
						tags: [{ name: 'performance', color: '#10B981' }],
						milestone: { name: 'Onboarding Sign-Off', color: '#10B981' },
						subtasks: [
							{ title: '30-Day Check-in Meeting', description: 'Verify adjustment.', start_offset_days: 14, due_offset_days: 30, priority: 'medium', tags: [{ name: 'meeting', color: '#64748B' }] },
							{ title: '60-Day Review', description: 'Review initial metrics.', start_offset_days: 30, due_offset_days: 60, priority: 'medium', tags: [{ name: 'review', color: '#4EA8FF' }] },
							{ title: '90-Day Sign-off Review', description: 'Final onboarding review.', start_offset_days: 60, due_offset_days: 90, priority: 'high', tags: [{ name: 'onboarding', color: '#10B981' }] }
						]
					}
				]
			},
			{
				key: 'performance_review',
				name: 'Performance Review Cycle',
				description: 'Standard review cycle timeline for company-wide evaluations.',
				tasks: [
					{
						title: 'Self-Evaluation Phase',
						description: 'Employees fill out questionnaires about achievements and goals.',
						start_offset_days: 0,
						due_offset_days: 7,
						priority: 'high',
						tags: [{ name: 'evaluation', color: '#EC4899' }],
						milestone: { name: 'Self-Evaluations Received', color: '#9C27B0' },
						subtasks: [
							{ title: 'Publish Evaluation Forms', description: 'Send forms out to team.', start_offset_days: 0, due_offset_days: 2, priority: 'high', tags: [{ name: 'setup', color: '#64748B' }] },
							{ title: 'Fill Self-Evaluation Questions', description: 'Complete questionnaires.', start_offset_days: 2, due_offset_days: 7, priority: 'medium', tags: [{ name: 'evaluation', color: '#EC4899' }] }
						]
					},
					{
						title: 'Manager Review Drafts',
						description: 'Managers write reviews and rate performance metrics.',
						start_offset_days: 7,
						due_offset_days: 17,
						priority: 'high',
						tags: [{ name: 'review', color: '#8B7CF6' }],
						subtasks: [
							{ title: 'Draft Manager Review', description: 'Write reviews for direct reports.', start_offset_days: 7, due_offset_days: 14, priority: 'high', tags: [{ name: 'writing', color: '#64748B' }] },
							{ title: 'Rate Core Competency Metrics', description: 'Rate skills from 1 to 5.', start_offset_days: 14, due_offset_days: 17, priority: 'medium', tags: [{ name: 'ratings', color: '#F59E0B' }] }
						]
					},
					{
						title: 'Calibration Meetings',
						description: 'Leadership reviews ratings to ensure fairness across teams.',
						start_offset_days: 17,
						due_offset_days: 22,
						priority: 'medium',
						tags: [{ name: 'calibration', color: '#F59E0B' }],
						milestone: { name: 'Ratings Calibrated', color: '#9C27B0' },
						subtasks: [
							{ title: 'Schedule Team Calibration Meeting', description: 'Book board slots.', start_offset_days: 17, due_offset_days: 19, priority: 'low', tags: [{ name: 'meeting', color: '#64748B' }] },
							{ title: 'Align Ratings Metrics', description: 'Review consistency of score ratings.', start_offset_days: 19, due_offset_days: 22, priority: 'high', tags: [{ name: 'calibration', color: '#F59E0B' }] }
						]
					},
					{
						title: '1-on-1 Feedback Session',
						description: 'Discuss results, career progression, and areas for improvement.',
						start_offset_days: 22,
						due_offset_days: 29,
						priority: 'high',
						tags: [{ name: 'feedback', color: '#4EA8FF' }],
						subtasks: [
							{ title: 'Book 1-on-1 Sessions', description: 'Reserve feedback slots.', start_offset_days: 22, due_offset_days: 25, priority: 'low', tags: [{ name: 'scheduling', color: '#64748B' }] },
							{ title: 'Conduct Feedback Reviews', description: 'Discuss review results.', start_offset_days: 25, due_offset_days: 29, priority: 'high', tags: [{ name: 'feedback', color: '#4EA8FF' }] }
						]
					},
					{
						title: 'Compensation & Goal Sign-off',
						description: 'Process promotions/bonuses and set goals for next cycle.',
						start_offset_days: 29,
						due_offset_days: 35,
						priority: 'high',
						tags: [{ name: 'comp', color: '#10B981' }],
						milestone: { name: 'Review Cycle Concluded', color: '#10B981' },
						subtasks: [
							{ title: 'Process Salary Adjustments', description: 'Submit adjustments to payroll.', start_offset_days: 29, due_offset_days: 32, priority: 'high', tags: [{ name: 'payroll', color: '#EF4444' }] },
							{ title: 'Define Next Cycle Goals', description: 'Establish OKRs for next quarter.', start_offset_days: 32, due_offset_days: 35, priority: 'medium', tags: [{ name: 'planning', color: '#10B981' }] }
						]
					}
				]
			}
		]
	}
];

/** Finds the category a given PROJECT_TEMPLATES template key belongs to (e.g. 'software_development' -> 'Software'). */
export const getCategoryForTemplateKey = (templateKey?: string): string | undefined => {
	if (!templateKey) return undefined;
	return TEMPLATE_CATEGORIES.find((cat) => cat.templates.some((t) => t.key === templateKey))?.name;
};

/** Finds the full template definition for a given key, across all categories. */
export const getTemplateByKey = (templateKey?: string): ProjectTemplate | undefined => {
	if (!templateKey) return undefined;
	for (const cat of TEMPLATE_CATEGORIES) {
		const found = cat.templates.find((t) => t.key === templateKey);
		if (found) return found;
	}
	return undefined;
};
