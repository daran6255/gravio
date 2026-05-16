import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.utils.email import send_registration_emails

@pytest.mark.anyio
async def test_email_templates_content():
    """Test that email templates are generated with correct content"""
    # Mock candidate data
    class MockCandidate:
        def __init__(self, name, email, phone, disability_details):
            self.name = name
            self.email = email
            self.phone = phone
            self.disability_details = disability_details

    candidate = MockCandidate(
        name="John Doe",
        email="john@example.com",
        phone="1234567890",
        disability_details={"disability_type": "Visual Impairment"}
    )

    from app.utils.email import get_candidate_template, get_sourcing_team_template
    
    # Test candidate template
    candidate_html = get_candidate_template(candidate.name)
    assert "John Doe" in candidate_html
    assert "Registration Successful" in candidate_html
    
    # Test sourcing team template
    team_html = get_sourcing_team_template(candidate)
    assert "John Doe" in team_html
    assert "john@example.com" in team_html
    assert "Visual Impairment" in team_html
    assert "NEW CANDIDATE ALERT" in team_html


@pytest.mark.anyio
async def test_send_registration_emails_calls(db_session: AsyncSession):
    """Test that send_registration_emails calls send_email twice"""
    # Create a mock candidate
    mock_candidate = MagicMock()
    mock_candidate.name = "John Doe"
    mock_candidate.email = "john@example.com"
    mock_candidate.phone = "1234567890"
    mock_candidate.disability_details = {"disability_type": "Visual Impairment"}

    with patch("app.utils.email.send_email", new_callable=AsyncMock) as mock_send:
        await send_registration_emails(mock_candidate)
        
        # Should be called twice: once for candidate, once for sourcing team
        assert mock_send.call_count == 2
        
        # Verify candidate email call
        # call_args_list is a list of call objects. Each call object is a tuple (args, kwargs)
        candidate_args = mock_send.call_args_list[0]
        assert candidate_args[0][0] == "john@example.com"
        assert "Registration Successful" in candidate_args[0][1]
        
        # Verify sourcing team email call
        team_args = mock_send.call_args_list[1]
        assert team_args[0][0] == "info@winvinayafoundation.org"
        assert "New Candidate Registered" in team_args[0][1]


@pytest.mark.anyio
async def test_register_candidate_triggers_background_task(client: AsyncClient):
    """Test that registration endpoint adds the email task to background tasks"""
    candidate_data = {
        "name": "Jane Doe",
        "gender": "Female",
        "email": "jane@example.com",
        "phone": "9876543210",
        "pincode": "560001",
        "disability_details": {
            "is_disabled": True,
            "disability_type": "Hearing Impairment",
            "disability_percentage": 40.0
        },
        "education_details": {
            "degrees": [
                {
                    "degree_name": "Bachelor of Arts",
                    "specialization": "History",
                    "college_name": "Main University",
                    "year_of_passing": 2022,
                    "percentage": 75.5
                }
            ]
        }
    }

    # We need to mock background tasks or the service that sends emails
    # Since we use background_tasks.add_task(send_registration_emails, candidate)
    # in the endpoint, we can patch send_registration_emails.
    
    with patch("app.api.v1.endpoints.candidates.send_registration_emails", new_callable=AsyncMock) as mock_send_reg:
        # Patch pincode service to avoid external API calls during test
        with patch("app.services.candidate_service.get_pincode_details", new_callable=AsyncMock) as mock_pincode:
            mock_pincode.return_value = {
                "city": "Bengaluru",
                "district": "Bengaluru",
                "state": "Karnataka"
            }
            
            response = await client.post("/api/v1/candidates/", json=candidate_data)
            
            assert response.status_code == 201
            # In a real integration test with BackgroundTasks, the task is executed 
            # after the response is returned. Starlette's BackgroundTasks are 
            # executed when the response is finished in the middleware/server loop.
            # In clinical testing of FastAPI with TestClient/AsyncClient, 
            # BackgroundTasks are executed by the client call itself.
            
            assert mock_send_reg.called
            # The argument passed should be the candidate object
            args, _ = mock_send_reg.call_args
            assert args[0].name == "Jane Doe"
            assert args[0].email == "jane@example.com"
