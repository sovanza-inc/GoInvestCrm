#!/usr/bin/env python3
"""
Quick verification of bulk actions APIs
"""
import requests
import json

base_url = "https://sales-autopilot-21.preview.emergentagent.com"

# Login to get token
login_data = {"email": "sarah.chen@marketingpro.com", "password": "SecurePass123!"}
response = requests.post(f"{base_url}/api/auth/login", json=login_data)

if response.status_code == 200:
    token = response.json()['token']
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    
    print("✅ Authentication successful")
    
    # Test bulk export
    print("\n📤 Testing bulk export...")
    export_response = requests.post(f"{base_url}/api/leads/bulk-export", headers=headers)
    print(f"Status: {export_response.status_code}")
    if export_response.status_code == 200:
        print(f"Content-Type: {export_response.headers.get('content-type')}")
        print(f"Content length: {len(export_response.text)} chars")
        print("✅ Bulk export working")
    
    # Test getting leads
    print("\n📋 Getting leads...")
    leads_response = requests.get(f"{base_url}/api/leads", headers=headers)
    print(f"Status: {leads_response.status_code}")
    if leads_response.status_code == 200:
        leads_data = leads_response.json()
        lead_count = len(leads_data.get('leads', []))
        print(f"Found {lead_count} leads")
        
        if lead_count >= 2:
            lead_ids = [lead['id'] for lead in leads_data['leads'][:2]]
            
            # Test bulk update
            print(f"\n✏️ Testing bulk update on leads: {[id[:8] + '...' for id in lead_ids]}")
            update_data = {
                "lead_ids": lead_ids,
                "updates": {"status": "qualified", "tags": ["test-update"]}
            }
            update_response = requests.post(f"{base_url}/api/leads/bulk-update", json=update_data, headers=headers)
            print(f"Status: {update_response.status_code}")
            if update_response.status_code == 200:
                result = update_response.json()
                print(f"✅ Updated {result.get('updated', 0)} leads")
            else:
                print(f"❌ Update failed: {update_response.text}")
        
    # Test empty inputs validation
    print("\n🧪 Testing validation...")
    
    # Empty lead_ids for update
    empty_update = {"lead_ids": [], "updates": {"status": "test"}}
    response = requests.post(f"{base_url}/api/leads/bulk-update", json=empty_update, headers=headers)
    print(f"Empty update lead_ids: {response.status_code} ({'✅ PASS' if response.status_code == 400 else '❌ FAIL'})")
    
    # Empty lead_ids for delete  
    empty_delete = {"lead_ids": []}
    response = requests.post(f"{base_url}/api/leads/bulk-delete", json=empty_delete, headers=headers)
    print(f"Empty delete lead_ids: {response.status_code} ({'✅ PASS' if response.status_code == 400 else '❌ FAIL'})")

else:
    print(f"❌ Login failed: {response.status_code} - {response.text}")