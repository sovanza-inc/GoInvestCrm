"""
GoSocial API Tests - Autopilot & Integrations Features
Tests for the 3 new features:
1. Autopilot Campaigns - CRUD, toggle, simulate, analytics
2. WhatsApp Integration - connect/disconnect, conversations, messaging
3. Instagram Integration - same as WhatsApp
"""
import pytest
import requests
import os
import uuid

# API base URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://sales-autopilot-21.preview.emergentagent.com"

# Test user credentials
TEST_EMAIL = "test@autopilot.com"
TEST_PASSWORD = "Test123!"
TEST_NAME = "Test Autopilot User"


class TestSetup:
    """Ensure test user exists and get auth token"""
    
    @pytest.fixture(scope="session")
    def auth_token(self):
        """Login or register test user and return token"""
        # Try login first
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["token"]
        
        # Register if login failed
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "name": TEST_NAME
        })
        assert response.status_code == 200, f"Registration failed: {response.text}"
        return response.json()["token"]
    
    @pytest.fixture(scope="session")
    def session(self, auth_token):
        """Authenticated requests session"""
        s = requests.Session()
        s.headers.update({
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        })
        return s


# ============================================================================
# AUTOPILOT CAMPAIGN TESTS
# ============================================================================

class TestAutopilotCampaignsCRUD(TestSetup):
    """Autopilot Campaign CRUD operations"""
    
    def test_get_campaigns_empty_or_list(self, session):
        """Test getting campaign list"""
        response = session.get(f"{BASE_URL}/api/autopilot/campaigns")
        assert response.status_code == 200
        data = response.json()
        assert "campaigns" in data
        assert isinstance(data["campaigns"], list)
        print(f"✓ GET /api/autopilot/campaigns returns {len(data['campaigns'])} campaigns")
    
    def test_create_campaign_basic(self, session):
        """Test creating a campaign with name and description"""
        campaign_data = {
            "name": f"TEST_Campaign_{uuid.uuid4().hex[:6]}",
            "description": "Automated test campaign"
        }
        response = session.post(f"{BASE_URL}/api/autopilot/campaigns", json=campaign_data)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == campaign_data["name"]
        assert data["description"] == campaign_data["description"]
        assert data["status"] == "draft"
        assert "id" in data
        assert "target_criteria" in data
        assert "steps" in data
        assert "stats" in data
        print(f"✓ POST /api/autopilot/campaigns created basic campaign: {data['id']}")
        return data["id"]
    
    def test_create_campaign_with_steps_and_targeting(self, session):
        """Test creating campaign with steps and targeting criteria"""
        campaign_data = {
            "name": f"TEST_FullCampaign_{uuid.uuid4().hex[:6]}",
            "description": "Full featured test campaign",
            "steps": [
                {"message": "Hi {{name}}, welcome!", "delay_hours": 0, "variant": "A"},
                {"message": "Following up on my previous message...", "delay_hours": 24, "variant": "A"},
                {"message": "Last reminder - special offer!", "delay_hours": 48, "variant": "B"}
            ],
            "target_platforms": ["instagram", "linkedin"],
            "target_statuses": ["new", "contacted"],
            "target_min_score": 30,
            "target_max_score": 80,
            "target_tags": ["vip", "influencer"]
        }
        response = session.post(f"{BASE_URL}/api/autopilot/campaigns", json=campaign_data)
        assert response.status_code == 200
        data = response.json()
        
        # Verify data
        assert data["name"] == campaign_data["name"]
        assert len(data["steps"]) == 3
        assert data["steps"][0]["message"] == "Hi {{name}}, welcome!"
        assert data["steps"][0]["delay_hours"] == 0
        assert data["steps"][1]["delay_hours"] == 24
        assert data["steps"][2]["variant"] == "B"
        assert data["target_criteria"]["platforms"] == ["instagram", "linkedin"]
        assert data["target_criteria"]["statuses"] == ["new", "contacted"]
        assert data["target_criteria"]["min_score"] == 30
        assert data["target_criteria"]["max_score"] == 80
        assert data["target_criteria"]["tags"] == ["vip", "influencer"]
        print(f"✓ POST /api/autopilot/campaigns created campaign with steps and targeting: {data['id']}")
        return data["id"]
    
    def test_get_campaign_by_id(self, session):
        """Test getting a specific campaign"""
        # Create campaign first
        create_response = session.post(f"{BASE_URL}/api/autopilot/campaigns", json={
            "name": f"TEST_GetById_{uuid.uuid4().hex[:6]}",
            "description": "For get by ID test"
        })
        campaign_id = create_response.json()["id"]
        
        # Get by ID
        response = session.get(f"{BASE_URL}/api/autopilot/campaigns/{campaign_id}")
        assert response.status_code == 200
        data = response.json()
        assert "campaign" in data
        assert "executions" in data
        assert data["campaign"]["id"] == campaign_id
        print(f"✓ GET /api/autopilot/campaigns/{campaign_id} returns campaign details")
    
    def test_get_nonexistent_campaign_404(self, session):
        """Test getting non-existent campaign returns 404"""
        response = session.get(f"{BASE_URL}/api/autopilot/campaigns/nonexistent-id-12345")
        assert response.status_code == 404
        print("✓ GET /api/autopilot/campaigns/nonexistent-id returns 404")
    
    def test_update_campaign(self, session):
        """Test updating campaign properties"""
        # Create campaign
        create_response = session.post(f"{BASE_URL}/api/autopilot/campaigns", json={
            "name": "TEST_UpdateCampaign_Original",
            "description": "Original description",
            "steps": [{"message": "Original message", "delay_hours": 0, "variant": "A"}],
            "target_platforms": ["instagram"]
        })
        campaign_id = create_response.json()["id"]
        
        # Update
        update_data = {
            "name": "TEST_UpdateCampaign_Updated",
            "description": "Updated description",
            "steps": [
                {"message": "Updated message 1", "delay_hours": 0, "variant": "A"},
                {"message": "New message 2", "delay_hours": 12, "variant": "B"}
            ],
            "target_platforms": ["linkedin", "twitter"],
            "target_min_score": 50
        }
        response = session.put(f"{BASE_URL}/api/autopilot/campaigns/{campaign_id}", json=update_data)
        assert response.status_code == 200
        data = response.json()
        
        assert data["name"] == "TEST_UpdateCampaign_Updated"
        assert data["description"] == "Updated description"
        assert len(data["steps"]) == 2
        assert data["target_criteria"]["platforms"] == ["linkedin", "twitter"]
        assert data["target_criteria"]["min_score"] == 50
        print(f"✓ PUT /api/autopilot/campaigns/{campaign_id} updates campaign correctly")
    
    def test_delete_campaign(self, session):
        """Test deleting a campaign"""
        # Create campaign
        create_response = session.post(f"{BASE_URL}/api/autopilot/campaigns", json={
            "name": f"TEST_DeleteCampaign_{uuid.uuid4().hex[:6]}"
        })
        campaign_id = create_response.json()["id"]
        
        # Delete
        response = session.delete(f"{BASE_URL}/api/autopilot/campaigns/{campaign_id}")
        assert response.status_code == 200
        assert "deleted" in response.json()["message"].lower()
        
        # Verify deletion
        get_response = session.get(f"{BASE_URL}/api/autopilot/campaigns/{campaign_id}")
        assert get_response.status_code == 404
        print(f"✓ DELETE /api/autopilot/campaigns/{campaign_id} deletes campaign")


class TestAutopilotCampaignToggle(TestSetup):
    """Campaign toggle (activate/pause) tests"""
    
    def test_toggle_campaign_requires_steps(self, session):
        """Test that activating a campaign requires at least one step"""
        # Create campaign without steps
        create_response = session.post(f"{BASE_URL}/api/autopilot/campaigns", json={
            "name": f"TEST_NoSteps_{uuid.uuid4().hex[:6]}",
            "description": "Campaign without steps"
        })
        campaign_id = create_response.json()["id"]
        
        # Try to activate - should fail
        response = session.put(f"{BASE_URL}/api/autopilot/campaigns/{campaign_id}/toggle")
        assert response.status_code == 400
        assert "step" in response.json()["detail"].lower()
        print("✓ Toggle campaign without steps returns 400 error")
    
    def test_toggle_campaign_activate_pause(self, session):
        """Test toggling campaign between active and paused"""
        # Create campaign with steps
        create_response = session.post(f"{BASE_URL}/api/autopilot/campaigns", json={
            "name": f"TEST_ToggleCampaign_{uuid.uuid4().hex[:6]}",
            "steps": [{"message": "Hello!", "delay_hours": 0, "variant": "A"}]
        })
        campaign_id = create_response.json()["id"]
        initial_status = create_response.json()["status"]
        assert initial_status == "draft"
        
        # Activate
        toggle_response = session.put(f"{BASE_URL}/api/autopilot/campaigns/{campaign_id}/toggle")
        assert toggle_response.status_code == 200
        assert toggle_response.json()["status"] == "active"
        print(f"✓ Campaign activated: draft -> active")
        
        # Pause
        toggle_response = session.put(f"{BASE_URL}/api/autopilot/campaigns/{campaign_id}/toggle")
        assert toggle_response.status_code == 200
        assert toggle_response.json()["status"] == "paused"
        print(f"✓ Campaign paused: active -> paused")
        
        # Re-activate
        toggle_response = session.put(f"{BASE_URL}/api/autopilot/campaigns/{campaign_id}/toggle")
        assert toggle_response.status_code == 200
        assert toggle_response.json()["status"] == "active"
        print(f"✓ Campaign re-activated: paused -> active")


class TestAutopilotCampaignSimulate(TestSetup):
    """Campaign simulation/preview tests"""
    
    def test_simulate_campaign_preview(self, session):
        """Test campaign simulation returns matching leads preview"""
        # Create campaign with targeting
        create_response = session.post(f"{BASE_URL}/api/autopilot/campaigns", json={
            "name": f"TEST_SimulateCampaign_{uuid.uuid4().hex[:6]}",
            "steps": [{"message": "Test message", "delay_hours": 0, "variant": "A"}],
            "target_platforms": ["instagram"],
            "target_statuses": ["new"]
        })
        campaign_id = create_response.json()["id"]
        
        # Simulate
        response = session.post(f"{BASE_URL}/api/autopilot/campaigns/{campaign_id}/simulate")
        assert response.status_code == 200
        data = response.json()
        
        assert "total_matching" in data
        assert "preview_leads" in data
        assert "steps_count" in data
        assert isinstance(data["total_matching"], int)
        assert isinstance(data["preview_leads"], list)
        assert data["steps_count"] == 1
        print(f"✓ POST /api/autopilot/campaigns/{campaign_id}/simulate returns {data['total_matching']} matching leads")


class TestAutopilotCampaignAnalytics(TestSetup):
    """Campaign analytics tests"""
    
    def test_campaign_analytics(self, session):
        """Test getting campaign analytics"""
        # Create campaign
        create_response = session.post(f"{BASE_URL}/api/autopilot/campaigns", json={
            "name": f"TEST_AnalyticsCampaign_{uuid.uuid4().hex[:6]}",
            "steps": [
                {"message": "Step 1", "delay_hours": 0, "variant": "A"},
                {"message": "Step 2", "delay_hours": 24, "variant": "A"}
            ]
        })
        campaign_id = create_response.json()["id"]
        
        # Get analytics
        response = session.get(f"{BASE_URL}/api/autopilot/campaigns/{campaign_id}/analytics")
        assert response.status_code == 200
        data = response.json()
        
        assert data["campaign_id"] == campaign_id
        assert "overall" in data
        assert "steps" in data
        assert "total_targeted" in data["overall"]
        assert "total_sent" in data["overall"]
        assert "total_replied" in data["overall"]
        assert "total_converted" in data["overall"]
        assert len(data["steps"]) == 2
        print(f"✓ GET /api/autopilot/campaigns/{campaign_id}/analytics returns analytics data")


# ============================================================================
# INTEGRATIONS TESTS - WHATSAPP & INSTAGRAM
# ============================================================================

class TestIntegrationsOverview(TestSetup):
    """Integration overview and connection tests"""
    
    def test_get_integrations_list(self, session):
        """Test getting integrations list"""
        response = session.get(f"{BASE_URL}/api/integrations")
        assert response.status_code == 200
        data = response.json()
        assert "integrations" in data
        assert isinstance(data["integrations"], list)
        print(f"✓ GET /api/integrations returns {len(data['integrations'])} integrations")
    
    def test_connect_unsupported_platform_fails(self, session):
        """Test connecting unsupported platform returns error"""
        response = session.post(f"{BASE_URL}/api/integrations/connect", json={
            "platform": "telegram",  # Not supported
            "account_name": "My Telegram"
        })
        assert response.status_code == 400
        assert "unsupported" in response.json()["detail"].lower()
        print("✓ Connect unsupported platform returns 400")


class TestWhatsAppIntegration(TestSetup):
    """WhatsApp integration tests"""
    
    @pytest.fixture(scope="class")
    def whatsapp_integration(self, session):
        """Ensure WhatsApp is connected"""
        # Check if already connected
        response = session.get(f"{BASE_URL}/api/integrations")
        integrations = response.json()["integrations"]
        existing = next((i for i in integrations if i["platform"] == "whatsapp"), None)
        
        if existing:
            return existing
        
        # Connect WhatsApp
        response = session.post(f"{BASE_URL}/api/integrations/connect", json={
            "platform": "whatsapp",
            "account_name": "Test WhatsApp Business"
        })
        assert response.status_code == 200
        return response.json()
    
    def test_connect_whatsapp(self, session, whatsapp_integration):
        """Test WhatsApp connection"""
        assert whatsapp_integration["platform"] == "whatsapp"
        assert whatsapp_integration["status"] == "connected"
        assert "id" in whatsapp_integration
        print(f"✓ WhatsApp connected: {whatsapp_integration['account_name']}")
    
    def test_connect_whatsapp_duplicate_fails(self, session, whatsapp_integration):
        """Test connecting WhatsApp again fails"""
        response = session.post(f"{BASE_URL}/api/integrations/connect", json={
            "platform": "whatsapp",
            "account_name": "Another WhatsApp"
        })
        assert response.status_code == 400
        assert "already connected" in response.json()["detail"].lower()
        print("✓ Duplicate WhatsApp connection correctly rejected")
    
    def test_seed_whatsapp_demo_conversations(self, session, whatsapp_integration):
        """Test seeding demo conversations for WhatsApp"""
        response = session.post(f"{BASE_URL}/api/integrations/whatsapp/seed-demo")
        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        assert data["count"] == 5
        print(f"✓ Seeded {data['count']} WhatsApp demo conversations")
    
    def test_get_whatsapp_conversations(self, session, whatsapp_integration):
        """Test getting WhatsApp conversations"""
        response = session.get(f"{BASE_URL}/api/integrations/whatsapp/conversations")
        assert response.status_code == 200
        data = response.json()
        assert "conversations" in data
        assert "total" in data
        assert isinstance(data["conversations"], list)
        print(f"✓ GET /api/integrations/whatsapp/conversations returns {data['total']} conversations")
        return data["conversations"]
    
    def test_get_whatsapp_conversation_detail(self, session, whatsapp_integration):
        """Test getting specific WhatsApp conversation with messages"""
        # Get conversations first
        convos = self.test_get_whatsapp_conversations(session, whatsapp_integration)
        if len(convos) == 0:
            pytest.skip("No WhatsApp conversations to test")
        
        conv_id = convos[0]["id"]
        response = session.get(f"{BASE_URL}/api/integrations/whatsapp/conversations/{conv_id}")
        assert response.status_code == 200
        data = response.json()
        assert "conversation" in data
        assert "messages" in data
        assert data["conversation"]["id"] == conv_id
        assert isinstance(data["messages"], list)
        print(f"✓ GET /api/integrations/whatsapp/conversations/{conv_id} returns conversation with {len(data['messages'])} messages")
    
    def test_send_whatsapp_message(self, session, whatsapp_integration):
        """Test sending message in WhatsApp conversation (simulated)"""
        # Get a conversation
        convos_response = session.get(f"{BASE_URL}/api/integrations/whatsapp/conversations")
        convos = convos_response.json()["conversations"]
        if len(convos) == 0:
            pytest.skip("No WhatsApp conversations to test messaging")
        
        conv_id = convos[0]["id"]
        response = session.post(
            f"{BASE_URL}/api/integrations/whatsapp/conversations/{conv_id}/send",
            json={"content": "Hello from automated test!"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify sent message
        assert "sent" in data
        assert data["sent"]["sender"] == "user"
        assert data["sent"]["content"] == "Hello from automated test!"
        
        # Verify simulated reply
        assert "reply" in data
        assert data["reply"]["sender"] == "contact"
        assert len(data["reply"]["content"]) > 0
        print(f"✓ POST send WhatsApp message - sent and received simulated reply: '{data['reply']['content'][:50]}...'")
    
    def test_search_whatsapp_conversations(self, session, whatsapp_integration):
        """Test searching WhatsApp conversations"""
        response = session.get(f"{BASE_URL}/api/integrations/whatsapp/conversations", params={
            "search": "Sarah"  # Demo contact name
        })
        assert response.status_code == 200
        data = response.json()
        assert "conversations" in data
        print(f"✓ Search WhatsApp conversations returns {data['total']} results")


class TestInstagramIntegration(TestSetup):
    """Instagram integration tests"""
    
    @pytest.fixture(scope="class")
    def instagram_integration(self, session):
        """Ensure Instagram is connected"""
        # Check if already connected
        response = session.get(f"{BASE_URL}/api/integrations")
        integrations = response.json()["integrations"]
        existing = next((i for i in integrations if i["platform"] == "instagram"), None)
        
        if existing:
            return existing
        
        # Connect Instagram
        response = session.post(f"{BASE_URL}/api/integrations/connect", json={
            "platform": "instagram",
            "account_name": "Test Instagram Business"
        })
        assert response.status_code == 200
        return response.json()
    
    def test_connect_instagram(self, session, instagram_integration):
        """Test Instagram connection"""
        assert instagram_integration["platform"] == "instagram"
        assert instagram_integration["status"] == "connected"
        assert "id" in instagram_integration
        print(f"✓ Instagram connected: {instagram_integration['account_name']}")
    
    def test_connect_instagram_duplicate_fails(self, session, instagram_integration):
        """Test connecting Instagram again fails"""
        response = session.post(f"{BASE_URL}/api/integrations/connect", json={
            "platform": "instagram",
            "account_name": "Another Instagram"
        })
        assert response.status_code == 400
        assert "already connected" in response.json()["detail"].lower()
        print("✓ Duplicate Instagram connection correctly rejected")
    
    def test_seed_instagram_demo_conversations(self, session, instagram_integration):
        """Test seeding demo conversations for Instagram"""
        response = session.post(f"{BASE_URL}/api/integrations/instagram/seed-demo")
        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        assert data["count"] == 5
        print(f"✓ Seeded {data['count']} Instagram demo conversations")
    
    def test_get_instagram_conversations(self, session, instagram_integration):
        """Test getting Instagram conversations"""
        response = session.get(f"{BASE_URL}/api/integrations/instagram/conversations")
        assert response.status_code == 200
        data = response.json()
        assert "conversations" in data
        assert "total" in data
        assert isinstance(data["conversations"], list)
        print(f"✓ GET /api/integrations/instagram/conversations returns {data['total']} conversations")
        return data["conversations"]
    
    def test_get_instagram_conversation_detail(self, session, instagram_integration):
        """Test getting specific Instagram conversation with messages"""
        # Get conversations first
        convos = self.test_get_instagram_conversations(session, instagram_integration)
        if len(convos) == 0:
            pytest.skip("No Instagram conversations to test")
        
        conv_id = convos[0]["id"]
        response = session.get(f"{BASE_URL}/api/integrations/instagram/conversations/{conv_id}")
        assert response.status_code == 200
        data = response.json()
        assert "conversation" in data
        assert "messages" in data
        assert data["conversation"]["id"] == conv_id
        assert isinstance(data["messages"], list)
        print(f"✓ GET /api/integrations/instagram/conversations/{conv_id} returns conversation with {len(data['messages'])} messages")
    
    def test_send_instagram_message(self, session, instagram_integration):
        """Test sending message in Instagram conversation (simulated)"""
        # Get a conversation
        convos_response = session.get(f"{BASE_URL}/api/integrations/instagram/conversations")
        convos = convos_response.json()["conversations"]
        if len(convos) == 0:
            pytest.skip("No Instagram conversations to test messaging")
        
        conv_id = convos[0]["id"]
        response = session.post(
            f"{BASE_URL}/api/integrations/instagram/conversations/{conv_id}/send",
            json={"content": "Testing Instagram DM!"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify sent message
        assert "sent" in data
        assert data["sent"]["sender"] == "user"
        assert data["sent"]["content"] == "Testing Instagram DM!"
        
        # Verify simulated reply
        assert "reply" in data
        assert data["reply"]["sender"] == "contact"
        print(f"✓ POST send Instagram message - sent and received simulated reply")


class TestIntegrationDisconnect(TestSetup):
    """Integration disconnect tests - run last"""
    
    def test_disconnect_integration(self, session):
        """Test disconnecting an integration"""
        # Connect a new platform to test disconnection
        connect_response = session.post(f"{BASE_URL}/api/integrations/connect", json={
            "platform": "whatsapp",
            "account_name": f"TEST_Disconnect_{uuid.uuid4().hex[:6]}"
        })
        
        # If already connected, get the ID
        if connect_response.status_code == 400:
            integrations_response = session.get(f"{BASE_URL}/api/integrations")
            integrations = integrations_response.json()["integrations"]
            whatsapp = next((i for i in integrations if i["platform"] == "whatsapp"), None)
            if not whatsapp:
                pytest.skip("No WhatsApp integration to disconnect")
            integration_id = whatsapp["id"]
        else:
            integration_id = connect_response.json()["id"]
        
        # Disconnect
        response = session.delete(f"{BASE_URL}/api/integrations/{integration_id}")
        assert response.status_code == 200
        assert "disconnected" in response.json()["message"].lower()
        print(f"✓ DELETE /api/integrations/{integration_id} disconnects integration")
    
    def test_disconnect_nonexistent_integration_404(self, session):
        """Test disconnecting non-existent integration returns 404"""
        response = session.delete(f"{BASE_URL}/api/integrations/nonexistent-id-12345")
        assert response.status_code == 404
        print("✓ DELETE nonexistent integration returns 404")


class TestIntegrationPlatformNotConnected(TestSetup):
    """Test platform endpoints when not connected"""
    
    def test_conversations_when_not_connected(self, session):
        """Test getting conversations for non-connected platform"""
        # First ensure platform is disconnected by trying to disconnect
        integrations_response = session.get(f"{BASE_URL}/api/integrations")
        integrations = integrations_response.json()["integrations"]
        
        # Find a platform that's not connected or disconnect one
        for platform in ["whatsapp", "instagram"]:
            integration = next((i for i in integrations if i["platform"] == platform), None)
            if not integration:
                # Test with this non-connected platform
                response = session.get(f"{BASE_URL}/api/integrations/{platform}/conversations")
                assert response.status_code == 400
                assert "not connected" in response.json()["detail"].lower()
                print(f"✓ GET {platform} conversations when not connected returns 400")
                return
        
        pytest.skip("Both platforms are connected - cannot test not-connected state")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
