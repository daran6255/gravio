"""Garbage Collection and Memory Management Middleware"""

import gc
import time
import logging
import asyncio
import psutil
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

class GarbageCollectorMiddleware(BaseHTTPMiddleware):
    """
    Middleware to monitor requests and periodically trigger garbage collection
    to ensure RAM is freed and memory leaks/fragmentation are minimized.
    """
    
    def __init__(self, app, collect_every_requests: int = 100):
        super().__init__(app)
        self.collect_every_requests = collect_every_requests
        self.request_counter = 0
        
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        self.request_counter += 1
        
        response = await call_next(request)
        
        # Periodically trigger GC after request finishes
        if self.request_counter >= self.collect_every_requests:
            self.request_counter = 0
            # Run gc.collect() in a separate thread so it doesn't block the async loop
            asyncio.create_task(self._collect_garbage())
            
        return response

    async def _collect_garbage(self):
        """Run garbage collection in a separate thread pool to prevent event loop blocking"""
        loop = asyncio.get_running_loop()
        start_time = time.time()
        
        # Run gc.collect inside running executor
        collected = await loop.run_in_executor(None, gc.collect)
        duration = time.time() - start_time
        
        logger.info(
            f"Periodic garbage collection triggered after requests. "
            f"Cleaned {collected} objects in {duration:.4f}s."
        )


async def memory_monitor_task(interval_seconds: int = 60, memory_threshold_percent: float = 85.0):
    """
    Background task to monitor RAM memory usage and trigger garbage collection.
    Runs periodically to ensure memory is reclaimed.
    """
    logger.info("Starting memory monitor background task...")
    process = psutil.Process()
    
    while True:
        try:
            await asyncio.sleep(interval_seconds)
            
            # Get process memory info
            mem_info = process.memory_info()
            rss_mb = mem_info.rss / (1024 * 1024)
            
            # Get system memory percent
            sys_mem = psutil.virtual_memory()
            sys_percent = sys_mem.percent
            
            logger.debug(f"Memory Status - Process RSS: {rss_mb:.2f} MB | System RAM: {sys_percent}%")
            
            # Trigger GC if system RAM is high or process RSS is large (e.g. > 500MB)
            if sys_percent > memory_threshold_percent or rss_mb > 500:
                logger.warning(
                    f"High memory usage detected! System RAM: {sys_percent}%, Process RSS: {rss_mb:.2f} MB. "
                    "Running garbage collection..."
                )
                
                loop = asyncio.get_running_loop()
                collected = await loop.run_in_executor(None, gc.collect)
                
                # Re-check RSS after collection
                mem_info_after = process.memory_info()
                rss_mb_after = mem_info_after.rss / (1024 * 1024)
                freed_mb = rss_mb - rss_mb_after
                
                logger.info(
                    f"Garbage collection completed. Cleaned {collected} objects. "
                    f"Process RSS: {rss_mb_after:.2f} MB (Freed {freed_mb:.2f} MB)."
                )
                
        except asyncio.CancelledError:
            logger.info("Memory monitor task cancelled.")
            break
        except Exception as e:
            logger.error(f"Error in memory monitor task: {e}")
