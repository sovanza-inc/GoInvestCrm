#!/usr/bin/env python3
"""
Test CSV import functionality
"""
import requests

base_url = "https://sales-autopilot-21.preview.emergentagent.com"

# Login to get token
login_data = {"email": "sarah.chen@marketingpro.com", "password": "SecurePass123!"}
response = requests.post(f"{base_url}/api/auth/login", json=login_data)

if response.status_code == 200:
    token = response.json()['token']
    headers = {'Authorization': f'Bearer {token}'}
    
    print("✅ Authentication successful")
    
    # Test CSV import
    print("\n📥 Testing CSV import...")
    
    try:
        with open('/app/sample_leads_import.csv', 'rb') as csv_file:
            files = {'file': ('sample_leads.csv', csv_file, 'text/csv')}
            import_response = requests.post(f"{base_url}/api/leads/bulk-import", headers=headers, files=files)
            
            print(f"Status: {import_response.status_code}")
            if import_response.status_code == 200:
                result = import_response.json()
                print(f"✅ Import result:")
                print(f"   Imported: {result.get('imported', 0)}")
                print(f"   Skipped: {result.get('skipped', 0)}")  
                print(f"   Errors: {len(result.get('errors', []))}")
                if result.get('errors'):
                    print(f"   Error details: {result['errors'][:2]}")  # Show first 2 errors
            else:
                print(f"❌ Import failed: {import_response.text}")
    except Exception as e:
        print(f"❌ Error during import: {e}")

else:
    print(f"❌ Login failed: {response.status_code} - {response.text}")