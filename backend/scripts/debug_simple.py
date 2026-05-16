
import asyncio
import sys
import os

# Ensure we can import app
sys.path.append(os.getcwd())

from app.core.database import AsyncSessionLocal, engine
from sqlalchemy import text

async def check_db():
    print("START_VERIFICATION", flush=True)
    try:
        async with AsyncSessionLocal() as session:
            
            # Fetch Candidates
            query = """
            SELECT c.id, c.name, c.public_id, c.disability_details 
            FROM candidates c
            JOIN candidate_counseling cc ON c.id = cc.candidate_id
            WHERE c.is_deleted = false AND lower(cc.status) = 'selected'
            """
            result = await session.execute(text(query))
            candidates = result.fetchall()
            
            print(f"Checking {len(candidates)} selected candidates...", flush=True)
            
            newly_eligible_count = 0
            
            for c in candidates:
                c_id, name, pid, disability = c
                
                # Check allocations
                alloc_query = """
                SELECT tca.id, tca.is_dropout, tb.status, tb.batch_name
                FROM training_candidate_allocations tca
                JOIN training_batches tb ON tca.batch_id = tb.id
                WHERE tca.candidate_id = :cid AND tca.is_deleted = false
                """
                alloc_result = await session.execute(text(alloc_query), {"cid": c_id})
                allocs = alloc_result.fetchall()
                
                is_currently_blocked = False
                blocking_reason = ""
                
                if not allocs:
                     # No allocations at all - they were always visible
                     pass
                else:
                    for a in allocs:
                        aid, is_dropout, batch_status, batch_name = a
                        if is_dropout:
                            continue # Dropouts don't block
                        
                        if batch_status in ['planned', 'running', 'extended']:
                            is_currently_blocked = True
                            blocking_reason = f"Allocated to '{batch_name}' ({batch_status})"
                            break
                        else:
                            # e.g. 'completed' - this REASON used to block them, but now shouldn't!
                            pass
                
                if not is_currently_blocked:
                    # They are eligible now (either no allocs or only completed/dropout allocs)
                    # Check if they HAVE a completed alloc (meaning my fix helped them)
                    has_completed_non_dropout = False
                    for a in allocs:
                        aid, is_dropout, batch_status, batch_name = a
                        if not is_dropout and batch_status == 'completed':
                            has_completed_non_dropout = True
                            print(f"Candidate '{name}' is now ELIGIBLE! Has completed batch '{batch_name}'.", flush=True)
                    
                    if has_completed_non_dropout:
                        newly_eligible_count += 1
                else:
                    print(f"Candidate '{name}' is BLOCKED. Reason: {blocking_reason}", flush=True)

            print(f"Total candidates who became eligible due to fix: {newly_eligible_count}", flush=True)

    except Exception as e:
        print(f"Error: {e}", flush=True)
        import traceback
        traceback.print_exc()
    finally:
        await engine.dispose()
    print("END_VERIFICATION", flush=True)

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(check_db())
