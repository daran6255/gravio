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

export interface TemplateTask {
	title: string;
	description: string;
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
					{ title: 'Requirements Analysis', description: 'Gather and document functional and non-functional requirements.' },
					{ title: 'Architecture & System Design', description: 'Design system architecture, database schema, and component diagrams.' },
					{ title: 'Sprint Planning', description: 'Define sprint scope, estimate task effort, and assign initial tasks.' },
					{ title: 'Development Phase', description: 'Build backend APIs and implement frontend user interfaces.' },
					{ title: 'QA Testing & Bug Fixing', description: 'Perform unit testing, integration testing, and bug resolution.' },
					{ title: 'Deployment & DevOps', description: 'Setup CI/CD pipelines and deploy to staging and production environments.' },
					{ title: 'User Acceptance Testing (UAT)', description: 'Facilitate testing by business stakeholders and gather feedback.' },
					{ title: 'Launch & Post-Release Support', description: 'Deploy final release, monitor systems, and address critical issues.' }
				]
			},
			{
				key: 'product_launch',
				name: 'Product Launch Plan',
				description: 'Steps to launch a new product or feature to the market.',
				tasks: [
					{ title: 'Market Research & Competitor Analysis', description: 'Analyze target market and competitor positioning.' },
					{ title: 'Define Value Proposition & Pricing', description: 'Establish key messaging, pricing tiers, and licensing models.' },
					{ title: 'Marketing Collateral Creation', description: 'Design landing pages, banners, write copy, and create documentation.' },
					{ title: 'Sales Enablement & Training', description: 'Train sales teams on product features and handle objections.' },
					{ title: 'Beta Program Launch', description: 'Release product to beta testers and collect early feedback.' },
					{ title: 'Press Release & Media Outreach', description: 'Draft PR and contact journalists/influencers.' },
					{ title: 'Public Launch & Analytics Tracking', description: 'Go live, launch campaign, and monitor traffic and signups.' }
				]
			},
			{
				key: 'website_development',
				name: 'Website Development',
				description: 'Standard process for building and launching a corporate website.',
				tasks: [
					{ title: 'UI/UX Wireframing & Design', description: 'Create layouts, wireframes, and design mockups for approval.' },
					{ title: 'Content Gathering & Copywriting', description: 'Collect images, write body copy, and organize site structure.' },
					{ title: 'HTML/CSS Implementation', description: 'Build responsive frontend templates matching designs.' },
					{ title: 'CMS Integration', description: 'Configure WordPress, Webflow, or headless CMS.' },
					{ title: 'SEO Optimization', description: 'Setup meta tags, robots.txt, sitemaps, and optimize page load speed.' },
					{ title: 'Cross-browser Testing & QA', description: 'Test forms, links, responsiveness, and performance across browsers.' },
					{ title: 'Launch & DNS Configuration', description: 'Point domain to production server, configure SSL, and verify go-live.' }
				]
			},
			{
				key: 'it_support',
				name: 'IT Support Project',
				description: 'Setting up internal or customer-facing IT service desk support.',
				tasks: [
					{ title: 'Service Desk Tool Selection', description: 'Evaluate and choose support ticketing software.' },
					{ title: 'SLA & Priority Definitions', description: 'Define ticket priority levels, response times, and resolution targets.' },
					{ title: 'Knowledge Base Creation', description: 'Draft articles for self-service portal.' },
					{ title: 'Ticketing System Integration', description: 'Setup support email channels, custom fields, and ticket assignment workflows.' },
					{ title: 'Support Staff Training', description: 'Train representatives on system tools, customer service, and escalations.' },
					{ title: 'Pilot Run & Feedback Loop', description: 'Operate support system with a small test audience to identify issues.' },
					{ title: 'Go-Live & Customer Announcement', description: 'Open channels to all users and announce new support portal.' }
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
					{ title: 'Permits & Architectural Approval', description: 'Acquire building permits, soil tests, and final blueprint approvals.' },
					{ title: 'Excavation & Foundation', description: 'Excavate the site, pour footings, and construct the foundation.' },
					{ title: 'Framing & Roofing', description: 'Construct floor, wall, and roof framing. Install roofing shingles.' },
					{ title: 'Plumbing, Electrical & HVAC', description: 'Rough-in pipes, electrical wiring, and HVAC ducting.' },
					{ title: 'Drywall & Insulation', description: 'Install insulation batts and drywall panels. Tape and mud joints.' },
					{ title: 'Interior & Exterior Finishing', description: 'Paint, install flooring, trim, doors, cabinets, and siding.' },
					{ title: 'Final Inspection & Handover', description: 'Perform safety inspections, clean site, and hand keys to owner.' }
				]
			},
			{
				key: 'commercial_renovation',
				name: 'Commercial Renovation',
				description: 'Renovating office space, retail units, or commercial properties.',
				tasks: [
					{ title: 'Demolition & Site Preparation', description: 'Remove old drywall, carpet, ceiling tiles, and debris.' },
					{ title: 'Structural Alterations', description: 'Modify walls, doors, or add load-bearing beams.' },
					{ title: 'HVAC & Lighting Upgrades', description: 'Install commercial lighting fixtures and upgrade air vents.' },
					{ title: 'Drywall, Tape & Mud', description: 'Build new office partitions, install drywall, and prep for paint.' },
					{ title: 'Flooring & Cabinetry', description: 'Install carpet tiles, laminate flooring, and built-in cabinets.' },
					{ title: 'Fixtures & Hardware', description: 'Install light switches, outlet covers, door handles, and safety signs.' },
					{ title: 'Safety Certification', description: 'Obtain occupancy permit and verify fire alarm functionality.' }
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
					{ title: 'Protocol Development & Approval', description: 'Draft clinical trial protocol and submit for internal medical review.' },
					{ title: 'IRB/IEC Submission', description: 'Submit protocol and consent forms to Institutional Review Board.' },
					{ title: 'Investigator Site Selection', description: 'Select clinics/hospitals and train principal investigators.' },
					{ title: 'Patient Recruitment', description: 'Advertise, screen candidates, and sign informed consent forms.' },
					{ title: 'Dosing & Safety Monitoring', description: 'Administer investigational product and monitor safety/vitals.' },
					{ title: 'Data Analysis & Report', description: 'Aggregate lab results and write Clinical Study Report (CSR).' }
				]
			},
			{
				key: 'drug_formulation',
				name: 'Drug Formulation',
				description: 'Developing stable drug recipes and scale-up feasibility.',
				tasks: [
					{ title: 'Active Ingredient Characterization', description: 'Evaluate physical and chemical properties of the drug substance.' },
					{ title: 'Excipient Compatibility', description: 'Test interactions between active ingredient and inactive additives.' },
					{ title: 'Prototype Formulation', description: 'Create sample batches of capsules, tablets, or liquids.' },
					{ title: 'Stability Testing', description: 'Expose prototypes to heat and humidity to check degradation rate.' },
					{ title: 'Scale-up Feasibility Study', description: 'Analyze manufacturing parameters for larger production equipment.' },
					{ title: 'Regulatory Documentation', description: 'Draft Chemistry, Manufacturing, and Controls (CMC) reports.' }
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
					{ title: 'Line Layout & Workstation Design', description: 'Draft ergonomic layouts and coordinate logistics flow.' },
					{ title: 'Equipment Procurement', description: 'Order conveyors, robots, tools, and assembly fixtures.' },
					{ title: 'Installation & Calibration', description: 'Assemble machinery, wire controls, and verify calibrations.' },
					{ title: 'Standard Operating Procedures (SOPs)', description: 'Write clear assembly instructions for technicians.' },
					{ title: 'Operator Training', description: 'Train assembly operators on speed, quality, and safety.' },
					{ title: 'Trial Run & Quality Check', description: 'Produce test units to find bottlenecks and defect rates.' },
					{ title: 'Full Production Release', description: 'Transition to standard production schedule.' }
				]
			},
			{
				key: 'npi',
				name: 'New Product Introduction (NPI)',
				description: 'Transitioning a physical product from engineering design to factory floor.',
				tasks: [
					{ title: 'Design for Manufacturing (DFM) Review', description: 'Analyze design for easy assembly and low cost.' },
					{ title: 'Tooling & Mold Creation', description: 'Fabricate custom steel molds and assembly fixtures.' },
					{ title: 'First Article Inspection (FAI)', description: 'Validate that first parts off tooling meet tolerances.' },
					{ title: 'Pilot Production Run', description: 'Manufacture a small batch to test assembly line tools.' },
					{ title: 'Quality Control Protocol', description: 'Set testing standards and test fixture requirements.' },
					{ title: 'Packaging & Shipping Design', description: 'Design retail boxes and protective shipping inserts.' },
					{ title: 'Mass Production Sign-off', description: 'Sign off on final yields and begin bulk manufacturing.' }
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
					{ title: 'Audience Strategy & Platform Choice', description: 'Define target demographics and pick social channels.' },
					{ title: 'Content Calendar Development', description: 'Plan posts, dates, and campaign themes.' },
					{ title: 'Creative Asset Production', description: 'Design graphics, edit videos, and write ad copy.' },
					{ title: 'Ad Campaign Setup', description: 'Launch paid promotions on LinkedIn, Meta, or Google.' },
					{ title: 'Monitoring & Engagement', description: 'Respond to comments and adjust ad spends daily.' },
					{ title: 'Performance Reporting', description: 'Compile reach, clicks, conversions, and ROI metrics.' }
				]
			},
			{
				key: 'email_marketing',
				name: 'Email Marketing Campaign',
				description: 'Designing and sending newsletters or sales drip sequences.',
				tasks: [
					{ title: 'List Segmentation & Cleanup', description: 'Remove inactive emails and segment lists by interest.' },
					{ title: 'Email Template Customization', description: 'Build responsive HTML layout and brand headers.' },
					{ title: 'Copywriting & Subject Line A/B Test', description: 'Write persuasive content and draft alternate subject lines.' },
					{ title: 'Drip/Sequence Automation Setup', description: 'Configure triggers and delay timelines for auto-emails.' },
					{ title: 'Send/Schedule Test Email', description: 'Review rendering across Gmail, Outlook, and mobile devices.' },
					{ title: 'Campaign Launch & Analytics Review', description: 'Send emails and track open rates, click-throughs, and unsubscribes.' }
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
					{ title: 'Prospect List Building', description: 'Source emails and phone numbers of target decision-makers.' },
					{ title: 'Cold Outreach Sequencing', description: 'Write email templates and schedule automated follow-ups.' },
					{ title: 'Lead Qualification', description: 'Score leads based on initial replies or calls.' },
					{ title: 'Product Demos', description: 'Deliver personalized demonstrations to interested prospects.' },
					{ title: 'Proposal Submission', description: 'Send pricing options, scope, and contract drafts.' },
					{ title: 'Negotiation & Close', description: 'Resolve objections, sign contract, and receive payment.' }
				]
			},
			{
				key: 'sales_onboarding',
				name: 'Sales Onboarding Template',
				description: 'Standard path to get new sales hires up to speed.',
				tasks: [
					{ title: 'Product & Market Training', description: 'Understand core product benefits, competitive edge, and pricing.' },
					{ title: 'Sales Playbook & Pitch Review', description: 'Memorize script, handling common objections, and case studies.' },
					{ title: 'CRM & Prospecting Tool Walkthrough', description: 'Train on lead database, CRM logging, and outreach tools.' },
					{ title: 'Live Call Shadowing', description: 'Listen to calls and demos led by experienced reps.' },
					{ title: 'First Solo Pitch', description: 'Conduct demo or cold call with manager supervision.' },
					{ title: 'Performance Review', description: 'Assess sales metrics and sign-off on onboarding.' }
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
					{ title: 'IT Hardware & Account Setup', description: 'Configure laptop, email, Slack, and code repositories.' },
					{ title: 'HR Paperwork & Benefits', description: 'Collect ID, tax forms, direct deposit, and sign handbook.' },
					{ title: 'Welcome & Team Introduction', description: 'Introduce new hire on Slack and schedule a welcome lunch.' },
					{ title: 'First-Week Orientation', description: 'Present company values, product demo, and team structure.' },
					{ title: 'First Project/Task Assignment', description: 'Assign a small task to help them learn the workflows.' },
					{ title: '30-60-90 Day Goal Check-in', description: 'Verify adjustment, performance, and answer questions.' }
				]
			},
			{
				key: 'performance_review',
				name: 'Performance Review Cycle',
				description: 'Standard review cycle timeline for company-wide evaluations.',
				tasks: [
					{ title: 'Self-Evaluation Phase', description: 'Employees fill out questionnaires about achievements and goals.' },
					{ title: 'Manager Review Drafts', description: 'Managers write reviews and rate performance metrics.' },
					{ title: 'Calibration Meetings', description: 'Leadership reviews ratings to ensure fairness across teams.' },
					{ title: '1-on-1 Feedback Session', description: 'Discuss results, career progression, and areas for improvement.' },
					{ title: 'Compensation & Goal Sign-off', description: 'Process promotions/bonuses and set goals for next cycle.' }
				]
			}
		]
	}
];
