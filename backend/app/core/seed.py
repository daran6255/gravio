"""Database seeding script to initialize the primary superuser, organization, and pricing plans"""

import asyncio
import uuid
from sqlalchemy.future import select
from app.core.database import AsyncSessionLocal, engine
from app.models.user import User, UserRole
from app.models.organization import Organization
from app.models.plan import Plan, PlanTier, Module
from app.core.security import get_password_hash
from app.models.crm import CRMLead, CRMDeal, CRMPipeline, CRMPipelineStage, LeadStatus, LeadPriority, DealStatus, LeadSource
from app.models.project import Project, ProjectStatus
from datetime import date, timedelta

# Tier -> modules unlocked + monthly AI credit grant (token-weighted, see AICreditWallet).
# See backend/documentation/PRICING_PLAN_BUSINESS_LOGIC.md for the business rationale.
PLAN_DEFINITIONS = {
    PlanTier.FREE: {
        "name": "Free",
        "enabled_modules": [
            Module.PROJECT_MANAGEMENT.value,
        ],
        "ai_credits_monthly": 100,
        "user_limit": 10,
    },
    PlanTier.BASIC: {
        "name": "Basic",
        "enabled_modules": [
            Module.PROJECT_MANAGEMENT.value,
            Module.TIMESHEET_MANAGEMENT.value,
            Module.CRM_MANAGEMENT.value,
            Module.REPORTS_MANAGEMENT.value,
        ],
        "ai_credits_monthly": 500,
        "user_limit": 20,
    },
    PlanTier.PRO: {
        "name": "Pro",
        "enabled_modules": [
            Module.PROJECT_MANAGEMENT.value,
            Module.TIMESHEET_MANAGEMENT.value,
            Module.CRM_MANAGEMENT.value,
            Module.REPORTS_MANAGEMENT.value,
            Module.CANDIDATE_MANAGEMENT.value,
            Module.PLACEMENT_MANAGEMENT.value,
        ],
        "ai_credits_monthly": 1000,
        "user_limit": 50,
    },
    PlanTier.ENTERPRISE: {
        "name": "Enterprise",
        "enabled_modules": [m.value for m in Module],
        "ai_credits_monthly": 2000,
        "user_limit": None,
    },
}


async def seed_plans(session) -> None:
    """Ensure the Free/Basic/Pro/Enterprise pricing plans exist and match PLAN_DEFINITIONS."""
    for tier, definition in PLAN_DEFINITIONS.items():
        result = await session.execute(select(Plan).where(Plan.tier == tier))
        plan = result.scalars().first()
        if not plan:
            plan = Plan(tier=tier, **definition)
            session.add(plan)
            print(f"Created plan: {definition['name']}")
        else:
            plan.name = definition["name"]
            plan.enabled_modules = definition["enabled_modules"]
            plan.ai_credits_monthly = definition["ai_credits_monthly"]
            plan.user_limit = definition["user_limit"]
            print(f"Updated plan: {definition['name']}")


async def seed_db() -> None:
    """Seed the database with the primary super admin, organization, and pricing plans"""
    print("Connecting to database...")
    async with AsyncSessionLocal() as session:
        await seed_plans(session)

        # 1. Ensure the organization "Taydens" exists
        result_org = await session.execute(
            select(Organization).where(Organization.name == "Taydens")
        )
        org = result_org.scalars().first()
        if not org:
            org = Organization(
                name="Taydens",
                location="Chennai",
                public_id=uuid.uuid4(),
                is_active=True,
                others={}
            )
            session.add(org)
            await session.flush()  # flush to populate the autoincremented ID
            print(f"Created organization: {org.name} (ID: {org.id})")
        else:
            print(f"Organization '{org.name}' already exists (ID: {org.id}).")

        # 2. Check if the superuser 'dharanidaran' exists
        result_user = await session.execute(
            select(User).where(User.username == "dharanidaran")
        )
        user = result_user.scalars().first()
        
        hashed_pw = get_password_hash("Testpass@123")
        
        if not user:
            user = User(
                username="dharanidaran",
                email="dharanidaran.a@taydens.com",
                full_name="Dharanidaran Annadurai",
                hashed_password=hashed_pw,
                is_active=True,
                is_verified=True,
                is_superuser=True,
                role=UserRole.ADMIN,
                organization_id=org.id,
                public_id=uuid.uuid4(),
                others={}
            )
            session.add(user)
            print(f"Created superuser: {user.username} (email: {user.email})")
        else:
            # Update user info to match request
            user.email = "dharanidaran.a@taydens.com"
            user.full_name = "Dharanidaran Annadurai"
            user.hashed_password = hashed_pw
            user.is_superuser = True
            user.role = UserRole.ADMIN
            user.organization_id = org.id
            user.is_active = True
            user.is_verified = True
            print(f"Updated existing user '{user.username}' to match super admin specs.")

        # 3. Ensure no other users have superuser access
        result_other_superusers = await session.execute(
            select(User).where(User.is_superuser == True, User.username != "dharanidaran")
        )
        other_superusers = result_other_superusers.scalars().all()
        for other in other_superusers:
            other.is_superuser = False
            print(f"Declassified other superuser: {other.username}")

        # 4. Seed several test organizations with user counts to populate Seat Usage Monitor and widgets
        # Get plans
        free_plan = (await session.execute(select(Plan).where(Plan.tier == PlanTier.FREE))).scalars().first()
        basic_plan = (await session.execute(select(Plan).where(Plan.tier == PlanTier.BASIC))).scalars().first()
        pro_plan = (await session.execute(select(Plan).where(Plan.tier == PlanTier.PRO))).scalars().first()
        enterprise_plan = (await session.execute(select(Plan).where(Plan.tier == PlanTier.ENTERPRISE))).scalars().first()

        # Helper function to seed organization and its users
        async def seed_org(name, plan_id, status, count, expires_in_days=None, location="Chennai"):
            result = await session.execute(select(Organization).where(Organization.name == name))
            org = result.scalars().first()
            from datetime import datetime, timezone, timedelta
            
            now = datetime.now(timezone.utc)
            trial_started = now - timedelta(days=10)
            trial_expires = now + timedelta(days=expires_in_days) if expires_in_days is not None else now + timedelta(days=30)
            
            if not org:
                org = Organization(
                    name=name,
                    location=location,
                    public_id=uuid.uuid4(),
                    is_active=True,
                    subscription_status=status,
                    trial_started_at=trial_started,
                    trial_expires_at=trial_expires,
                    plan_id=plan_id,
                    others={}
                )
                session.add(org)
                await session.flush()
                print(f"Created organization: {org.name}")
            else:
                org.plan_id = plan_id
                org.subscription_status = status
                org.trial_expires_at = trial_expires
                await session.flush()
                print(f"Updated organization: {org.name}")
            
            # Now seed users in this organization
            user_count_result = await session.execute(
                select(User).where(User.organization_id == org.id)
            )
            existing_users = user_count_result.scalars().all()
            needed = count - len(existing_users)
            
            if needed > 0:
                hashed_pw = get_password_hash("Testpass@123")
                roles_pool = [
                    UserRole.DEVELOPER, UserRole.MANAGER, UserRole.SOURCING, 
                    UserRole.PLACEMENT, UserRole.TRAINER, UserRole.COUNSELOR, 
                    UserRole.PROJECT_COORDINATOR, UserRole.LEADERSHIP, UserRole.HR_ADMIN
                ]
                for i in range(needed):
                    suffix = f"{org.name.lower().replace(' ', '')}_{i+len(existing_users)}"
                    assigned_role = roles_pool[i % len(roles_pool)] if i > 0 else UserRole.ADMIN
                    user = User(
                        username=f"user_{suffix}",
                        email=f"user_{suffix}@example.com",
                        full_name=f"User {i+len(existing_users)} - {org.name}",
                        hashed_password=hashed_pw,
                        is_active=True,
                        is_verified=True,
                        is_superuser=False,
                        role=assigned_role,
                        organization_id=org.id,
                        public_id=uuid.uuid4(),
                        others={}
                    )
                    session.add(user)
                await session.flush()
                print(f"Seeded {needed} users for organization {org.name}")
 
        # Seed test orgs
        await seed_org("Taydens", pro_plan.id if pro_plan else None, "active", 12, location="Chennai")
        await seed_org("Acme Corporation", pro_plan.id if pro_plan else None, "active", 45, location="San Francisco")
        await seed_org("Globex Corporation", basic_plan.id if basic_plan else None, "active", 18, location="Boston")
        await seed_org("Initech Inc.", free_plan.id if free_plan else None, "trial", 8, expires_in_days=3, location="Austin")
        await seed_org("Hooli", pro_plan.id if pro_plan else None, "trial", 46, expires_in_days=1, location="Silicon Valley")
        await seed_org("Umbrella Corp", enterprise_plan.id if enterprise_plan else None, "active", 12, location="Raccoon City")
        await seed_org("Stark Industries", pro_plan.id if pro_plan else None, "active", 15, location="New York")

        # Seed CRM Leads, Deals, and Projects for "Taydens" organization
        print("Seeding CRM Leads, Deals, and Projects for Taydens organization...")
        
        # 1. Ensure a CRM Pipeline exists
        result_pipeline = await session.execute(
            select(CRMPipeline).where(CRMPipeline.organization_id == org.id)
        )
        pipeline = result_pipeline.scalars().first()
        if not pipeline:
            pipeline = CRMPipeline(
                name="Sales Pipeline",
                is_default=True,
                organization_id=org.id,
                custom_fields={}
            )
            session.add(pipeline)
            await session.flush()
            
            stages = [
                ("Lead In", 10, "#808080", False, False),
                ("Contacted", 20, "#06b6d4", False, False),
                ("Qualified", 40, "#3b82f6", False, False),
                ("Proposal Sent", 60, "#8b5cf6", False, False),
                ("Negotiation", 80, "#f59e0b", False, False),
                ("Won", 100, "#10b981", True, False),
                ("Lost", 0, "#ef4444", False, True)
            ]
            
            stage_entities = []
            for order, (name, prob, color, is_won, is_lost) in enumerate(stages):
                stage = CRMPipelineStage(
                    pipeline_id=pipeline.id,
                    name=name,
                    order=order,
                    probability=prob,
                    color=color,
                    is_won_stage=is_won,
                    is_lost_stage=is_lost,
                    custom_fields={}
                )
                session.add(stage)
                stage_entities.append(stage)
            await session.flush()
            print("Created CRM Pipeline and Stages.")
        else:
            # Fetch existing stages
            result_stages = await session.execute(
                select(CRMPipelineStage).where(CRMPipelineStage.pipeline_id == pipeline.id)
            )
            stage_entities = result_stages.scalars().all()

        won_stage = next((s for s in stage_entities if s.is_won_stage), None)
        negotiation_stage = next((s for s in stage_entities if s.name == "Negotiation"), None)
        if not negotiation_stage:
            negotiation_stage = stage_entities[0] if stage_entities else None

        # Fetch the superuser dharanidaran to own the leads/deals
        result_user = await session.execute(
            select(User).where(User.username == "dharanidaran")
        )
        superuser = result_user.scalars().first()
        owner_id = superuser.id if superuser else None

        # 2. Seed CRM Leads
        result_leads = await session.execute(
            select(CRMLead).where(CRMLead.organization_id == org.id)
        )
        existing_leads = result_leads.scalars().all()
        if not existing_leads:
            mock_leads = [
                ("Acme Corp Expansion", LeadStatus.NEW, LeadPriority.MEDIUM, 25000.0, LeadSource.WEBSITE),
                ("Globex Integration Phase 2", LeadStatus.CONTACTED, LeadPriority.HIGH, 45000.0, LeadSource.LINKEDIN),
                ("Initech Legacy Upgrade", LeadStatus.CONVERTED, LeadPriority.LOW, 15000.0, LeadSource.REFERRAL),
                ("Umbrella Security System", LeadStatus.QUALIFIED, LeadPriority.URGENT, 85000.0, LeadSource.EVENT)
            ]
            for title, status, priority, value, source in mock_leads:
                lead = CRMLead(
                    title=title,
                    status=status,
                    priority=priority,
                    estimated_value=value,
                    source=source,
                    currency="USD",
                    owner_id=owner_id,
                    organization_id=org.id,
                    public_id=uuid.uuid4(),
                    version=1,
                    is_anonymized=False,
                    custom_fields={}
                )
                session.add(lead)
            await session.flush()
            print("Seeded CRM Leads.")

        # 3. Seed CRM Deals
        result_deals = await session.execute(
            select(CRMDeal).where(CRMDeal.organization_id == org.id)
        )
        existing_deals = result_deals.scalars().all()
        if not existing_deals and pipeline and won_stage:
            # Create a couple of won deals and one open deal
            deal1 = CRMDeal(
                title="Initech Legacy Upgrade Deal",
                status=DealStatus.WON,
                value=15000.0,
                pipeline_id=pipeline.id,
                stage_id=won_stage.id,
                owner_id=owner_id,
                organization_id=org.id,
                public_id=uuid.uuid4(),
                currency="USD",
                probability=100,
                custom_fields={}
            )
            deal2 = CRMDeal(
                title="Hooli CRM Setup",
                status=DealStatus.OPEN,
                value=30000.0,
                pipeline_id=pipeline.id,
                stage_id=negotiation_stage.id if negotiation_stage else won_stage.id,
                owner_id=owner_id,
                organization_id=org.id,
                public_id=uuid.uuid4(),
                currency="USD",
                probability=80,
                custom_fields={}
            )
            deal3 = CRMDeal(
                title="Umbrella Cloud Transition",
                status=DealStatus.WON,
                value=110000.0,
                pipeline_id=pipeline.id,
                stage_id=won_stage.id,
                owner_id=owner_id,
                organization_id=org.id,
                public_id=uuid.uuid4(),
                currency="USD",
                probability=100,
                custom_fields={}
            )
            session.add(deal1)
            session.add(deal2)
            session.add(deal3)
            await session.flush()
            print("Seeded CRM Deals.")

            # 4. Seed Projects (mirroring the won deals)
            result_projects = await session.execute(
                select(Project).where(Project.organization_id == org.id)
            )
            existing_projects = result_projects.scalars().all()
            if not existing_projects:
                today_date = date.today()
                proj1 = Project(
                    name="Initech Legacy Upgrade Project",
                    status=ProjectStatus.ACTIVE,
                    start_date=today_date,
                    end_date=today_date + timedelta(days=30),
                    budget=15000.0,
                    currency="USD",
                    owner_id=owner_id,
                    organization_id=org.id,
                    public_id=uuid.uuid4(),
                    deal_id=deal1.id
                )
                proj2 = Project(
                    name="Umbrella Cloud Transition Project",
                    status=ProjectStatus.IN_PROGRESS,
                    start_date=today_date,
                    end_date=today_date + timedelta(days=45),
                    budget=110000.0,
                    currency="USD",
                    owner_id=owner_id,
                    organization_id=org.id,
                    public_id=uuid.uuid4(),
                    deal_id=deal3.id
                )
                session.add(proj1)
                session.add(proj2)
                await session.flush()

                # Link projects back to deals
                deal1.project_id = proj1.id
                deal3.project_id = proj2.id
                await session.flush()
                print("Seeded Projects and linked to Deals.")

        await session.commit()
        print("Database seeding completed successfully.")

if __name__ == "__main__":
    asyncio.run(seed_db())
