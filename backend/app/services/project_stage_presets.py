"""Suggested default task-status (stage) list per project template category.

Mirrors frontend/src/data/projectStagePresets.ts. Used to seed a new project's
task-status board at creation time — chosen by looking up the category of the
project's PROJECT_TEMPLATES entry (see project_templates.py's "category" field).
"""

PROJECT_STAGE_PRESETS: dict[str, list[dict]] = {
    "Software": [
        {"name": "Backlog", "color": "#9E9E9E", "order": 0, "is_initial_status": True},
        {"name": "Design", "color": "#EC4899", "order": 1},
        {"name": "In Development", "color": "#8B7CF6", "order": 2},
        {"name": "Code Review", "color": "#4EA8FF", "order": 3},
        {"name": "QA Testing", "color": "#EF4444", "order": 4},
        {"name": "Deployed", "color": "#10B981", "order": 5, "is_done_status": True},
    ],
    "Construction": [
        {"name": "Permits & Planning", "color": "#9E9E9E", "order": 0, "is_initial_status": True},
        {"name": "Site Preparation", "color": "#F59E0B", "order": 1},
        {"name": "Foundation", "color": "#64748B", "order": 2},
        {"name": "Structural Build", "color": "#8B7CF6", "order": 3},
        {"name": "Finishing", "color": "#EC4899", "order": 4},
        {"name": "Handover", "color": "#10B981", "order": 5, "is_done_status": True},
    ],
    "Pharma": [
        {"name": "Protocol Development", "color": "#9E9E9E", "order": 0, "is_initial_status": True},
        {"name": "Regulatory Submission", "color": "#EF4444", "order": 1},
        {"name": "Site & Recruitment", "color": "#4EA8FF", "order": 2},
        {"name": "Trial Execution", "color": "#F59E0B", "order": 3},
        {"name": "Data Analysis", "color": "#8B7CF6", "order": 4},
        {"name": "Reported", "color": "#10B981", "order": 5, "is_done_status": True},
    ],
    "Manufacturing": [
        {"name": "Design & Planning", "color": "#9E9E9E", "order": 0, "is_initial_status": True},
        {"name": "Procurement", "color": "#F59E0B", "order": 1},
        {"name": "Installation", "color": "#8B7CF6", "order": 2},
        {"name": "Calibration & Testing", "color": "#EF4444", "order": 3},
        {"name": "Trial Run", "color": "#4EA8FF", "order": 4},
        {"name": "In Production", "color": "#10B981", "order": 5, "is_done_status": True},
    ],
    "Marketing": [
        {"name": "Planning", "color": "#9E9E9E", "order": 0, "is_initial_status": True},
        {"name": "Content Creation", "color": "#EC4899", "order": 1},
        {"name": "Review & Approval", "color": "#F59E0B", "order": 2},
        {"name": "Campaign Live", "color": "#4EA8FF", "order": 3},
        {"name": "Monitoring", "color": "#8B7CF6", "order": 4},
        {"name": "Completed", "color": "#10B981", "order": 5, "is_done_status": True},
    ],
    "Sales": [
        {"name": "Planning", "color": "#9E9E9E", "order": 0, "is_initial_status": True},
        {"name": "In Progress", "color": "#4EA8FF", "order": 1},
        {"name": "Client Review", "color": "#F59E0B", "order": 2},
        {"name": "Delivery", "color": "#8B7CF6", "order": 3},
        {"name": "Closed Won", "color": "#10B981", "order": 4, "is_done_status": True},
    ],
    "HR": [
        {"name": "Planning", "color": "#9E9E9E", "order": 0, "is_initial_status": True},
        {"name": "Setup", "color": "#4EA8FF", "order": 1},
        {"name": "Implementation", "color": "#8B7CF6", "order": 2},
        {"name": "Review", "color": "#F59E0B", "order": 3},
        {"name": "Completed", "color": "#10B981", "order": 4, "is_done_status": True},
    ],
}

# Generic fallback for projects created without a template ("Blank Project").
DEFAULT_STAGE_PRESET: list[dict] = [
    {"name": "Planning", "order": 0, "color": "#9E9E9E", "is_initial_status": True},
    {"name": "Active", "order": 1, "color": "#2196F3"},
    {"name": "In Progress", "order": 2, "color": "#FF9800"},
    {"name": "Delayed", "order": 3, "color": "#F44336"},
    {"name": "In Testing", "order": 4, "color": "#00BCD4"},
    {"name": "On Hold", "order": 5, "color": "#E91E63"},
    {"name": "Completed", "order": 6, "color": "#4CAF50", "is_done_status": True},
    {"name": "Approved", "order": 7, "color": "#009688", "is_done_status": True},
    {"name": "Invoiced", "order": 8, "color": "#3F51B5", "is_done_status": True},
    {"name": "Canceled", "order": 9, "color": "#757575", "is_done_status": True},
]


def get_stage_preset_for_template(template_key: str | None) -> list[dict]:
    """Resolves the stage preset to seed a new project with: the category preset
    matching its template, or the generic default set if there's no template
    (or the template's category has no dedicated preset)."""
    if template_key:
        from app.services.project_templates import PROJECT_TEMPLATES

        template = PROJECT_TEMPLATES.get(template_key)
        if template:
            category = template.get("category")
            preset = PROJECT_STAGE_PRESETS.get(category)
            if preset:
                return preset
    return DEFAULT_STAGE_PRESET
