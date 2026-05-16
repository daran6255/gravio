import requests
from datetime import datetime, timezone

BASE_URL = "http://127.0.0.1:8000/api/v1"
MOCK_INTERVIEW_URL = f"{BASE_URL}/training-extensions/mock-interviews"

# Note: You need a valid JWT token to test this if authentication is enabled.
# Since I'm in a dev environment, I might need to skip auth or use a token.
# For now, I'll assume I can't easily get a token without user input, 
# but I can try to check if the endpoint is protected.

def test_create_mock_interview():
    payload = {
        "batch_id": 2,
        "candidate_id": 36,
        "interviewer_name": "Antigravity Expert",
        "interview_date": datetime.now(timezone.utc).isoformat(),
        "questions": [
            {"question": "How do you handle datetime in Python?", "answer": "Use timezone-aware objects."}
        ],
        "skills": [
            {"skill": "Python", "level": "Expert", "rating": 10}
        ],
        "feedback": "Excellent structured data handling.",
        "overall_rating": 9,
        "status": "cleared"
    }
    
    # This will likely fail with 401 if auth is on, but it's a good check.
    # In this CRM, most endpoints require a token.
    try:
        response = requests.post(MOCK_INTERVIEW_URL, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_create_mock_interview()
