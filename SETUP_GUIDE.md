# Complete Salesforce Setup Guide

This is a detailed, step-by-step guide to set up the Salesforce Connected App and custom fields for the Kai integration.

## Prerequisites

- Salesforce org with System Administrator access
- **Salesforce Platform license** (or full Salesforce license) for integration user
  - ⚠️ Cannot use "Salesforce Integration" license (doesn't support Event/Task objects)
- OpenSSL installed (comes with macOS/Linux, Windows users need Git Bash or WSL)
- Terminal/command line access

---

## Part 1: Generate RSA Certificate

Open your terminal in the `salesforce-app` directory and run:

```bash
# Create certs directory
mkdir -p certs

# Generate private key (2048-bit RSA)
openssl genrsa -out certs/salesforce-private-key.pem 2048

# Generate certificate (valid for 1 year)
openssl req -new -x509 -key certs/salesforce-private-key.pem \
  -out certs/salesforce-certificate.crt -days 365
```

When prompted, enter these values:

```
Country Name (2 letter code): UK
State or Province Name: London
Locality Name: London
Organization Name: KAI Conversations
Organizational Unit Name: IT
Common Name: Kai Integration
Email Address: richardw@kaiconversations.com
```

**Important:** Keep `salesforce-private-key.pem` secure. Never commit it to git (already in .gitignore).

---

## Part 2: Create Connected App in Salesforce

### 2.1 Navigate to Setup

1. Login to your Salesforce org
2. Click the **gear icon** (⚙️) in the top right
3. Click **"Setup"**

### 2.2 Open App Manager

1. In the Quick Find box (left sidebar), type: **`App Manager`**
2. Click **"App Manager"** from the results
3. Click the **"New Connected App"** button (top right)

### 2.3 Basic Information

Fill in the following fields:

| Field | Value |
|-------|-------|
| **Connected App Name** | `Kai Gateway Integration` |
| **API Name** | `Kai_Gateway_Integration` (auto-filled) |
| **Contact Email** | `your-email@company.com` |
| **Description** | `Server-to-server integration for syncing Kai conversation data to Salesforce Events and Tasks` |

### 2.4 Enable OAuth Settings

1. Check ✓ **"Enable OAuth Settings"**

2. **Callback URL:**
   ```
   https://login.salesforce.com/services/oauth2/callback
   ```
   *(Required field but not used for JWT Bearer flow)*

3. Check ✓ **"Use digital signatures"**

4. Click **"Choose File"** and upload:
   ```
   certs/salesforce-certificate.crt
   ```

5. **Selected OAuth Scopes** - Click "Add" to move these from Available to Selected:
   - ✓ **Access and manage your data (api)**
   - ✓ **Perform requests on your behalf at any time (refresh_token, offline_access)**
   - ✓ **Access unique user identifiers (openid)**

### 2.5 Additional Settings (Optional)

- Check ✓ **"Enable for Device Flow"** (recommended for easier testing)
- **IP Relaxation:** Select **"Relax IP restrictions"** (for development/testing)
  - For production, configure specific IP ranges

### 2.6 Save

1. Click **"Save"**
2. You'll see a warning message - click **"Continue"**
3. Wait 2-10 minutes for the app to propagate (grab a coffee ☕)

---

## Part 3: Configure Policies

### 3.1 Edit Policies

1. After saving, click **"Manage"** button
2. Click **"Edit Policies"**

### 3.2 OAuth Policies

Set these values:

| Setting | Value |
|---------|-------|
| **Permitted Users** | `Admin approved users are pre-authorized` |
| **IP Relaxation** | `Relax IP restrictions` (for dev) |
| **Refresh Token Policy** | `Refresh token is valid until revoked` |

3. Click **"Save"**

### 3.3 Manage Profiles/Permission Sets

1. Click **"Manage Profiles"** or **"Manage Permission Sets"**
2. Select profiles that should have access:
   - ✓ **System Administrator** (for testing)
   - ✓ Any other profiles for your integration user

3. Click **"Save"**

---

## Part 4: Get Consumer Key (Client ID)

1. Go back to **Setup → App Manager**
2. Find **"Kai Gateway Integration"**
3. Click the dropdown arrow (▼) → **"View"**
4. Find the **"Consumer Key"** section
5. Click **"Click to reveal"** or copy icon
6. **Copy this value** - you'll need it for the `.env` file

**Save it as:** This is your `SALESFORCE_CLIENT_ID`

---

## Part 5: Create Integration User (Recommended)

It's best practice to create a dedicated user for integrations.

### 5.1 Choose License Type

**IMPORTANT:** This integration creates Events and Tasks (standard Salesforce objects). You need a license that supports these objects:

| License Type | Events/Tasks | Custom Objects | Cost | Recommendation |
|--------------|--------------|----------------|------|----------------|
| **Salesforce Platform** | ✅ Yes | ✅ Yes | ~$25/user/month | ✅ **Recommended** |
| **Salesforce** (full) | ✅ Yes | ✅ Yes | ~$75-150/user/month | ✅ Works (expensive) |
| Salesforce Integration | ❌ No | ✅ Yes | ~$10/user/month | ❌ Won't work |

> **Why Integration license doesn't work:**
> The "Salesforce Integration" license with "Minimum Access - API Only Integrations" profile is designed for custom objects only. It cannot create/edit Events or Tasks (Activity objects). You'll get errors like:
> - "The user license doesn't allow Edit Tasks"
> - "The user license doesn't allow Edit Events"
> - "The user license doesn't allow Access Activities"

### 5.2 Create User

1. **Setup → Users → New User**

| Field | Value |
|-------|-------|
| **First Name** | `Kai` |
| **Last Name** | `Integration` |
| **Email** | `kai-integration@yourcompany.com` |
| **Username** | `kai-integration@yourcompany.com.integration` |
| **User License** | `Salesforce Platform` ⚠️ |
| **Profile** | `Standard Platform User` or custom profile |

⚠️ **Critical:** Must use **Salesforce Platform** or **Salesforce** license (not Integration license)

2. Uncheck **"Generate new password and notify user immediately"**
3. Set a password manually
4. Click **"Save"**

### 5.3 Assign to Connected App

After creating the user:

1. Go to **Setup → App Manager**
2. Find **Kai Gateway Integration** → Click dropdown → **Manage**
3. Click **Edit Policies**
4. Set **Permitted Users** to `Admin approved users are pre-authorized`
5. Click **Save**
6. Click **Manage Permission Sets** or **Manage Profiles**
7. Add the profile: **Standard Platform User** (or your custom profile)
8. Click **Save**

### 5.4 Create Permission Set (Optional but Recommended)

For better security, create a permission set with only required permissions:

1. **Setup → Permission Sets → New**

| Field | Value |
|-------|-------|
| **Label** | `Kai Integration Permissions` |
| **API Name** | `Kai_Integration_Permissions` |
| **License** | `--None--` |

2. Click **Save**

3. **Configure Object Permissions:**
   - Find **Event** → Edit → Grant:
     - ✓ Read, ✓ Create, ✓ Edit
   - Find **Task** → Edit → Grant:
     - ✓ Read, ✓ Create, ✓ Edit
   - Find **KAI_Conversation__c** → Edit → Grant:
     - ✓ Read, ✓ Create, ✓ Edit

4. **Configure Field Permissions:**
   - Grant Read/Edit access to all Kai custom fields

5. **Assign to User:**
   - Setup → Permission Sets → Kai Integration Permissions → Manage Assignments
   - Click **Add Assignments**
   - Select your integration user
   - Click **Assign**

---

## Part 6: Configure Environment Variables

### 6.1 Copy Example File

```bash
cp .env.example .env
```

### 6.2 Edit .env File

Open `.env` in your editor and fill in:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Salesforce OAuth Configuration
SALESFORCE_LOGIN_URL=https://login.salesforce.com
# For sandbox, use: https://test.salesforce.com

SALESFORCE_CLIENT_ID=<PASTE_CONSUMER_KEY_HERE>
# This is the Consumer Key from Part 4

SALESFORCE_USERNAME=kai-integration@yourcompany.com.integration
# This is the integration user from Part 5

SALESFORCE_PRIVATE_KEY_PATH=./certs/salesforce-private-key.pem
# Path to your private key

# Kai API Configuration
KAI_API_URL=https://api.kai.example.com
KAI_BASIC_AUTH_USERNAME=your_kai_username
KAI_BASIC_AUTH_PASSWORD=your_kai_password
```

**Important URLs:**
- **Production:** `https://login.salesforce.com`
- **Sandbox:** `https://test.salesforce.com`
- **My Domain:** If you use My Domain, use your custom domain URL

---

## Part 7: Create Custom Fields

### 7.1 Event Object Fields

1. **Setup → Object Manager → Event → Fields & Relationships → New**

Create these **15 fields** (refer to [SALESFORCE_CUSTOM_FIELDS.md](./SALESFORCE_CUSTOM_FIELDS.md) for details):

**Critical Field - Create First:**

| Field Label | API Name | Type | Length | Extra Settings |
|------------|----------|------|--------|----------------|
| Kai Conversation ID | `Kai_Conversation_Id__c` | Number | 18, 0 | ✓ External ID, ✓ Unique |

**Metadata Fields:**

| Field Label | API Name | Type | Length |
|------------|----------|------|--------|
| Kai Project | `Kai_Project__c` | Text | 255 |
| Kai Owner | `Kai_Owner__c` | Text | 255 |
| Kai Team | `Kai_Team__c` | Text | 255 |
| Kai First Party Label | `Kai_First_Party_Label__c` | Text | 100 |
| Kai Second Party Label | `Kai_Second_Party_Label__c` | Text | 100 |
| Kai Type | `Kai_Type__c` | Text | 50 |
| Kai Language | `Kai_Language__c` | Text | 10 |

**Kai Status (Picklist):**
- Field Label: `Kai Status`
- API Name: `Kai_Status__c`
- Type: Picklist
- Values: `Draft`, `Published`, `Archived`

**Coaching Metrics:**

| Field Label | API Name | Type | Length/Precision |
|------------|----------|------|------------------|
| Kai Speaker Balance | `Kai_Speaker_Balance__c` | Text | 255 |
| Kai Clinical Focus | `Kai_Clinical_Focus__c` | Text | 50 |
| Kai Open Questions | `Kai_Open_Questions__c` | Number | 5, 0 |
| Kai Closed Questions | `Kai_Closed_Questions__c` | Number | 5, 0 |
| Kai Coaching Score | `Kai_Coaching_Score__c` | Number | 5, 2 |
| Kai Coaching Feedback | `Kai_Coaching_Feedback__c` | Long Text Area | 32,768 |

### 7.2 Task Object Fields

1. **Setup → Object Manager → Task → Fields & Relationships → New**

Create these **4 fields:**

**Kai Action Type (Picklist):**
- Field Label: `Kai Action Type`
- API Name: `Kai_Action_Type__c`
- Type: Picklist
- Values: `Rep Action`, `HCP Commitment`, `Missed Action`

**Other Fields:**

| Field Label | API Name | Type | Length |
|------------|----------|------|--------|
| Kai Success Criteria | `Kai_Success_Criteria__c` | Long Text Area | 1,000 |
| Kai Conversation ID | `Kai_Conversation_Id__c` | Number | 18, 0 |
| Kai Action Number | `Kai_Action_Number__c` | Number | 3, 0 |

### 7.3 Set Field-Level Security

For each custom field:

1. Click on the field name
2. Click **"Set Field-Level Security"**
3. Check **"Visible"** for your integration user's profile
4. Click **"Save"**

---

## Part 8: Update Page Layouts (Optional)

### 8.1 Event Layout

1. **Setup → Object Manager → Event → Page Layouts → Event Layout → Edit**
2. Drag a new **Section** onto the layout
3. Name it: `Kai Meeting Details`
4. Drag your custom fields into this section
5. Click **"Save"**

### 8.2 Task Layout

1. **Setup → Object Manager → Task → Page Layouts → Task Layout → Edit**
2. Add a new section: `Kai Action Details`
3. Add your custom fields
4. Click **"Save"**

---

## Part 9: Test the Connection

### 9.1 Install Dependencies

```bash
npm install
```

### 9.2 Start the Server

```bash
npm run dev
```

You should see:
```
[10:30:00] INFO: Server listening on http://0.0.0.0:3000
```

### 9.3 Test Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-26T10:30:00.000Z",
  "uptime": 5.123
}
```

### 9.4 Test Salesforce Authentication

```bash
# This will attempt to authenticate and query Salesforce
curl "http://localhost:3000/api/salesforce/query?q=SELECT+Id,Name+FROM+Account+LIMIT+1"
```

**Success:** You'll get Account data back

**Failure:** Check logs for error messages

---

## Part 10: Test Sync

### 10.1 Preview Sync

```bash
curl http://localhost:3000/api/sync/preview/45211
```

This shows what would be created without actually creating it.

### 10.2 Sync Test Conversation

```bash
curl -X POST http://localhost:3000/api/sync/conversation/45211
```

Expected response:
```json
{
  "success": true,
  "eventId": "00U...",
  "taskIds": ["00T...", "00T..."],
  "errors": []
}
```

### 10.3 Verify in Salesforce

1. Go to **Events** tab in Salesforce
2. Look for event with Subject: **"Conf/Sent Test 2.1"**
3. Open the Event
4. Check that custom fields are populated
5. Check Related Tasks (should see 6 tasks)

---

## Troubleshooting

### Error: "user is not admin approved to access this app"

**Cause:** Integration user not authorized for the Connected App

**Fix:**
1. Go to **Setup → App Manager → Kai Gateway Integration → Manage**
2. Click **Edit Policies**
3. Set **Permitted Users** to `Admin approved users are pre-authorized`
4. Click **Save**
5. Click **Manage Permission Sets** or **Manage Profiles**
6. Add your integration user's profile
7. Try again

### Error: "The user license doesn't allow Edit Tasks/Events/Access Activities"

**Cause:** Using Salesforce Integration license which doesn't support standard Activity objects

**Symptoms:**
```
Can't assign permission set to user. The user license doesn't allow:
- Edit Tasks
- Edit Events
- Access Activities
- App Permissions
```

**Fix:**
1. Change user license to **Salesforce Platform** or **Salesforce**
2. Setup → Users → Find integration user → Edit
3. Change **User License** to `Salesforce Platform`
4. Change **Profile** to `Standard Platform User`
5. Save and retry permission set assignment

**Why this happens:** The Integration license is designed for custom objects only and cannot access standard Salesforce objects like Event and Task.

### Error: "user hasn't approved this consumer"

**Cause:** Old error message, same as "user is not admin approved" above

**Fix:** See "user is not admin approved to access this app" above

### Error: "invalid_grant"

**Cause:** Clock skew or wrong credentials

**Fix:**
1. Verify system time is correct: `date`
2. Verify username matches exactly: check `.env` file
3. Verify Consumer Key is correct

### Error: "invalid signature"

**Cause:** Certificate doesn't match private key

**Fix:**
1. Regenerate both certificate and private key
2. Re-upload certificate to Connected App
3. Wait 2-10 minutes for propagation

### Error: "Field does not exist"

**Cause:** Custom fields not created or wrong API name

**Fix:**
1. Verify field API names exactly match (case-sensitive, must end in `__c`)
2. Check field-level security allows integration user access
3. Use Workbench or Developer Console to verify field existence

### Error: "Insufficient access rights"

**Cause:** User doesn't have permission to create Events/Tasks

**Fix:**
1. Verify profile has Create permission on Event and Task
2. Check sharing settings (OWD)
3. Ensure user is active

---

## Security Checklist

Before going to production:

- [ ] Store private key securely (not in git)
- [ ] Use dedicated integration user (not personal admin account)
- [ ] Configure IP restrictions on Connected App
- [ ] Set strong password on integration user
- [ ] Enable two-factor authentication on admin account
- [ ] Review and minimize OAuth scopes if possible
- [ ] Set certificate expiration reminder (1 year)
- [ ] Enable field history tracking on important fields
- [ ] Configure login hours for integration user
- [ ] Set up monitoring/alerting for failed auth attempts

---

## Next Steps

1. ✓ Connected App created and configured
2. ✓ Custom fields created on Event and Task
3. ✓ Integration tested successfully
4. [ ] Create Salesforce reports for coaching metrics
5. [ ] Build dashboards for management visibility
6. [ ] Set up scheduled sync (if needed)
7. [ ] Configure webhooks from Kai (if available)
8. [ ] Train users on new fields
9. [ ] Document processes for your team
10. [ ] Plan for certificate rotation (before 1 year expiry)

---

## Quick Reference

**Connected App Name:** `Kai Gateway Integration`

**OAuth Scopes:**
- `api`
- `refresh_token, offline_access`
- `openid`

**Custom Fields Created:**
- Event: 15 fields
- Task: 4 fields

**Sync Endpoints:**
- Preview: `GET /api/sync/preview/:id`
- Sync: `POST /api/sync/conversation/:id`
- Batch: `POST /api/sync/all`

**Key Files:**
- `.env` - Configuration
- `certs/salesforce-private-key.pem` - Private key (DO NOT COMMIT)
- `certs/salesforce-certificate.crt` - Public certificate
