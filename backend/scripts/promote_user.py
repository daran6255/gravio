
import asyncio
import sys
import os

# Add parent directory to path to allow importing app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select, update
from app.core.database import AsyncSessionLocal
from app.models.user import User

async def promote_user(email: str):
    async with AsyncSessionLocal() as session:
        # Find user
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if not user:
            print(f"Error: User with email '{email}' not found.")
            return

        # Update user
        if user.is_superuser:
            print(f"User '{email}' is already a superuser.")
            return

        stmt = update(User).where(User.email == email).values(is_superuser=True)
        await session.execute(stmt)
        await session.commit()
        
        print(f"Success: User '{email}' has been promoted to Superuser.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/promote_user.py <email>")
        sys.exit(1)
        
    email = sys.argv[1]
    asyncio.run(promote_user(email))
