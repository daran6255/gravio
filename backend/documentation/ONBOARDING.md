# Team Onboarding Checklist

Use this checklist when onboarding new developers to the project.

## Before Day 1

- [ ] Send them links to install:
  - [ ] Python 3.11+ from python.org
  - [ ] PostgreSQL 15+ from postgresql.org
  - [ ] Git from git-scm.com
  - [ ] VS Code or PyCharm (optional)

- [ ] Give them repository access

## Day 1 - Setup

- [ ] Clone repository
- [ ] Run `.\setup.ps1` (automated setup)
- [ ] Create PostgreSQL database
- [ ] Configure `.env` file
- [ ] Run `alembic upgrade head`
- [ ] Start server and verify it works
- [ ] Run `.\test_app.ps1` successfully

## Day 1 - Orientation

- [ ] Review [QUICKSTART.md](QUICKSTART.md)
- [ ] Review [README.md](README.md)
- [ ] Review project structure
- [ ] Show them http://localhost:8000/docs
- [ ] Explain authentication flow
- [ ] Show example: Register → Login → Use token

## Day 2 - First Task

- [ ] Assign a simple feature (e.g., add a model and endpoint)
- [ ] Guide them through:
  - [ ] Creating model in `app/models/`
  - [ ] Creating schema in `app/schemas/`
  - [ ] Creating repository in `app/repositories/`
  - [ ] Creating service in `app/services/`
  - [ ] Creating endpoint in `app/api/v1/endpoints/`
  - [ ] Creating migration with `alembic revision --autogenerate`
  - [ ] Applying migration with `alembic upgrade head`
  - [ ] Testing in Swagger docs

## Ongoing

- [ ] Code review their pull requests
- [ ] Ensure they follow the established patterns
- [ ] Encourage them to update documentation
- [ ] Regular check-ins for questions

---

## Quick Reference for New Dev

**Setup** → Read [QUICKSTART.md](QUICKSTART.md)  
**Problems** → Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)  
**Details** → See [WINDOWS_SETUP.md](WINDOWS_SETUP.md)  
**Full Docs** → Read [README.md](README.md)  

**Daily Workflow:**
1. `.\venv\Scripts\activate`
2. `git pull`
3. `alembic upgrade head`
4. `uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`
5. Make changes
6. Create migration if needed
7. Test
8. Commit & push
