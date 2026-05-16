"""
AI Brain — Long Term Memory & Learning
======================================

Handles the "Experience" layer of the AI. 
It retrieves successful past task patterns (few-shot learning) to improve 
the accuracy of the planner and extraction services.
"""

import logging
from typing import Any, TYPE_CHECKING
from sqlalchemy import select, text
from app.models.ai_task_log import AITaskLog, AITaskStatus

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

class BrainMemory:
    """
    Manages historical context retrieval to provide "Experience" to the AI.
    """

    def __init__(self, db: "AsyncSession"):
        self._db = db

    async def get_similar_successful_tasks(self, task_hint: str, limit: int = 3) -> list[dict]:
        """
        Retrieves past successful tasks that are semantically or structurally similar.
        For now, we use a simple keyword match on task_name, but this can be upgraded 
        to vector search (pgvector) in the future.
        """
        # Extract potential keywords from hint
        keywords = [w for w in task_hint.split() if len(w) > 4]
        if not keywords:
            return []

        search_clause = " OR ".join([f"task_name ILIKE '%{kw}%'" for kw in keywords[:3]])
        
        try:
            result = await self._db.execute(
                select(AITaskLog)
                .where(text(search_clause))
                .where(AITaskLog.status == AITaskStatus.COMPLETED)
                .order_by(AITaskLog.created_at.desc())
                .limit(limit)
            )
            logs = result.scalars().all()
            
            examples = []
            for log in logs:
                if log.plan and log.summary:
                    examples.append({
                        "task": log.task_name,
                        "plan": log.plan,
                        "outcome": log.summary
                    })
            return examples
        except Exception as e:
            logger.warning(f"Memory retrieval failed: {e}")
            return []

    async def learn_from_success(self, task_log_id: int):
        """
        Analyzes a successful task and extracts potential new knowledge 
        (e.g., new skills, better planning patterns).
        [Future Enhancement]
        """
        pass
