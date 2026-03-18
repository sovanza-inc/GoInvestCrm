#!/usr/bin/env python3
"""
Test bulk delete functionality
"""
import requests
import json

base_url = "https://scan-and-run.preview.emergentagent.com"

# Login to get token
login_data = {"email": "sarah.chen@marketingpro.com", "password": "SecurePass123!"}
response = requests.post(f"{base_url}/api/auth/login", json=login_data)

if response.status_code == 200:
    token = response.json()['token']
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    
    print("✅ Authentication successful")
    
    # Get current leads
    print("\n📋 Getting current leads...")
    leads_response = requests.get(f"{base_url}/api/leads", headers=headers)
    
    if leads_response.status_code == 200:
        leads_data = leads_response.json()
        leads = leads_data.get('leads', [])
        print(f"Found {len(leads)} leads")
        
        if len(leads) >= 1:
            # Test bulk delete with one lead
            lead_to_delete = leads[0]['id']
            print(f"\n🗑️ Testing bulk delete with lead: {lead_to_delete[:8]}...")
            
            delete_data = {"lead_ids": [lead_to_delete]}
            delete_response = requests.post(f"{base_url}/api/leads/bulk-delete", json=delete_data, headers=headers)
            
            print(f"Delete status: {delete_response.status_code}")
            if delete_response.status_code == 200:
                result = delete_response.json()
                print(f"✅ Delete result: {result}")
                
                # Verify deletion
                verify_response = requests.get(f"{base_url}/api/leads/{lead_to_delete}", headers=headers)
                print(f"Verification status: {verify_response.status_code}")
                if verify_response.status_code == 404:
                    print("✅ Lead successfully deleted (confirmed with 404)")
                else:
                    print(f"❌ Lead still exists: {verify_response.status_code}")
            else:
                print(f"❌ Delete failed: {delete_response.text}")
        else:
            print("No leads available for deletion test")
    else:
        print(f"❌ Failed to get leads: {leads_response.status_code}")

else:
    print(f"❌ Login failed: {response.status_code} - {response.text}")