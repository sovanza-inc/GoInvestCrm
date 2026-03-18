"""
GoSocial API Tests - Post-Refactor Verification
Tests all API endpoints after server.py was refactored into modular route files.
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

# API base URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://sales-autopilot-21.preview.emergentagent.com"

# Test user credentials - unique per run
TEST_EMAIL = f"test_user_{uuid.uuid4().hex[:8]}@gosocial.com"
TEST_PASSWORD = "TestPass123!"
TEST_NAME = "Test User"


class TestAuthRoutes:
    """Auth endpoints: /api/auth/register, /api/auth/login, /api/auth/me"""
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    @pytest.fixture(scope="class")
    def registered_user(self, session):
        """Register a new test user and return token + user data"""
        response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "name": TEST_NAME,
            "company": "Test Company"
        })
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        return data
    
    def test_register_user_success(self, session, registered_user):
        """Test user registration with 7-day trial"""
        assert "token" in registered_user
        assert registered_user["user"]["email"] == TEST_EMAIL
        assert registered_user["user"]["name"] == TEST_NAME
        print(f"✓ User registered: {TEST_EMAIL}")
    
    def test_register_duplicate_email_fails(self, session, registered_user):
        """Test duplicate email registration is rejected"""
        response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "name": "Duplicate User"
        })
        assert response.status_code == 400
        assert "already registered" in response.json().get("detail", "").lower()
        print("✓ Duplicate email registration correctly rejected")
    
    def test_login_success(self, session, registered_user):
        """Test login with registered user"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        print("✓ Login successful")
    
    def test_login_invalid_credentials(self, session):
        """Test login with wrong password"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": "WrongPassword123"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials correctly rejected")
    
    def test_get_me_authenticated(self, session, registered_user):
        """Test /api/auth/me with valid token"""
        token = registered_user["token"]
        response = session.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        print("✓ GET /api/auth/me works with valid token")
    
    def test_get_me_unauthenticated(self, session):
        """Test /api/auth/me without token"""
        response = session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ GET /api/auth/me correctly rejects unauthenticated request")


class TestLeadsRoutes:
    """Leads CRUD: /api/leads"""
    
    @pytest.fixture(scope="class")
    def auth_header(self):
        """Login and return auth header"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            # Register if not exists
            response = requests.post(f"{BASE_URL}/api/auth/register", json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "name": TEST_NAME
            })
        data = response.json()
        return {"Authorization": f"Bearer {data['token']}"}
    
    @pytest.fixture(scope="class")
    def session(self, auth_header):
        s = requests.Session()
        s.headers.update(auth_header)
        return s
    
    def test_get_leads_empty(self, session):
        """Test getting leads list"""
        response = session.get(f"{BASE_URL}/api/leads")
        assert response.status_code == 200
        data = response.json()
        assert "leads" in data
        assert "total" in data
        print(f"✓ GET /api/leads returns {data['total']} leads")
    
    def test_create_lead(self, session):
        """Test creating a new lead"""
        lead_data = {
            "name": "TEST_Lead Person",
            "handle": f"test_lead_{uuid.uuid4().hex[:6]}",
            "platform": "instagram",
            "bio": "Test bio for lead",
            "followers": 10000,
            "engagement_rate": 5.5,
            "tags": ["test", "automated"],
            "notes": "Created by automated test"
        }
        response = session.post(f"{BASE_URL}/api/leads", json=lead_data)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == lead_data["name"]
        assert data["handle"] == lead_data["handle"]
        assert "id" in data
        assert "score" in data
        print(f"✓ POST /api/leads created lead with ID: {data['id']}")
        return data["id"]
    
    def test_create_and_get_lead(self, session):
        """Test creating a lead and getting it by ID"""
        # Create
        lead_data = {
            "name": "TEST_Get Lead",
            "handle": f"test_get_{uuid.uuid4().hex[:6]}",
            "platform": "linkedin",
            "followers": 5000,
            "engagement_rate": 3.2
        }
        create_response = session.post(f"{BASE_URL}/api/leads", json=lead_data)
        assert create_response.status_code == 200
        lead_id = create_response.json()["id"]
        
        # Get by ID
        get_response = session.get(f"{BASE_URL}/api/leads/{lead_id}")
        assert get_response.status_code == 200
        fetched_lead = get_response.json()
        assert fetched_lead["id"] == lead_id
        assert fetched_lead["name"] == lead_data["name"]
        print(f"✓ GET /api/leads/{lead_id} returns correct lead")
    
    def test_update_lead(self, session):
        """Test updating a lead"""
        # Create lead first
        lead_data = {
            "name": "TEST_Update Lead",
            "handle": f"test_update_{uuid.uuid4().hex[:6]}",
            "platform": "twitter",
            "followers": 8000,
            "engagement_rate": 4.0
        }
        create_response = session.post(f"{BASE_URL}/api/leads", json=lead_data)
        lead_id = create_response.json()["id"]
        
        # Update
        update_data = {"name": "TEST_Updated Lead Name", "status": "contacted"}
        update_response = session.put(f"{BASE_URL}/api/leads/{lead_id}", json=update_data)
        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated["name"] == "TEST_Updated Lead Name"
        assert updated["status"] == "contacted"
        
        # Verify persistence
        get_response = session.get(f"{BASE_URL}/api/leads/{lead_id}")
        assert get_response.json()["name"] == "TEST_Updated Lead Name"
        print(f"✓ PUT /api/leads/{lead_id} updates lead correctly")
    
    def test_delete_lead(self, session):
        """Test deleting a lead"""
        # Create lead first
        lead_data = {
            "name": "TEST_Delete Lead",
            "handle": f"test_delete_{uuid.uuid4().hex[:6]}",
            "platform": "facebook",
            "followers": 3000,
            "engagement_rate": 2.5
        }
        create_response = session.post(f"{BASE_URL}/api/leads", json=lead_data)
        lead_id = create_response.json()["id"]
        
        # Delete
        delete_response = session.delete(f"{BASE_URL}/api/leads/{lead_id}")
        assert delete_response.status_code == 200
        assert "deleted" in delete_response.json().get("message", "").lower()
        
        # Verify deletion
        get_response = session.get(f"{BASE_URL}/api/leads/{lead_id}")
        assert get_response.status_code == 404
        print(f"✓ DELETE /api/leads/{lead_id} deletes lead correctly")
    
    def test_get_leads_with_filters(self, session):
        """Test lead filtering"""
        response = session.get(f"{BASE_URL}/api/leads", params={
            "platform": "instagram",
            "sort_by": "score",
            "sort_order": "desc",
            "limit": 10
        })
        assert response.status_code == 200
        data = response.json()
        assert "leads" in data
        print(f"✓ GET /api/leads with filters works, returned {len(data['leads'])} leads")


class TestConversationsRoutes:
    """Conversations: /api/conversations"""
    
    @pytest.fixture(scope="class")
    def auth_header(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            response = requests.post(f"{BASE_URL}/api/auth/register", json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "name": TEST_NAME
            })
        return {"Authorization": f"Bearer {response.json()['token']}"}
    
    @pytest.fixture(scope="class")
    def session(self, auth_header):
        s = requests.Session()
        s.headers.update(auth_header)
        return s
    
    def test_get_conversations(self, session):
        """Test getting conversations list"""
        response = session.get(f"{BASE_URL}/api/conversations")
        assert response.status_code == 200
        data = response.json()
        assert "conversations" in data
        print(f"✓ GET /api/conversations returns {len(data['conversations'])} conversations")
        return data["conversations"]
    
    def test_get_conversation_by_id(self, session):
        """Test getting a single conversation with messages"""
        # First get list to find an ID
        convos = self.test_get_conversations(session)
        if len(convos) > 0:
            conv_id = convos[0]["id"]
            response = session.get(f"{BASE_URL}/api/conversations/{conv_id}")
            assert response.status_code == 200
            data = response.json()
            assert "conversation" in data
            assert "messages" in data
            print(f"✓ GET /api/conversations/{conv_id} returns conversation with messages")
        else:
            print("⚠ No conversations to test - need to seed data first")
    
    def test_get_nonexistent_conversation(self, session):
        """Test getting a non-existent conversation returns 404"""
        response = session.get(f"{BASE_URL}/api/conversations/nonexistent-id")
        assert response.status_code == 404
        print("✓ GET /api/conversations/nonexistent-id returns 404")


class TestAIRoutes:
    """AI endpoints: /api/ai/suggest-reply, /api/ai/score-lead"""
    
    @pytest.fixture(scope="class")
    def session(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            response = requests.post(f"{BASE_URL}/api/auth/register", json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "name": TEST_NAME
            })
        s = requests.Session()
        s.headers.update({"Authorization": f"Bearer {response.json()['token']}"})
        return s
    
    def test_ai_suggest_reply(self, session):
        """Test AI suggest reply endpoint"""
        # Get a conversation first
        convos_response = session.get(f"{BASE_URL}/api/conversations")
        convos = convos_response.json().get("conversations", [])
        
        if len(convos) > 0:
            conv_id = convos[0]["id"]
            response = session.post(f"{BASE_URL}/api/ai/suggest-reply", json={
                "conversation_id": conv_id,
                "context": "Sales discussion"
            })
            assert response.status_code == 200
            data = response.json()
            assert "suggestions" in data
            assert len(data["suggestions"]) > 0
            print(f"✓ POST /api/ai/suggest-reply returns {len(data['suggestions'])} suggestions")
        else:
            # Test with invalid ID to ensure endpoint works
            response = session.post(f"{BASE_URL}/api/ai/suggest-reply", json={
                "conversation_id": "test-conv-id"
            })
            assert response.status_code == 404
            print("✓ POST /api/ai/suggest-reply endpoint is working (returns 404 for invalid conv)")
    
    def test_ai_score_lead(self, session):
        """Test AI lead scoring endpoint"""
        # Get a lead first
        leads_response = session.get(f"{BASE_URL}/api/leads")
        leads = leads_response.json().get("leads", [])
        
        if len(leads) > 0:
            lead_id = leads[0]["id"]
            response = session.post(f"{BASE_URL}/api/ai/score-lead", json={
                "lead_id": lead_id
            })
            assert response.status_code == 200
            data = response.json()
            assert "score" in data
            assert "reasoning" in data
            assert "category" in data
            assert 1 <= data["score"] <= 100
            print(f"✓ POST /api/ai/score-lead returns score: {data['score']}, category: {data['category']}")
        else:
            response = session.post(f"{BASE_URL}/api/ai/score-lead", json={
                "lead_id": "nonexistent-lead"
            })
            assert response.status_code == 404
            print("✓ POST /api/ai/score-lead endpoint is working (returns 404 for invalid lead)")


class TestAnalyticsRoutes:
    """Analytics endpoints: /api/analytics/overview, /api/analytics/pipeline"""
    
    @pytest.fixture(scope="class")
    def session(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            response = requests.post(f"{BASE_URL}/api/auth/register", json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "name": TEST_NAME
            })
        s = requests.Session()
        s.headers.update({"Authorization": f"Bearer {response.json()['token']}"})
        return s
    
    def test_analytics_overview(self, session):
        """Test analytics overview endpoint"""
        response = session.get(f"{BASE_URL}/api/analytics/overview")
        assert response.status_code == 200
        data = response.json()
        assert "total_leads" in data
        assert "qualified_leads" in data
        assert "active_conversations" in data
        assert "conversion_rate" in data
        assert "hot_leads" in data
        assert "warm_leads" in data
        assert "cold_leads" in data
        print(f"✓ GET /api/analytics/overview returns complete data (total_leads: {data['total_leads']})")
    
    def test_analytics_pipeline(self, session):
        """Test analytics pipeline endpoint"""
        response = session.get(f"{BASE_URL}/api/analytics/pipeline")
        assert response.status_code == 200
        data = response.json()
        assert "pipeline" in data
        assert "platform_distribution" in data
        assert "monthly_data" in data
        print(f"✓ GET /api/analytics/pipeline returns complete data")


class TestTemplatesRoutes:
    """Templates CRUD: /api/templates"""
    
    @pytest.fixture(scope="class")
    def session(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            response = requests.post(f"{BASE_URL}/api/auth/register", json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "name": TEST_NAME
            })
        s = requests.Session()
        s.headers.update({"Authorization": f"Bearer {response.json()['token']}"})
        return s
    
    def test_get_templates(self, session):
        """Test getting templates list"""
        response = session.get(f"{BASE_URL}/api/templates")
        assert response.status_code == 200
        data = response.json()
        assert "templates" in data
        print(f"✓ GET /api/templates returns {len(data['templates'])} templates")
    
    def test_create_template(self, session):
        """Test creating a new template"""
        template_data = {
            "name": f"TEST_Template_{uuid.uuid4().hex[:6]}",
            "content": "Hello {name}, this is a test template for automated testing.",
            "category": "cold_outreach",
            "tags": ["test", "automated"]
        }
        response = session.post(f"{BASE_URL}/api/templates", json=template_data)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == template_data["name"]
        assert data["content"] == template_data["content"]
        assert "id" in data
        print(f"✓ POST /api/templates created template with ID: {data['id']}")
        return data["id"]
    
    def test_update_template(self, session):
        """Test updating a template"""
        # Create first
        template_data = {
            "name": f"TEST_UpdateTemplate_{uuid.uuid4().hex[:6]}",
            "content": "Original content",
            "category": "follow_up"
        }
        create_response = session.post(f"{BASE_URL}/api/templates", json=template_data)
        template_id = create_response.json()["id"]
        
        # Update
        update_data = {"name": "TEST_Updated Template Name", "content": "Updated content"}
        update_response = session.put(f"{BASE_URL}/api/templates/{template_id}", json=update_data)
        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated["name"] == "TEST_Updated Template Name"
        assert updated["content"] == "Updated content"
        print(f"✓ PUT /api/templates/{template_id} updates template correctly")
    
    def test_delete_template(self, session):
        """Test deleting a template"""
        # Create first
        template_data = {
            "name": f"TEST_DeleteTemplate_{uuid.uuid4().hex[:6]}",
            "content": "To be deleted",
            "category": "general"
        }
        create_response = session.post(f"{BASE_URL}/api/templates", json=template_data)
        template_id = create_response.json()["id"]
        
        # Delete
        delete_response = session.delete(f"{BASE_URL}/api/templates/{template_id}")
        assert delete_response.status_code == 200
        print(f"✓ DELETE /api/templates/{template_id} deletes template correctly")


class TestSettingsRoutes:
    """Settings endpoints: /api/settings"""
    
    @pytest.fixture(scope="class")
    def session(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            response = requests.post(f"{BASE_URL}/api/auth/register", json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "name": TEST_NAME
            })
        s = requests.Session()
        s.headers.update({"Authorization": f"Bearer {response.json()['token']}"})
        return s
    
    def test_get_settings(self, session):
        """Test getting user settings"""
        response = session.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert "notifications_enabled" in data
        assert "auto_score" in data
        print("✓ GET /api/settings returns user settings")
    
    def test_update_settings(self, session):
        """Test updating settings"""
        update_data = {
            "notifications_enabled": False,
            "daily_outreach_limit": 100
        }
        response = session.put(f"{BASE_URL}/api/settings", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["notifications_enabled"] == False
        assert data["daily_outreach_limit"] == 100
        
        # Verify persistence
        get_response = session.get(f"{BASE_URL}/api/settings")
        assert get_response.json()["notifications_enabled"] == False
        print("✓ PUT /api/settings updates settings correctly")


class TestBillingRoutes:
    """Billing endpoints: /api/billing/plans, /api/billing/subscription"""
    
    @pytest.fixture(scope="class")
    def session(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            response = requests.post(f"{BASE_URL}/api/auth/register", json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "name": TEST_NAME
            })
        s = requests.Session()
        s.headers.update({"Authorization": f"Bearer {response.json()['token']}"})
        return s
    
    def test_get_plans(self, session):
        """Test getting subscription plans (unauthenticated should work)"""
        response = requests.get(f"{BASE_URL}/api/billing/plans")
        assert response.status_code == 200
        data = response.json()
        assert "plans" in data
        plan_ids = [p["id"] for p in data["plans"]]
        assert "starter" in plan_ids
        assert "growth" in plan_ids
        assert "enterprise" in plan_ids
        print(f"✓ GET /api/billing/plans returns {len(data['plans'])} plans")
    
    def test_get_subscription(self, session):
        """Test getting user subscription status"""
        response = session.get(f"{BASE_URL}/api/billing/subscription")
        assert response.status_code == 200
        data = response.json()
        assert "plan" in data
        assert "status" in data
        print(f"✓ GET /api/billing/subscription returns plan: {data['plan']}, status: {data['status']}")


class TestSeedRoutes:
    """Seed data endpoint: /api/seed-data"""
    
    @pytest.fixture(scope="class")
    def session(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            response = requests.post(f"{BASE_URL}/api/auth/register", json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "name": TEST_NAME
            })
        s = requests.Session()
        s.headers.update({"Authorization": f"Bearer {response.json()['token']}"})
        return s
    
    def test_seed_data(self, session):
        """Test seed data endpoint"""
        response = session.post(f"{BASE_URL}/api/seed-data")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        # Either seeded or already seeded
        print(f"✓ POST /api/seed-data: {data['message']}")


class TestAPIRoot:
    """Test API root endpoint"""
    
    def test_api_root(self):
        """Test API root returns message"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "GoSocial API"
        print("✓ GET /api/ returns GoSocial API message")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
