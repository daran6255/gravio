/**
 * System Health Models
 */

export interface HealthCheckResponse {
	status: 'healthy' | 'degraded' | 'critical';
	version: string;
	environment: string;
	timestamp?: number;
	metrics?: SystemMetric[];
}

export interface SystemMetric {
	name: string;
	status: 'operational' | 'degraded' | 'down';
	responseTime?: number;
	uptime?: number;
	icon?: string;
}

export interface SystemHealth {
	overall: 'healthy' | 'degraded' | 'critical';
	lastCheck: Date;
	metrics: SystemMetric[];
	apiVersion?: string;
	environment?: string;
}
