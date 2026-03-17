# Auth Testing Playbook for GoSocial

## Step 1: Create Test User & Session
```bash
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  id: userId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Test User',
  company: '',
  password_hash: '',
  auth_provider: 'google',
  subscription: 'growth',
  subscription_status: 'trial',
  trial_end: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
  created_at: new Date().toISOString()
});
print('User ID: ' + userId);
"
```

## Step 2: Test Backend API
```bash
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
TOKEN=$(curl -s -X POST "$API_URL/api/auth/login" -H "Content-Type: application/json" -d '{"email":"test@gosocial.com","password":"test123"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")

# Test auth
curl -X GET "$API_URL/api/auth/me" -H "Authorization: Bearer $TOKEN"

# Test billing
curl -X GET "$API_URL/api/billing/subscription" -H "Authorization: Bearer $TOKEN"
curl -X GET "$API_URL/api/billing/plans"
```

## Step 3: Browser Testing
```python
# Set auth and navigate
await page.evaluate("localStorage.setItem('gosocial_token', 'YOUR_TOKEN')")
await page.goto("https://your-app.com/dashboard")
```

## Checklist
- [ ] User document has id field
- [ ] All queries use {"_id": 0} projection
- [ ] /api/auth/me returns user data
- [ ] Dashboard loads without redirect
- [ ] Google OAuth button redirects correctly
- [ ] Landing page renders for unauthenticated users
- [ ] Billing subscription shows trial status
