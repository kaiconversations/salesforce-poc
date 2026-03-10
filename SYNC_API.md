# Kai Sync API Documentation

This document describes the API endpoints for syncing Kai conversation data to Salesforce.

## Overview

The sync service transforms Kai conversation data into Salesforce Events and Tasks:
- **Conversation → Event**: Meeting summary with coaching metrics
- **Actions → Tasks**: Rep actions, HCP commitments, and missed action points

## Endpoints

### 1. Preview Sync

Preview what would be created in Salesforce without actually syncing.

**Endpoint:** `GET /api/sync/preview/:id`

**Parameters:**
- `id` (path): Conversation ID to preview

**Response:**
```json
{
  "event": {
    "Subject": "Conf/Sent Test 2.1",
    "Description": "Commercial summary\n\nThe call focused on...",
    "StartDateTime": "2025-11-26T00:00:00.000Z",
    "EndDateTime": "2025-11-26T00:30:00.000Z",
    "DurationInMinutes": 30,
    "Type": "Meeting",
    "Kai_Conversation_Id__c": 45211,
    "Kai_Project__c": "[Testing] STP-sales-en",
    "Kai_Owner__c": "Adam Knights",
    "Kai_Team__c": "BB Demo Team",
    "Kai_Speaker_Balance__c": "Operator: 86%, Customer: 14%",
    "Kai_Clinical_Focus__c": "72%",
    "Kai_Open_Questions__c": 3,
    "Kai_Closed_Questions__c": 28,
    "Kai_Coaching_Score__c": -0.33
  },
  "tasks": [
    {
      "Subject": "Send the latest slide deck with presenter notes...",
      "Description": "Send the latest slide deck...\n\nSuccess Criteria: HCP confirms receipt",
      "Status": "Not Started",
      "Priority": "Normal",
      "Kai_Action_Type__c": "Rep Action",
      "Kai_Conversation_Id__c": 45211,
      "Kai_Action_Number__c": 1
    }
  ],
  "taskCount": 6
}
```

**Example:**
```bash
curl http://localhost:3000/api/sync/preview/45211
```

---

### 2. Sync Single Conversation (from local data)

Sync a conversation from the local `kai-data` folder.

**Endpoint:** `POST /api/sync/conversation/:id`

**Parameters:**
- `id` (path): Conversation ID to sync

**Response:**
```json
{
  "success": true,
  "eventId": "00U5g000007XYZ123",
  "taskIds": [
    "00T5g000007ABC123",
    "00T5g000007ABC124",
    "00T5g000007ABC125"
  ],
  "errors": []
}
```

**Error Response:**
```json
{
  "success": false,
  "errors": [
    "Failed to create task: Field Kai_Action_Type__c does not exist"
  ]
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/sync/conversation/45211
```

---

### 3. Sync Conversation (from request body)

Sync a conversation by providing the full data in the request body.

**Endpoint:** `POST /api/sync/conversation`

**Request Body:**
```json
{
  "conversation": {
    "id": 45211,
    "date": "2025-11-26T00:00:00.000Z",
    "title": "Meeting Title",
    "summary": "Commercial summary\n\nRep actions\n\n1) Action 1...",
    "owner_display_name": "John Doe",
    "project_display_name": "Project Name",
    "..."
  },
  "analysis": {
    "coachingFeedback": {
      "suggestions": {
        "text": "Coaching feedback...",
        "raw_json": [...]
      }
    }
  },
  "dynamicCoaching": { "..." },
  "tags": [...]
}
```

**Response:** Same as endpoint #2

**Example:**
```bash
curl -X POST http://localhost:3000/api/sync/conversation \
  -H "Content-Type: application/json" \
  -d @conversation-data.json
```

---

### 4. Sync All Conversations

Sync all conversations from the local `kai-data` folder.

**Endpoint:** `POST /api/sync/all`

**Response:**
```json
{
  "results": [
    {
      "success": true,
      "eventId": "00U5g000007XYZ123",
      "taskIds": ["00T5g000007ABC123", "..."],
      "errors": []
    }
  ],
  "summary": {
    "total": 1,
    "successful": 1,
    "failed": 0
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/sync/all
```

---

## Data Transformation

### Conversation → Event Mapping

| Kai Field | Salesforce Field | Notes |
|-----------|------------------|-------|
| `id` | `Kai_Conversation_Id__c` | External ID for upsert |
| `title` | `Subject` | Event subject line |
| `summary` | `Description` | Full summary text |
| `date` | `StartDateTime` | Meeting start time |
| `date + 30min` | `EndDateTime` | Calculated end time |
| `project_display_name` | `Kai_Project__c` | Custom field |
| `owner_display_name` | `Kai_Owner__c` | Custom field |
| `team_display_name` | `Kai_Team__c` | Custom field |
| - | `Type` | Always "Meeting" |

### Actions → Task Mapping

Actions are parsed from the summary sections:
- **Rep actions** → Tasks with `Kai_Action_Type__c = "Rep Action"`
- **HCP commitments** → Tasks with `Kai_Action_Type__c = "HCP Commitment"`
- **Missed action points** → Tasks with `Kai_Action_Type__c = "Missed Action"`

| Parsed Field | Salesforce Field | Notes |
|--------------|------------------|-------|
| Description | `Subject` | Truncated to 255 chars |
| Full description | `Description` | Includes success criteria |
| Type | `Kai_Action_Type__c` | Rep/HCP/Missed |
| Success criteria | `Kai_Success_Criteria__c` | From "Success:" line |
| Due date | `ActivityDate` | From "Due:" line |
| - | `Status` | "Not Started" or "Deferred" |
| - | `Priority` | "High" for missed, else "Normal" |
| - | `WhatId` | Links to Event |

### Coaching Metrics

Extracted from `analysis.coachingFeedback.suggestions.raw_json`:

| Metric | Salesforce Field | Format |
|--------|------------------|--------|
| Speaker balance | `Kai_Speaker_Balance__c` | "Operator: 86%, Customer: 14%" |
| Clinical focus | `Kai_Clinical_Focus__c` | "72%" |
| Open questions | `Kai_Open_Questions__c` | Number |
| Closed questions | `Kai_Closed_Questions__c` | Number |
| Average score | `Kai_Coaching_Score__c` | -1 to 1 scale |
| Feedback text | `Kai_Coaching_Feedback__c` | Full text |

---

## Upsert Logic

The sync service uses **upsert** based on `Kai_Conversation_Id__c`:

1. **First sync**: Creates new Event and Tasks
2. **Subsequent syncs**: Updates existing Event, creates new Tasks

**Note:** Tasks are always created fresh on each sync. If you want to prevent duplicates, you'll need to add logic to delete existing tasks first.

---

## Error Handling

Common errors and solutions:

### Custom Fields Don't Exist

**Error:** `Field Kai_Conversation_Id__c does not exist`

**Solution:** Create custom fields as per [SALESFORCE_CUSTOM_FIELDS.md](./SALESFORCE_CUSTOM_FIELDS.md)

### Authentication Failed

**Error:** `Salesforce authentication failed`

**Solution:** Check your `.env` file and ensure:
- `SALESFORCE_CLIENT_ID` is correct
- `SALESFORCE_USERNAME` matches the integration user
- Certificate matches the private key
- User is pre-authorized in Connected App

### Insufficient Privileges

**Error:** `Insufficient privileges to create Event`

**Solution:** Ensure the integration user has:
- Create/Edit permissions on Event
- Create/Edit permissions on Task
- Field-level security on custom fields

---

## Testing Workflow

### 1. Test with Preview

```bash
# Preview what would be created
curl http://localhost:3000/api/sync/preview/45211 | jq
```

Review the output to ensure data looks correct.

### 2. Sync to Salesforce

```bash
# Sync the conversation
curl -X POST http://localhost:3000/api/sync/conversation/45211
```

### 3. Verify in Salesforce

1. Navigate to Events tab
2. Find the event with Subject matching the conversation title
3. Check that all custom fields are populated
4. Open Related Tasks to see parsed actions

### 4. Check Logs

```bash
# View application logs
npm run dev

# Or with Docker
docker-compose logs -f gateway
```

---

## Integration with Kai API

To integrate with live Kai API data (not local files):

### Option 1: Webhook Endpoint

Create a webhook endpoint that receives Kai conversation updates:

```typescript
fastify.post('/api/webhook/kai', async (request, reply) => {
  const data = request.body as KaiConversationData;
  const result = await kaiSyncService.syncConversation(data);
  return result;
});
```

Configure Kai to POST to: `https://your-gateway.com/api/webhook/kai`

### Option 2: Scheduled Sync

Create a scheduled job to pull conversations from Kai API:

```typescript
// Fetch recent conversations from Kai API
const conversations = await kaiApi.get('/conversations?since=2025-01-01');

// Sync each conversation
for (const conv of conversations) {
  await kaiSyncService.syncConversation(conv);
}
```

### Option 3: Manual Trigger

Create an endpoint to sync specific conversation from Kai API:

```typescript
fastify.post('/api/sync/kai/:id', async (request, reply) => {
  const { id } = request.params;

  // Fetch from Kai API
  const conversation = await kaiApi.get(`/conversations/${id}`);
  const analysis = await kaiApi.get(`/conversations/${id}/analysis`);

  // Sync to Salesforce
  const result = await kaiSyncService.syncConversation({
    conversation,
    analysis
  });

  return result;
});
```

---

## Monitoring and Logging

All sync operations are logged with these log levels:

- **INFO**: Successful syncs, summary statistics
- **DEBUG**: Detailed transformation steps, field mappings
- **ERROR**: Sync failures, API errors

Example log output:

```json
{
  "level": "info",
  "time": "2025-11-26T10:30:00.000Z",
  "msg": "Creating new Event",
  "conversationId": 45211
}

{
  "level": "debug",
  "time": "2025-11-26T10:30:01.000Z",
  "msg": "Transformed actions to Salesforce Tasks",
  "conversationId": 45211,
  "taskCount": 6
}

{
  "level": "info",
  "time": "2025-11-26T10:30:05.000Z",
  "msg": "Batch sync completed",
  "total": 1,
  "successful": 1,
  "failed": 0
}
```

---

## Best Practices

1. **Always preview first**: Use `/sync/preview/:id` before syncing
2. **Check custom fields**: Ensure all fields exist in Salesforce
3. **Monitor logs**: Watch for errors during sync
4. **Handle failures**: Implement retry logic for transient errors
5. **Rate limits**: Be mindful of Salesforce API limits (5000/day for most orgs)
6. **Batch operations**: Use `/sync/all` for bulk operations rather than individual calls
7. **Data validation**: Validate data before syncing to avoid partial failures

---

## Next Steps

1. Create custom fields in Salesforce ([SALESFORCE_CUSTOM_FIELDS.md](./SALESFORCE_CUSTOM_FIELDS.md))
2. Test preview endpoint with sample data
3. Sync a test conversation
4. Verify data in Salesforce
5. Set up automation (webhooks or scheduled jobs)
6. Create Salesforce reports/dashboards
7. Train users on new Event and Task fields
