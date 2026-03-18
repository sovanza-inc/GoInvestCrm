import requests
import sys
import json
from datetime import datetime

class GoSocialAPITester:
    def __init__(self, base_url="https://sales-autopilot-21.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        
        # Test data
        self.test_user_email = "test@gosocial.com"
        self.test_user_password = "test123"
        self.test_user_name = "Test User"
        
        # Billing test data
        self.expected_plans = ['starter', 'growth', 'enterprise']
        self.expected_prices = {'starter': 29.00, 'growth': 79.00, 'enterprise': 199.00}
        
    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {method} {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"   ✅ PASSED - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    return True, response_data
                except:
                    return True, {}
            else:
                self.failed_tests.append(f"{name} - Expected {expected_status}, got {response.status_code}")
                print(f"   ❌ FAILED - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            self.failed_tests.append(f"{name} - Error: {str(e)}")
            print(f"   ❌ FAILED - Error: {str(e)}")
            return False, {}

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n" + "="*50)
        print("TESTING AUTHENTICATION ENDPOINTS")
        print("="*50)
        
        # Test registration with 7-day trial
        trial_user_email = "trial@test.com"
        trial_user_password = "trial123"
        
        reg_data = {
            "name": "Trial User",
            "email": trial_user_email,
            "password": trial_user_password,
            "company": "Trial Company"
        }
        
        success, response = self.run_test(
            "User Registration (with 7-day trial)",
            "POST",
            "auth/register",
            200,
            data=reg_data
        )
        
        if success and 'token' in response:
            trial_token = response['token']
            trial_user_id = response['user']['id']
            print(f"   📝 Trial user token obtained, ID: {trial_user_id}")
        
        # Test login with existing test user (no trial)
        login_data = {
            "email": self.test_user_email,
            "password": self.test_user_password
        }
        
        success, response = self.run_test(
            "User Login (existing user)",
            "POST", 
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            print(f"   📝 Login token obtained for existing user")
        
        # Test Google OAuth endpoint with invalid session
        google_auth_data = {"session_id": "invalid_session_12345"}
        success, response = self.run_test(
            "Google OAuth (invalid session)",
            "POST",
            "auth/google",
            401,  # Should reject invalid session
            data=google_auth_data
        )
        
        if success:
            print(f"   ✅ Correctly rejected invalid Google session")
        
        # Test Google OAuth endpoint with missing session_id
        google_auth_data_empty = {"session_id": ""}
        success, response = self.run_test(
            "Google OAuth (empty session_id)",
            "POST",
            "auth/google",
            400,  # Should require session_id
            data=google_auth_data_empty
        )
        
        if success:
            print(f"   ✅ Correctly rejected empty session_id")
        
        # Test get current user
        self.run_test(
            "Get Current User (/auth/me)",
            "GET",
            "auth/me",
            200
        )

    def test_seed_data(self):
        """Test seeding demo data"""
        print("\n" + "="*50)
        print("TESTING SEED DATA ENDPOINT")
        print("="*50)
        
        success, response = self.run_test(
            "Seed Demo Data",
            "POST",
            "seed-data",
            200
        )
        
        if success:
            print(f"   📊 Seeded: {response.get('leads', 0)} leads, {response.get('conversations', 0)} conversations, {response.get('templates', 0)} templates")

    def test_leads_endpoints(self):
        """Test leads management endpoints"""
        print("\n" + "="*50)
        print("TESTING LEADS ENDPOINTS")
        print("="*50)
        
        # Get all leads
        success, response = self.run_test(
            "Get All Leads",
            "GET",
            "leads",
            200
        )
        
        leads_count = 0
        first_lead_id = None
        if success and 'leads' in response:
            leads_count = len(response['leads'])
            if leads_count > 0:
                first_lead_id = response['leads'][0]['id']
            print(f"   📋 Found {leads_count} leads")
        
        # Test filtering
        self.run_test(
            "Filter Leads by Status",
            "GET",
            "leads",
            200,
            params={"status": "new"}
        )
        
        self.run_test(
            "Filter Leads by Platform", 
            "GET",
            "leads",
            200,
            params={"platform": "instagram"}
        )
        
        self.run_test(
            "Search Leads",
            "GET", 
            "leads",
            200,
            params={"search": "Sarah"}
        )
        
        # Test creating a new lead
        new_lead_data = {
            "name": "Test Lead",
            "handle": "testlead123",
            "platform": "instagram",
            "bio": "Test bio for automated testing",
            "followers": 1000,
            "engagement_rate": 5.5,
            "tags": ["test", "automation"],
            "notes": "Created by automated test"
        }
        
        success, response = self.run_test(
            "Create New Lead",
            "POST",
            "leads", 
            200,
            data=new_lead_data
        )
        
        created_lead_id = None
        if success and 'id' in response:
            created_lead_id = response['id']
            print(f"   ➕ Created lead ID: {created_lead_id}")
        
        # Test getting specific lead
        if first_lead_id:
            self.run_test(
                "Get Specific Lead",
                "GET",
                f"leads/{first_lead_id}",
                200
            )
        
        # Test deleting the created lead
        if created_lead_id:
            self.run_test(
                "Delete Lead",
                "DELETE",
                f"leads/{created_lead_id}",
                200
            )

    def test_conversations_endpoints(self):
        """Test conversation endpoints"""
        print("\n" + "="*50)
        print("TESTING CONVERSATION ENDPOINTS")
        print("="*50)
        
        # Get all conversations
        success, response = self.run_test(
            "Get All Conversations",
            "GET",
            "conversations",
            200
        )
        
        first_conv_id = None
        if success and 'conversations' in response:
            convs = response['conversations']
            conv_count = len(convs)
            print(f"   💬 Found {conv_count} conversations")
            if conv_count > 0:
                first_conv_id = convs[0]['id']
        
        # Test filtering conversations
        self.run_test(
            "Filter Conversations by Platform",
            "GET",
            "conversations",
            200,
            params={"platform": "instagram"}
        )
        
        self.run_test(
            "Filter Conversations by Status",
            "GET", 
            "conversations",
            200,
            params={"status": "active"}
        )
        
        # Test getting specific conversation with messages
        if first_conv_id:
            success, response = self.run_test(
                "Get Conversation with Messages",
                "GET",
                f"conversations/{first_conv_id}",
                200
            )
            
            if success and 'messages' in response:
                msg_count = len(response['messages'])
                print(f"   📨 Found {msg_count} messages in conversation")
            
            # Test sending a message
            message_data = {"content": "Test message from automated testing"}
            self.run_test(
                "Send Message",
                "POST",
                f"conversations/{first_conv_id}/messages",
                200,
                data=message_data
            )
            
            # Test starring conversation
            self.run_test(
                "Toggle Star Conversation",
                "PUT",
                f"conversations/{first_conv_id}/star",
                200
            )

    def test_ai_endpoints(self):
        """Test AI-powered features"""
        print("\n" + "="*50)
        print("TESTING AI ENDPOINTS")
        print("="*50)
        
        # Get a conversation ID and lead ID for testing
        conv_success, conv_response = self.run_test(
            "Get Conversations for AI Testing",
            "GET",
            "conversations",
            200
        )
        
        lead_success, lead_response = self.run_test(
            "Get Leads for AI Testing", 
            "GET",
            "leads",
            200
        )
        
        first_conv_id = None
        first_lead_id = None
        
        if conv_success and 'conversations' in conv_response and len(conv_response['conversations']) > 0:
            first_conv_id = conv_response['conversations'][0]['id']
            
        if lead_success and 'leads' in lead_response and len(lead_response['leads']) > 0:
            first_lead_id = lead_response['leads'][0]['id']
        
        # Test AI reply suggestions
        if first_conv_id:
            ai_suggest_data = {
                "conversation_id": first_conv_id,
                "context": "Customer interested in pricing"
            }
            success, response = self.run_test(
                "AI Suggest Reply",
                "POST",
                "ai/suggest-reply",
                200,
                data=ai_suggest_data
            )
            
            if success and 'suggestions' in response:
                suggestions_count = len(response['suggestions'])
                print(f"   🤖 Generated {suggestions_count} AI reply suggestions")
        
        # Test AI lead scoring
        if first_lead_id:
            ai_score_data = {"lead_id": first_lead_id}
            success, response = self.run_test(
                "AI Lead Scoring", 
                "POST",
                "ai/score-lead",
                200,
                data=ai_score_data
            )
            
            if success and 'score' in response:
                score = response['score']
                category = response.get('category', 'unknown')
                print(f"   🎯 AI scored lead: {score}/100 ({category})")

    def test_analytics_endpoints(self):
        """Test analytics endpoints"""
        print("\n" + "="*50)
        print("TESTING ANALYTICS ENDPOINTS") 
        print("="*50)
        
        # Test overview analytics
        success, response = self.run_test(
            "Analytics Overview",
            "GET",
            "analytics/overview",
            200
        )
        
        if success:
            print(f"   📊 Total leads: {response.get('total_leads', 0)}")
            print(f"   📊 Qualified leads: {response.get('qualified_leads', 0)}")
            print(f"   📊 Active conversations: {response.get('active_conversations', 0)}")
            print(f"   📊 Conversion rate: {response.get('conversion_rate', 0)}%")
        
        # Test pipeline analytics
        success, response = self.run_test(
            "Analytics Pipeline",
            "GET",
            "analytics/pipeline",
            200
        )
        
        if success and 'pipeline' in response:
            pipeline = response['pipeline']
            print(f"   📈 Pipeline stages: {list(pipeline.keys())}")

    def test_templates_endpoints(self):
        """Test message templates endpoints"""
        print("\n" + "="*50)
        print("TESTING TEMPLATES ENDPOINTS")
        print("="*50)
        
        # Get all templates
        success, response = self.run_test(
            "Get All Templates",
            "GET",
            "templates",
            200
        )
        
        first_template_id = None
        if success and 'templates' in response:
            templates = response['templates']
            template_count = len(templates)
            print(f"   📝 Found {template_count} templates")
            if template_count > 0:
                first_template_id = templates[0]['id']
        
        # Test filtering templates
        self.run_test(
            "Filter Templates by Category",
            "GET",
            "templates", 
            200,
            params={"category": "cold_outreach"}
        )
        
        self.run_test(
            "Search Templates",
            "GET",
            "templates",
            200, 
            params={"search": "follow"}
        )
        
        # Test creating a new template
        new_template_data = {
            "name": "Test Template",
            "content": "Hi {name}, this is a test template for automated testing. Best regards!",
            "category": "general",
            "tags": ["test", "automation"]
        }
        
        success, response = self.run_test(
            "Create New Template",
            "POST", 
            "templates",
            200,
            data=new_template_data
        )
        
        created_template_id = None
        if success and 'id' in response:
            created_template_id = response['id']
            print(f"   ➕ Created template ID: {created_template_id}")
        
        # Test updating template
        if first_template_id:
            update_data = {"name": "Updated Test Template"}
            self.run_test(
                "Update Template",
                "PUT",
                f"templates/{first_template_id}",
                200,
                data=update_data
            )
        
        # Test deleting the created template
        if created_template_id:
            self.run_test(
                "Delete Template",
                "DELETE", 
                f"templates/{created_template_id}",
                200
            )

    def test_settings_endpoints(self):
        """Test settings endpoints"""
        print("\n" + "="*50)
        print("TESTING SETTINGS ENDPOINTS")
        print("="*50)
        
        # Get current settings
        success, response = self.run_test(
            "Get User Settings",
            "GET",
            "settings",
            200
        )
        
        current_settings = response if success else {}
        
        # Test updating settings
        update_data = {
            "notifications_enabled": True,
            "auto_score": True,
            "daily_outreach_limit": 75
        }
        
        success, response = self.run_test(
            "Update Settings",
            "PUT",
            "settings",
            200,
            data=update_data
        )
        
        if success:
            print(f"   ⚙️ Updated settings successfully")

    def test_billing_endpoints(self):
        """Test billing-related endpoints"""
        print("\n" + "="*40)
        print("TESTING BILLING ENDPOINTS")
        print("="*40)
        
        # Test GET /api/billing/plans
        print("\n🔍 Testing billing plans endpoint...")
        success, response = self.run_test(
            "Get Billing Plans",
            "GET", 
            "billing/plans",
            200
        )
        
        if success:
            plans = response.get('plans', [])
            print(f"   📋 Found {len(plans)} plans")
            
            # Verify all expected plans exist with correct pricing
            plan_ids = [p.get('id') for p in plans]
            for expected_plan in self.expected_plans:
                if expected_plan not in plan_ids:
                    print(f"   ❌ Missing plan: {expected_plan}")
                    self.failed_tests.append(f"Missing {expected_plan} plan")
                else:
                    plan = next(p for p in plans if p.get('id') == expected_plan)
                    expected_price = self.expected_prices[expected_plan]
                    actual_price = plan.get('price')
                    if actual_price != expected_price:
                        print(f"   ❌ Wrong price for {expected_plan}: expected {expected_price}, got {actual_price}")
                        self.failed_tests.append(f"Wrong price for {expected_plan}")
                    else:
                        print(f"   ✅ {expected_plan} plan: ${actual_price}")
        
        # Test GET /api/billing/subscription with trial user
        print("\n🔍 Testing subscription status for trial user...")
        
        # First login as trial user to test trial status
        trial_login_data = {
            "email": "trial@test.com",
            "password": "trial123"
        }
        
        trial_success, trial_response = self.run_test(
            "Login as Trial User",
            "POST",
            "auth/login", 
            200,
            data=trial_login_data
        )
        
        if trial_success and 'token' in trial_response:
            # Temporarily store current token
            original_token = self.token
            self.token = trial_response['token']
            
            success, response = self.run_test(
                "Get Trial User Subscription",
                "GET",
                "billing/subscription", 
                200
            )
            
            if success:
                plan = response.get('plan', 'unknown')
                status = response.get('status', 'unknown')
                days_remaining = response.get('days_remaining')
                print(f"   📊 Trial user - Plan: {plan}, Status: {status}")
                if days_remaining is not None:
                    print(f"   📅 Days remaining: {days_remaining}")
                    if status == 'trial' and days_remaining >= 0:
                        print(f"   ✅ Trial status correctly showing")
                    else:
                        print(f"   ❌ Trial status issue")
                        self.failed_tests.append("Trial status not showing correctly")
                else:
                    print(f"   ❌ Missing days_remaining for trial user")
                    self.failed_tests.append("Missing days_remaining for trial user")
            
            # Restore original token
            self.token = original_token
        
        # Test GET /api/billing/subscription with existing user (no trial)  
        print("\n🔍 Testing subscription status for existing user...")
        success, response = self.run_test(
            "Get Existing User Subscription",
            "GET",
            "billing/subscription", 
            200
        )
        
        if success:
            plan = response.get('plan', 'unknown')
            status = response.get('status', 'unknown')
            print(f"   📊 Existing user - Plan: {plan}, Status: {status}")
        
        # Test POST /api/billing/create-checkout with valid plan
        print("\n🔍 Testing create checkout with valid plan...")
        checkout_data = {
            "plan_id": "growth", 
            "origin_url": "https://sales-autopilot-21.preview.emergentagent.com"
        }
        success, response = self.run_test(
            "Create Checkout - Valid Plan",
            "POST",
            "billing/create-checkout",
            200,
            data=checkout_data
        )
        
        session_id = None
        if success:
            if 'url' in response and 'session_id' in response:
                session_id = response['session_id']
                print(f"   🔗 Checkout URL created")
                print(f"   🆔 Session ID: {session_id}")
            else:
                print(f"   ❌ Missing url or session_id in response")
                self.failed_tests.append("Missing checkout URL or session ID")
        
        # Test POST /api/billing/create-checkout with invalid plan_id  
        print("\n🔍 Testing create checkout with invalid plan...")
        invalid_checkout_data = {
            "plan_id": "invalid_plan",
            "origin_url": "https://sales-autopilot-21.preview.emergentagent.com"
        }
        success, response = self.run_test(
            "Create Checkout - Invalid Plan",
            "POST", 
            "billing/create-checkout",
            400,
            data=invalid_checkout_data
        )
        
        if success:
            print(f"   ✅ Correctly rejected invalid plan_id")
        
        # Test GET /api/billing/status/{session_id} if we have a session_id
        if session_id:
            print(f"\n🔍 Testing billing status for session {session_id}...")
            success, response = self.run_test(
                "Get Billing Status", 
                "GET",
                f"billing/status/{session_id}",
                200
            )
            
            if success:
                status = response.get('status', 'unknown')
                payment_status = response.get('payment_status', 'unknown')  
                print(f"   💳 Payment status: {payment_status}")
                print(f"   📋 Session status: {status}")
        
        # Test webhook endpoint exists
        print("\n🔍 Testing Stripe webhook endpoint...")
        # Use a direct POST to the webhook with minimal data to see if endpoint exists
        webhook_url = f"{self.base_url}/api/webhook/stripe"
        try:
            response = requests.post(
                webhook_url,
                json={}, 
                headers={"Stripe-Signature": "test_signature"},
                timeout=10
            )
            if response.status_code == 200:
                print(f"   ✅ Webhook endpoint accessible (status 200)")
                self.tests_passed += 1
            else:
                print(f"   ⚠️ Webhook endpoint returned {response.status_code}")
            self.tests_run += 1
        except Exception as e:
            print(f"   ❌ Webhook endpoint error: {str(e)}")
            self.failed_tests.append(f"Webhook endpoint error: {str(e)}")
            self.tests_run += 1
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/max(self.tests_run,1)*100):.1f}%")
        
        if self.failed_tests:
            print(f"\nFAILED TESTS:")
            for i, failure in enumerate(self.failed_tests, 1):
                print(f"{i}. {failure}")
        
        return self.tests_passed == self.tests_run

def main():
    """Run all API tests"""
    print("🚀 Starting GoSocial API Tests")
    print("Backend URL: https://sales-autopilot-21.preview.emergentagent.com")
    print("Test User: test@gosocial.com")
    
    tester = GoSocialAPITester()
    
    try:
        # Test authentication first
        tester.test_auth_endpoints()
        
        if not tester.token:
            print("❌ Authentication failed, cannot continue with other tests")
            return 1
        
        # Test seed data  
        tester.test_seed_data()
        
        # Test all other endpoints
        tester.test_leads_endpoints()
        tester.test_conversations_endpoints() 
        tester.test_ai_endpoints()
        tester.test_analytics_endpoints()
        tester.test_templates_endpoints()
        tester.test_settings_endpoints()
        tester.test_billing_endpoints()
        
    except KeyboardInterrupt:
        print("\n⚠️ Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        return 1
    
    finally:
        success = tester.print_summary()
        return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())