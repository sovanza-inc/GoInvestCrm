"""
GoSocial API Tests - New Features (Iteration 9)
Tests for 3 new features:
1. Team Collaboration - Activity Log & Team Performance Dashboard
2. LinkedIn Integration - Connect, conversations, messaging (simulated)
3. Voice Messaging in CRM - Voice message creation and display
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


class TestSetup:
    """Setup and authentication for all tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login test user and return token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def session(self, auth_token):
        """Authenticated requests session"""
        s = requests.Session()
        s.headers.update({
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        })
        return s


# ============================================================================
# ACTIVITY LOG & TEAM PERFORMANCE TESTS
# ============================================================================

class TestActivityLog(TestSetup):
    """Activity Log API tests - GET /api/activity/log"""
    
    def test_get_activity_log_success(self, session):
        """Test getting activity log without filters"""
        response = session.get(f"{BASE_URL}/api/activity/log")
        assert response.status_code == 200
        data = response.json()
        assert "activities" in data
        assert "total" in data
        assert isinstance(data["activities"], list)
        print(f"✓ GET /api/activity/log returns {data['total']} activities")
    
    def test_get_activity_log_with_limit(self, session):
        """Test activity log with limit parameter"""
        response = session.get(f"{BASE_URL}/api/activity/log", params={"limit": 10})
        assert response.status_code == 200
        data = response.json()
        assert "activities" in data
        assert len(data["activities"]) <= 10
        print(f"✓ GET /api/activity/log with limit=10 works (returned {len(data['activities'])} activities)")
    
    def test_get_activity_log_filter_by_entity_type(self, session):
        """Test activity log filtered by entity type"""
        for entity_type in ["lead", "message", "campaign", "team"]:
            response = session.get(f"{BASE_URL}/api/activity/log", params={"entity_type": entity_type})
            assert response.status_code == 200
            data = response.json()
            assert "activities" in data
            # All returned activities should match the entity_type if any exist
            for activity in data["activities"]:
                assert activity["entity_type"] == entity_type
            print(f"✓ GET /api/activity/log with entity_type={entity_type} works")
    
    def test_get_activity_log_filter_by_member_id(self, session):
        """Test activity log filtered by member_id"""
        # Get user info first
        me_response = session.get(f"{BASE_URL}/api/auth/me")
        user_id = me_response.json()["user"]["id"]
        
        response = session.get(f"{BASE_URL}/api/activity/log", params={"member_id": user_id})
        assert response.status_code == 200
        data = response.json()
        assert "activities" in data
        print(f"✓ GET /api/activity/log with member_id={user_id} works")
    
    def test_get_activity_log_combined_filters(self, session):
        """Test activity log with multiple filters"""
        response = session.get(f"{BASE_URL}/api/activity/log", params={
            "entity_type": "lead",
            "limit": 5
        })
        assert response.status_code == 200
        data = response.json()
        assert "activities" in data
        assert len(data["activities"]) <= 5
        print("✓ GET /api/activity/log with combined filters works")


class TestTeamPerformance(TestSetup):
    """Team Performance API tests - GET /api/activity/team-performance"""
    
    def test_get_team_performance_success(self, session):
        """Test getting team performance data"""
        response = session.get(f"{BASE_URL}/api/activity/team-performance")
        assert response.status_code == 200
        data = response.json()
        assert "members" in data
        assert isinstance(data["members"], list)
        print(f"✓ GET /api/activity/team-performance returns {len(data['members'])} members")
    
    def test_team_performance_member_structure(self, session):
        """Test team performance member data structure"""
        response = session.get(f"{BASE_URL}/api/activity/team-performance")
        assert response.status_code == 200
        data = response.json()
        
        # If there are members, verify structure
        if data["members"]:
            member = data["members"][0]
            assert "id" in member
            assert "name" in member
            assert "email" in member
            assert "role" in member
            assert "stats" in member
            
            # Verify stats structure
            stats = member["stats"]
            assert "leads_handled" in stats
            assert "conversations" in stats
            assert "messages_sent" in stats
            assert "activities" in stats
            assert "deals_closed" in stats
            print(f"✓ Team performance member structure is correct: {member['name']}")
        else:
            print("✓ Team performance endpoint works (no members yet)")
    
    def test_team_performance_stats_are_integers(self, session):
        """Test that performance stats are integer values"""
        response = session.get(f"{BASE_URL}/api/activity/team-performance")
        assert response.status_code == 200
        data = response.json()
        
        if data["members"]:
            for member in data["members"]:
                for stat_key, stat_value in member["stats"].items():
                    assert isinstance(stat_value, int), f"Stat {stat_key} should be int, got {type(stat_value)}"
            print("✓ All team performance stats are integers")
        else:
            print("✓ Team performance endpoint works (no stats to verify)")


# ============================================================================
# LINKEDIN INTEGRATION TESTS
# ============================================================================

class TestLinkedInIntegration(TestSetup):
    """LinkedIn Integration API tests"""
    
    @pytest.fixture(scope="class")
    def linkedin_integration(self, session):
        """Ensure LinkedIn is connected for testing"""
        # Check if already connected
        response = session.get(f"{BASE_URL}/api/integrations")
        integrations = response.json()["integrations"]
        existing = next((i for i in integrations if i["platform"] == "linkedin"), None)
        
        if existing:
            return existing
        
        # Connect LinkedIn
        response = session.post(f"{BASE_URL}/api/integrations/connect", json={
            "platform": "linkedin",
            "account_name": "Test LinkedIn Business"
        })
        assert response.status_code == 200
        return response.json()
    
    def test_connect_linkedin_success(self, session, linkedin_integration):
        """Test LinkedIn connection is successful"""
        assert linkedin_integration["platform"] == "linkedin"
        assert linkedin_integration["status"] == "connected"
        assert "id" in linkedin_integration
        assert "account_name" in linkedin_integration
        assert "stats" in linkedin_integration
        print(f"✓ LinkedIn connected: {linkedin_integration['account_name']}")
    
    def test_connect_linkedin_duplicate_fails(self, session, linkedin_integration):
        """Test that connecting LinkedIn again fails"""
        response = session.post(f"{BASE_URL}/api/integrations/connect", json={
            "platform": "linkedin",
            "account_name": "Another LinkedIn"
        })
        assert response.status_code == 400
        assert "already connected" in response.json()["detail"].lower()
        print("✓ Duplicate LinkedIn connection correctly rejected")
    
    def test_seed_linkedin_demo_conversations(self, session, linkedin_integration):
        """Test seeding demo conversations for LinkedIn"""
        response = session.post(f"{BASE_URL}/api/integrations/linkedin/seed-demo")
        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        assert "message" in data
        assert data["count"] == 5
        print(f"✓ Seeded {data['count']} LinkedIn demo conversations")
    
    def test_get_linkedin_conversations(self, session, linkedin_integration):
        """Test getting LinkedIn conversations"""
        response = session.get(f"{BASE_URL}/api/integrations/linkedin/conversations")
        assert response.status_code == 200
        data = response.json()
        assert "conversations" in data
        assert "total" in data
        assert isinstance(data["conversations"], list)
        print(f"✓ GET /api/integrations/linkedin/conversations returns {data['total']} conversations")
        return data["conversations"]
    
    def test_linkedin_conversation_structure(self, session, linkedin_integration):
        """Test LinkedIn conversation data structure"""
        response = session.get(f"{BASE_URL}/api/integrations/linkedin/conversations")
        data = response.json()
        
        if data["conversations"]:
            conv = data["conversations"][0]
            assert "id" in conv
            assert "contact_name" in conv
            assert "contact_handle" in conv
            assert "contact_avatar" in conv
            assert "last_message" in conv
            assert "last_message_at" in conv
            assert "status" in conv
            assert conv["platform"] == "linkedin"
            print(f"✓ LinkedIn conversation structure is correct")
        else:
            print("⚠ No LinkedIn conversations to verify structure")
    
    def test_get_linkedin_conversation_detail(self, session, linkedin_integration):
        """Test getting specific LinkedIn conversation with messages"""
        # Seed first to ensure we have conversations
        session.post(f"{BASE_URL}/api/integrations/linkedin/seed-demo")
        
        # Get conversations
        convos_response = session.get(f"{BASE_URL}/api/integrations/linkedin/conversations")
        convos = convos_response.json()["conversations"]
        
        if len(convos) == 0:
            pytest.skip("No LinkedIn conversations available")
        
        conv_id = convos[0]["id"]
        response = session.get(f"{BASE_URL}/api/integrations/linkedin/conversations/{conv_id}")
        assert response.status_code == 200
        data = response.json()
        assert "conversation" in data
        assert "messages" in data
        assert data["conversation"]["id"] == conv_id
        assert isinstance(data["messages"], list)
        print(f"✓ GET LinkedIn conversation detail returns {len(data['messages'])} messages")
    
    def test_send_linkedin_message(self, session, linkedin_integration):
        """Test sending message in LinkedIn conversation (simulated)"""
        # Get a conversation
        convos_response = session.get(f"{BASE_URL}/api/integrations/linkedin/conversations")
        convos = convos_response.json()["conversations"]
        
        if len(convos) == 0:
            pytest.skip("No LinkedIn conversations available for messaging test")
        
        conv_id = convos[0]["id"]
        test_message = f"Test LinkedIn message {uuid.uuid4().hex[:6]}"
        
        response = session.post(
            f"{BASE_URL}/api/integrations/linkedin/conversations/{conv_id}/send",
            json={"content": test_message}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify sent message
        assert "sent" in data
        assert data["sent"]["sender"] == "user"
        assert data["sent"]["content"] == test_message
        assert "id" in data["sent"]
        
        # Verify simulated reply
        assert "reply" in data
        assert data["reply"]["sender"] == "contact"
        assert len(data["reply"]["content"]) > 0
        print(f"✓ LinkedIn send message works with simulated reply: '{data['reply']['content'][:40]}...'")
    
    def test_search_linkedin_conversations(self, session, linkedin_integration):
        """Test searching LinkedIn conversations"""
        response = session.get(f"{BASE_URL}/api/integrations/linkedin/conversations", params={
            "search": "Sarah"  # Demo contact name
        })
        assert response.status_code == 200
        data = response.json()
        assert "conversations" in data
        print(f"✓ Search LinkedIn conversations returns {data['total']} results")
    
    def test_linkedin_in_integrations_list(self, session, linkedin_integration):
        """Test that LinkedIn appears in integrations list"""
        response = session.get(f"{BASE_URL}/api/integrations")
        assert response.status_code == 200
        data = response.json()
        
        platforms = [i["platform"] for i in data["integrations"]]
        assert "linkedin" in platforms
        print("✓ LinkedIn appears in integrations list")


# ============================================================================
# VOICE MESSAGING TESTS
# ============================================================================

class TestVoiceMessaging(TestSetup):
    """Voice Messaging API tests - POST /api/conversations/{id}/voice"""
    
    @pytest.fixture(scope="class")
    def test_conversation(self, session):
        """Get or create a test conversation for voice message testing"""
        # Get existing conversations
        response = session.get(f"{BASE_URL}/api/conversations")
        convos = response.json()["conversations"]
        
        if convos:
            return convos[0]
        
        # If no conversations, seed data first
        session.post(f"{BASE_URL}/api/seed-data")
        response = session.get(f"{BASE_URL}/api/conversations")
        convos = response.json()["conversations"]
        
        if convos:
            return convos[0]
        
        pytest.skip("No conversations available for voice message testing")
    
    def test_send_voice_message_success(self, session, test_conversation):
        """Test sending a voice message"""
        conv_id = test_conversation["id"]
        
        response = session.post(f"{BASE_URL}/api/conversations/{conv_id}/voice", json={
            "conversation_id": conv_id,
            "duration": 5.5,
            "audio_url": ""  # Simulated, no actual audio
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert data["conversation_id"] == conv_id
        assert data["sender"] == "user"
        assert data["message_type"] == "voice"
        assert data["duration"] == 5.5
        assert data["content"] == "[Voice Message]"
        assert "timestamp" in data
        print(f"✓ POST /api/conversations/{conv_id}/voice creates voice message")
        return data
    
    def test_send_voice_message_with_audio_url(self, session, test_conversation):
        """Test sending a voice message with audio URL"""
        conv_id = test_conversation["id"]
        test_audio_url = "https://example.com/audio/test-recording.mp3"
        
        response = session.post(f"{BASE_URL}/api/conversations/{conv_id}/voice", json={
            "conversation_id": conv_id,
            "duration": 12.3,
            "audio_url": test_audio_url
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data["audio_url"] == test_audio_url
        assert data["duration"] == 12.3
        print(f"✓ Voice message with audio_url created successfully")
    
    def test_voice_message_updates_conversation(self, session, test_conversation):
        """Test that voice message updates conversation's last_message"""
        conv_id = test_conversation["id"]
        
        # Send voice message
        session.post(f"{BASE_URL}/api/conversations/{conv_id}/voice", json={
            "conversation_id": conv_id,
            "duration": 3.0
        })
        
        # Get conversation and verify last_message updated
        response = session.get(f"{BASE_URL}/api/conversations/{conv_id}")
        assert response.status_code == 200
        conv = response.json()["conversation"]
        
        assert conv["last_message"] == "Voice message"
        print("✓ Voice message updates conversation's last_message field")
    
    def test_voice_message_appears_in_messages(self, session, test_conversation):
        """Test that voice message appears in conversation messages"""
        conv_id = test_conversation["id"]
        
        # Send voice message
        voice_response = session.post(f"{BASE_URL}/api/conversations/{conv_id}/voice", json={
            "conversation_id": conv_id,
            "duration": 7.5
        })
        voice_msg_id = voice_response.json()["id"]
        
        # Get conversation messages
        response = session.get(f"{BASE_URL}/api/conversations/{conv_id}")
        messages = response.json()["messages"]
        
        # Find our voice message
        voice_msgs = [m for m in messages if m.get("id") == voice_msg_id]
        assert len(voice_msgs) == 1
        assert voice_msgs[0]["message_type"] == "voice"
        assert voice_msgs[0]["duration"] == 7.5
        print("✓ Voice message appears in conversation messages")
    
    def test_voice_message_nonexistent_conversation(self, session):
        """Test sending voice message to non-existent conversation returns 404"""
        response = session.post(f"{BASE_URL}/api/conversations/nonexistent-conv-id/voice", json={
            "conversation_id": "nonexistent-conv-id",
            "duration": 5.0
        })
        assert response.status_code == 404
        print("✓ Voice message to nonexistent conversation returns 404")
    
    def test_voice_message_zero_duration(self, session, test_conversation):
        """Test sending voice message with zero duration"""
        conv_id = test_conversation["id"]
        
        response = session.post(f"{BASE_URL}/api/conversations/{conv_id}/voice", json={
            "conversation_id": conv_id,
            "duration": 0
        })
        assert response.status_code == 200
        data = response.json()
        assert data["duration"] == 0
        print("✓ Voice message with zero duration is allowed")


# ============================================================================
# INTEGRATION VERIFICATION - ALL THREE FEATURES TOGETHER
# ============================================================================

class TestAllFeaturesIntegration(TestSetup):
    """Verify all three new features work together without conflicts"""
    
    def test_team_members_still_works(self, session):
        """Test that Team Members endpoint still works"""
        response = session.get(f"{BASE_URL}/api/team/members")
        assert response.status_code == 200
        data = response.json()
        assert "members" in data
        print(f"✓ GET /api/team/members still works ({len(data['members'])} members)")
    
    def test_team_invite_still_works(self, session):
        """Test that Team Invite endpoint still works"""
        test_email = f"test_invite_{uuid.uuid4().hex[:6]}@test.com"
        response = session.post(f"{BASE_URL}/api/team/invite", json={
            "email": test_email,
            "role": "agent",
            "name": "Test Agent"
        })
        # Should either succeed (200) or fail due to email already exists
        assert response.status_code in [200, 400]
        if response.status_code == 200:
            print(f"✓ POST /api/team/invite works - invited {test_email}")
        else:
            print(f"✓ POST /api/team/invite endpoint works (email may exist)")
    
    def test_all_integrations_list_includes_all_platforms(self, session):
        """Test that integrations list can include all platforms"""
        response = session.get(f"{BASE_URL}/api/integrations")
        assert response.status_code == 200
        data = response.json()
        
        # Verify we can have multiple platforms
        platforms = [i["platform"] for i in data["integrations"]]
        available_platforms = set(platforms)
        print(f"✓ Integrations list shows: {available_platforms}")
    
    def test_crm_conversations_still_work(self, session):
        """Test that CRM conversations still work with voice messages"""
        response = session.get(f"{BASE_URL}/api/conversations")
        assert response.status_code == 200
        data = response.json()
        assert "conversations" in data
        print(f"✓ CRM conversations still working ({data['total']} conversations)")
    
    def test_regular_text_messages_still_work(self, session):
        """Test that regular text messages still work alongside voice"""
        # Get a conversation
        response = session.get(f"{BASE_URL}/api/conversations")
        convos = response.json()["conversations"]
        
        if not convos:
            pytest.skip("No conversations available")
        
        conv_id = convos[0]["id"]
        
        # Send regular text message
        response = session.post(f"{BASE_URL}/api/conversations/{conv_id}/messages", json={
            "content": f"Regular text message test {uuid.uuid4().hex[:6]}"
        })
        assert response.status_code == 200
        data = response.json()
        
        # Regular messages should NOT have message_type='voice'
        assert data.get("message_type", "text") != "voice"
        print("✓ Regular text messages still work alongside voice messages")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
