"""Pincode Service for fetching location details"""

import httpx
from loguru import logger
from fastapi import HTTPException, status


async def get_pincode_details(pincode: str, country_code: str = "IN") -> dict:
    """
    Fetch city, district, and state from pincode using external API.
    Uses: https://api.postalpincode.in/pincode/{pincode}
    """
    url = f"https://api.postalpincode.in/pincode/{pincode}"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, timeout=5.0)
            response.raise_for_status()
            data = response.json()
            
            if not data or data[0].get("Status") != "Success":
                logger.warning(f"Invalid pincode or API error for: {pincode}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid pincode"
                )
                
            post_offices = data[0].get("PostOffice", [])
            if not post_offices:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No details found for this pincode"
                )
            
            # Extract details from the first post office entry
            details = post_offices[0]
            
            return {
                "city": details.get("Block", details.get("Name", "")), # Prefer Block, fallback to Name
                "district": details.get("District", ""),
                "state": details.get("State", "")
            }
            
        except httpx.RequestError as e:
            logger.error(f"Pincode API request failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Pincode service temporarily unavailable"
            )
            
        except httpx.RequestError as e:
            logger.error(f"Pincode API request failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Could not verify pincode service"
            )
        except Exception as e:
            logger.error(f"Error processing pincode data: {e}")
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error verifying pincode"
            )
