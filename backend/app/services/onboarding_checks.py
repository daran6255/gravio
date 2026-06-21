import re
import random
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.organization import Organization
from app.repositories.user import UserRepository
from app.repositories.trial_registry import TrialRegistryRepository

def normalize_org_name(name: str) -> str:
    """Normalize organization name to lowercase and strip all punctuation, spaces, and common suffixes."""
    # 1. Convert to lowercase and strip whitespace
    n = name.lower().strip()
    # 2. Remove all non-alphanumeric characters (keep spaces, letters, numbers)
    n = re.sub(r'[^a-z0-9\s]', '', n)
    # 3. Split into words
    words = n.split()
    # 4. Filter out common suffixes
    ignored_words = {
        'technologies', 'technology', 'inc', 'incorporated', 'co', 'company', 
        'corp', 'corporation', 'ltd', 'limited', 'pvt', 'private', 'llc', 
        'solutions', 'services', 'group', 'labs', 'software', 'org', 'foundation',
        'infosystems', 'infosystem', 'systems', 'system', 'associates', 'partners',
        'consulting', 'ventures', 'global', 'information', 'data', 'tech'
    }
    filtered_words = [w for w in words if w not in ignored_words]
    # 5. Join words back (without spaces to compare contiguous sequences)
    return "".join(filtered_words) if filtered_words else "".join(words)

def levenshtein_distance(s1: str, s2: str) -> int:
    """Compute the Levenshtein edit distance between two strings."""
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)
    
    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
        
    return previous_row[-1]

async def check_org_name_availability(db: AsyncSession, name: str) -> dict:
    """Check if an organization name or logically similar name is already in use."""
    name_clean = name.strip()
    if not name_clean:
        return {"available": False, "message": "Organization name cannot be empty."}

    # 1. Exact case-insensitive database check first
    stmt = select(Organization).where(func.lower(Organization.name) == name_clean.lower())
    result = await db.execute(stmt)
    if result.scalars().first():
        return {
            "available": False,
            "exists": True,
            "similarity": "exact",
            "message": f"An organization named '{name_clean}' already exists."
        }

    # 2. Fuzzy / logical similarity check
    norm_input = normalize_org_name(name_clean)
    if not norm_input:
        return {"available": True}

    # Fetch all organization names from DB (normally a small list in CRM)
    stmt = select(Organization.name)
    result = await db.execute(stmt)
    existing_names = result.scalars().all()

    for exist_name in existing_names:
        norm_exist = normalize_org_name(exist_name)
        # Direct exact match on normalized values (e.g. 'edzolo technologies' matches 'edzolo')
        if norm_input == norm_exist:
            return {
                "available": False,
                "exists": True,
                "similarity": "logical",
                "matched_name": exist_name,
                "message": f"An organization with a logically similar name '{exist_name}' already exists."
            }
        # Substring logical comparison (for brand prefixes/suffixes, length >= 4)
        if (len(norm_input) >= 4 and len(norm_exist) >= 4) and (norm_input in norm_exist or norm_exist in norm_input):
            return {
                "available": False,
                "exists": True,
                "similarity": "logical",
                "matched_name": exist_name,
                "message": f"An organization with a logically similar name '{exist_name}' already exists."
            }
        # Check Levenshtein distance on normalized strings if length >= 3
        if len(norm_input) >= 3 and len(norm_exist) >= 3:
            dist = levenshtein_distance(norm_input, norm_exist)
            if dist <= 1:
                return {
                    "available": False,
                    "exists": True,
                    "similarity": "fuzzy",
                    "matched_name": exist_name,
                    "message": f"An organization with a very similar name '{exist_name}' already exists."
                }

    return {"available": True}

async def generate_username_suggestions(db: AsyncSession, base_username: str) -> list[str]:
    """Generate up to 3 available username suggestions based on a base username."""
    suggestions = []
    tries = 0
    # Clean the username base
    base_clean = re.sub(r'[^a-z0-9_]', '', base_username.lower())
    if not base_clean:
        base_clean = "user"
        
    while len(suggestions) < 3 and tries < 30:
        suffix = random.choice(["_admin", "_org", str(random.randint(10, 99)), str(random.randint(100, 999))])
        candidate = f"{base_clean}{suffix}"
        if len(candidate) > 30:
            candidate = candidate[:30]
        if candidate not in suggestions:
            user_exists = await UserRepository.get_by_username(db, candidate)
            if not user_exists:
                suggestions.append(candidate)
        tries += 1
    return suggestions

async def check_username_availability(db: AsyncSession, username: str) -> dict:
    """Validate format and check if a username is already taken."""
    username_clean = username.strip().lower()
    if not username_clean:
        return {"available": False, "message": "Username cannot be empty."}

    # Format regex check
    if not re.match(r"^[a-z0-9_]{3,30}$", username_clean):
        return {
            "available": False,
            "message": "Username must be 3-30 characters long and contain only lowercase letters, numbers, and underscores."
        }

    # Query existence
    user = await UserRepository.get_by_username(db, username_clean)
    suggestions = await generate_username_suggestions(db, username_clean)
    if user:
        return {
            "available": False,
            "exists": True,
            "suggestions": suggestions,
            "message": f"Username '{username}' is already taken."
        }

    return {
        "available": True,
        "suggestions": suggestions
    }

async def check_email_availability(db: AsyncSession, email: str) -> dict:
    """Validate email existence in users database and trial registry."""
    email_clean = email.strip().lower()
    if not email_clean:
        return {"available": False, "message": "Email address cannot be empty."}

    # Basic email format check
    if not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email_clean):
        return {
            "available": False,
            "message": "Invalid email address format."
        }

    # 1. Check trial registry
    if await TrialRegistryRepository.exists_by_email(db, email_clean):
        return {
            "available": False,
            "exists": True,
            "reason": "trial_consumed",
            "message": f"The email '{email_clean}' has already consumed its free trial."
        }

    # 2. Check users database
    user = await UserRepository.get_by_email(db, email_clean)
    if user:
        return {
            "available": False,
            "exists": True,
            "reason": "email_taken",
            "message": f"The email '{email_clean}' is already registered."
        }

    return {"available": True}
