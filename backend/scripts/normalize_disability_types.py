import asyncio
import sys
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# Add the parent directory to the path so we can import app
# This script should be run from the backend directory: python scripts/normalize_disability_types.py
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import AsyncSessionLocal, engine
from app.models.candidate import Candidate
from sqlalchemy import select, update

# Normalization Mapping (Case-insensitive match, standardized replacement)
NORMALIZATION_MAP = {
    "hearing impairment (deaf and hard of hearing)": "Hearing Impairment (Deaf and Hard of Hearing)",
    "low-vision": "Low Vision",
    "low vision": "Low Vision",
}

async def normalize_disability_types(dry_run: bool = True):
    """
    Standardizes disability types in the candidate table.
    - fetches all candidates with disability details
    - checks if the type needs normalization
    - updates the JSON field
    """
    async with AsyncSessionLocal() as session:
        logger.info(f"--- Disability Type Normalization ({'DRY RUN' if dry_run else 'LIVE UPDATE'}) ---")
        
        # Fetch all candidates who have disability details (including deleted for consistency)
        query = select(Candidate).where(
            Candidate.disability_details.isnot(None)
        )
        result = await session.execute(query)
        candidates = result.scalars().all()
        
        logger.info(f"Found {len(candidates)} candidates with disability details.")
        
        update_count = 0
        for candidate in candidates:
            details = candidate.disability_details
            if not details or 'disability_type' not in details:
                continue
                
            original_type = details.get('disability_type')
            if not original_type:
                continue
                
            # Check for normalization
            normalized_type = NORMALIZATION_MAP.get(original_type.lower())
            
            # Additional check: If it's already in the map but with wrong casing, normalize it
            if not normalized_type:
                # Basic title case normalization for others or if not explicitly in map
                # but we only want to touch the ones requested by user for safety.
                continue
                
            if original_type != normalized_type:
                logger.info(f"Candidate ID {candidate.id} ({candidate.name}): '{original_type}' -> '{normalized_type}'")
                
                if not dry_run:
                    # Update the candidate object
                    # We create a copy of the dict to ensure SQLAlchemy detects the change
                    new_details = dict(details)
                    new_details['disability_type'] = normalized_type
                    candidate.disability_details = new_details
                    session.add(candidate)
                
                update_count += 1

        if not dry_run and update_count > 0:
            await session.commit()
            logger.info(f"SUCCESS: Successfully updated {update_count} candidates.")
        elif dry_run:
            logger.info(f"DRY RUN COMPLETE: {update_count} candidates would be updated.")
        else:
            logger.info("No candidates required normalization.")

async def main():
    # Default to dry run for safety
    is_dry_run = "--live" not in sys.argv
    
    if is_dry_run:
        logger.info("NOTE: Running in DRY RUN mode. Use '--live' flag to commit changes.")
        
    try:
        await normalize_disability_types(dry_run=is_dry_run)
    except Exception as e:
        logger.error(f"An error occurred: {e}")
    finally:
        # Close the engine
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
