"""
AI Engine — Response Synthesizer
===============================

Responsible for transforming raw tool results and LLM reasoning into
professional, human-readable summaries. Handles 'REVEAL_DATA' mapping
for domain-specific analytics.
"""

from typing import Any
from app.ai.brain.schemas import ToolCallRequest, ToolResult


class Synthesizer:
    """
    Orchestrates the creation of the final user response.
    Can be extended with domain-specific synthesis logic.
    """

    def synthesize_tool_results(
        self, 
        results: list[tuple[ToolCallRequest, ToolResult]],
        planned_response: str | None = None
    ) -> str:
        """
        Builds a professional response from a list of tool execution outcomes.
        If REVEAL_DATA is present in results, it maps them to rich summaries.
        """
        if not results:
            return planned_response or "I've processed your request."

        full_content = ""
        response_lines = []

        for req, res in results:
            if res.success:
                # Use the tool's own message — already human-readable
                response_lines.append(res.message)
                
                # Check for REVEAL_DATA (Special analytics mapping)
                if res.data and res.data.get("REVEAL_DATA"):
                    reveal = res.data["REVEAL_DATA"]
                    mapped = self._map_reveal_data(reveal, res.message)
                    if mapped:
                        full_content = mapped
                elif not full_content:
                    full_content = res.message
            else:
                response_lines.append(f"⚠️ Tool '{req.tool_name}' encountered an issue: {res.message}")

        # If multiple tools and no reveal data, join all messages
        if len(results) > 1 and not full_content:
            full_content = "\n\n".join(response_lines)
            
        return full_content or planned_response or "Task completed."

    def _map_reveal_data(self, reveal: str, original_message: str) -> str | None:
        """
        Maps technical REVEAL_DATA tokens to professional markdown summaries.
        """
        if "ACTUAL_CANDIDATE_COUNT" in reveal:
            count = reveal.split(":")[-1].strip()
            return (
                f"There are currently **{count}** registered candidates in the system.\n\n"
                f"*Detailed breakdown:* {original_message}"
            )
        
        if "CANDIDATE_ANALYTICS" in reveal:
            return f"📊 **Candidate Analytics**\n\n{original_message}"
            
        if "PIPELINE_VALUE" in reveal:
            return f"📊 **Sales Pipeline Overview**\n\n{original_message}"
            
        if "STAFF_PERFORMANCE" in reveal:
            return f"👤 **Staff Performance Report**\n\n{original_message}"
            
        if "PENDING_DSR_COUNT" in reveal:
            count = reveal.split("PENDING_DSR_COUNT:")[-1].split(",")[0].strip()
            return f"📋 **{count} users** have not submitted their DSR.\n\n{original_message}"
            
        if "TRAINING_STATS" in reveal:
            return f"🎓 **Training Analytics**\n\n{original_message}"
            
        if "LEAD_COUNTS" in reveal:
            return f"🎯 **Lead Pipeline**\n\n{original_message}"
            
        return None
