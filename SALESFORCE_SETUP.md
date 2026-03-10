# Salesforce Connected App Setup Guide

This guide walks you through setting up a Salesforce Connected App for OAuth 2.0 JWT Bearer Flow (server-to-server authentication).

## Prerequisites

- Salesforce org with admin access
- OpenSSL installed on your machine

## Step 1: Generate RSA Key Pair

```bash
# Create certs directory
mkdir -p certs

# Generate private key
openssl genrsa -out certs/salesforce-private-key.pem 2048

# Generate certificate (public key)
openssl req -new -x509 -key certs/salesforce-private-key.pem -out certs/salesforce-certificate.crt -days 365

# When prompted, you can use default values or customize:
# - Country Name: US
# - State: Your State
# - Locality: Your City
# - Organization Name: Your Company
# - Common Name: Your Domain or App Name
```

## Step 2: Create Connected App in Salesforce

1. **Login to Salesforce**
   - Go to Setup (gear icon → Setup)

2. **Create Connected App**
   - In Quick Find, search for "App Manager"
   - Click "New Connected App"

3. **Fill in Basic Information**
   - **Connected App Name**: `Kai Gateway Integration` (or your preferred name)
   - **API Name**: Will auto-populate (e.g., `Kai_Gateway_Integration`)
   - **Contact Email**: Your email address

4. **Enable OAuth Settings**
   - Check "Enable OAuth Settings"
   - **Callback URL**: `https://login.salesforce.com/services/oauth2/callback`
     - (This is required but not used for JWT Bearer flow)

5. **Configure OAuth Scopes**
   Select the following scopes (add to Selected OAuth Scopes):
   - `Access and manage your data (api)`
   - `Perform requests on your behalf at any time (refresh_token, offline_access)`
   - `Access unique user identifiers (openid)`
   - Add any other scopes your integration needs

6. **Upload Certificate**
   - Check "Use digital signatures"
   - Click "Choose File" and upload `certs/salesforce-certificate.crt`

7. **Additional Settings**
   - Check "Enable for Device Flow" (optional, but recommended)
   - **IP Relaxation**: Set to "Relax IP restrictions" (for easier initial testing)

8. **Save**
   - Click "Save"
   - Click "Continue" on the warning message

## Step 3: Configure Connected App Policies

1. **Edit Policies**
   - After saving, click "Manage"
   - Click "Edit Policies"

2. **OAuth Policies**
   - **Permitted Users**: "Admin approved users are pre-authorized"
   - **IP Relaxation**: "Relax IP restrictions" (for development)
   - Click "Save"

3. **Manage Profiles or Permission Sets**
   - Click "Manage Profiles" or "Manage Permission Sets"
   - Select the profiles/permission sets that should have access
   - For testing, select "System Administrator"
   - Click "Save"

## Step 4: Get Consumer Key

1. **View Connected App**
   - Go back to App Manager (Setup → App Manager)
   - Find your Connected App
   - Click the dropdown arrow → "View"

2. **Copy Consumer Key**
   - Copy the "Consumer Key" value
   - This is your `SALESFORCE_CLIENT_ID`

## Step 5: Pre-Authorize the Integration User

The JWT Bearer flow requires a user to be pre-authorized.

1. **Create or Use Integration User** (Optional but recommended)
   - Create a dedicated integration user (e.g., `integration@yourcompany.com`)
   - Assign appropriate profile and permission sets
   - This user should have access to the Connected App (via profile/permission set)

2. **Ensure User is Pre-Authorized**
   - The user must be in a profile/permission set that was added in Step 3
   - For the first-time authorization, you may need to do an interactive OAuth flow once

## Step 6: Configure Environment Variables

1. **Copy the example environment file**
   ```bash
   cp .env.example .env
   ```

2. **Edit .env file**
   ```bash
   # Salesforce Configuration
   SALESFORCE_LOGIN_URL=https://login.salesforce.com  # or https://test.salesforce.com for sandbox
   SALESFORCE_CLIENT_ID=your_consumer_key_from_step_4
   SALESFORCE_USERNAME=integration@yourcompany.com  # The pre-authorized user
   SALESFORCE_PRIVATE_KEY_PATH=./certs/salesforce-private-key.pem

   # Kai API Configuration (update with your actual values)
   KAI_API_URL=https://api.kai.example.com
   KAI_BASIC_AUTH_USERNAME=your_kai_username
   KAI_BASIC_AUTH_PASSWORD=your_kai_password
   ```

## Step 7: Test the Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev
```

The server should start without errors. You can test the health endpoint:

```bash
curl http://localhost:3000/health
```

Test a Salesforce query:

```bash
curl "http://localhost:3000/api/salesforce/query?q=SELECT+Id,Name+FROM+Account+LIMIT+5"
```

## Troubleshooting

### "user hasn't approved this consumer"

- Ensure the integration user is in a profile/permission set that has access to the Connected App
- You may need to do an interactive OAuth flow once to pre-authorize

### "invalid_grant: expired authorization code"

- Check that your system time is correct
- JWT tokens are time-sensitive

### "invalid_client_id"

- Verify the Consumer Key is correct in your .env file
- Ensure the Connected App is enabled

### "invalid signature"

- Ensure the certificate uploaded matches the private key
- Regenerate keys if needed

### Connection Issues

- For sandbox: use `SALESFORCE_LOGIN_URL=https://test.salesforce.com`
- For production: use `SALESFORCE_LOGIN_URL=https://login.salesforce.com`

## Security Best Practices

1. **Never commit private keys to version control**
   - The `.gitignore` already excludes `.pem` files

2. **Rotate certificates regularly**
   - Set a reminder to regenerate certificates before they expire

3. **Use dedicated integration user**
   - Create a user specifically for this integration
   - Apply principle of least privilege

4. **Restrict IP ranges** (for production)
   - Once tested, configure IP restrictions in Connected App settings

5. **Monitor API usage**
   - Set up monitoring for API calls and errors
   - Watch for authentication failures

## Next Steps

- Implement specific business logic for your Salesforce-Kai integration
- Add error handling and retry logic
- Set up monitoring and alerting
- Configure production security settings
