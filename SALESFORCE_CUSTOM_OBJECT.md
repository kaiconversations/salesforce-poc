# KAI Conversation Custom Object Setup

Create a custom object to store conversation data with full coaching feedback and summaries. Events and Tasks will link TO this object via their `WhatId` field.

> **Important:** We can't create lookups FROM a custom object TO Event/Activity (Salesforce limitation). Instead, Event/Task will use their built-in `WhatId` field to link to this custom object.

---

## Step 1: Create Custom Object

**Navigate:** Setup → Object Manager → Create → Custom Object

| Field | Value |
|-------|-------|
| **Label** | `KAI Conversation` |
| **Plural Label** | `KAI Conversations` |
| **Object Name** | `KAI_Conversation` |
| **Record Name** | `Conversation Title` |
| **Data Type** | Text |
| **Allow Reports** | ☑ |
| **Allow Activities** | ☑ |
| **Allow Search** | ☑ |
| **Track Field History** | ☑ |
| **Deployment Status** | Deployed |

Click **Save**

---

## Step 2: Create Custom Fields

**Navigate:** Object Manager → KAI Conversation → Fields & Relationships → New

### 2.1 KAI Conversation ID (External ID)

| Field | Value |
|-------|-------|
| **Data Type** | Number |
| **Field Label** | `KAI Conversation ID` |
| **Length** | 18, 0 |
| **External ID** | ☑ |
| **Unique** | ☑ |
| **Description** | Unique identifier from KAI. Enables upsert operations. |

Click **Next** → Set security → **Save**

### 2.2 Title

| Field | Value |
|-------|-------|
| **Data Type** | Text |
| **Field Label** | `Title` |
| **Length** | 255 |
| **Description** | Conversation title from KAI |

Click **Next** → Set security → **Save**

### 2.3 Conversation Date

| Field | Value |
|-------|-------|
| **Data Type** | Date/Time |
| **Field Label** | `Conversation Date` |
| **Description** | Date and time the conversation occurred |

Click **Next** → Set security → **Save**

### 2.4 Full Summary

| Field | Value |
|-------|-------|
| **Data Type** | Long Text Area |
| **Field Label** | `Full Summary` |
| **Length** | `131072` (maximum - 131KB) |
| **Visible Lines** | `15` |
| **Description** | Complete conversation summary including commercial summary, HCP insights, rep actions, HCP commitments, and missed action points |

Click **Next** → Set security → **Save**

### 2.5 Full Coaching Feedback

| Field | Value |
|-------|-------|
| **Data Type** | Long Text Area |
| **Field Label** | `Full Coaching Feedback` |
| **Length** | `32768` (32KB) |
| **Visible Lines** | `10` |
| **Description** | Complete coaching feedback text from KAI analysis |

Click **Next** → Set security → **Save**

### 2.6 Conversation DNA Metrics

| Field | Value |
|-------|-------|
| **Data Type** | Long Text Area |
| **Field Label** | `Conversation DNA Metrics` |
| **Length** | `32768` (32KB) |
| **Visible Lines** | `8` |
| **Description** | Conversation DNA breakdown (Opening, Personal, Needs, Clinical, etc.) |

Click **Next** → Set security → **Save**

### 2.7 Project

| Field | Value |
|-------|-------|
| **Data Type** | Text |
| **Field Label** | `Project Name` |
| **Length** | 255 |
| **Description** | Project name from KAI |

Click **Next** → Set security → **Save**

### 2.8 Owner Name

| Field | Value |
|-------|-------|
| **Data Type** | Text |
| **Field Label** | `Owner Name` |
| **Length** | 255 |
| **Description** | Owner display name from KAI |

Click **Next** → Set security → **Save**

### 2.9 Team

| Field | Value |
|-------|-------|
| **Data Type** | Text |
| **Field Label** | `Team Name` |
| **Length** | 255 |
| **Description** | Team display name from KAI |

Click **Next** → Set security → **Save**

---

## Step 3: Configure Page Layout

**Navigate:** Object Manager → KAI Conversation → Page Layouts → KAI Conversation Layout → Edit

**Section: Information**
- KAI Conversation ID
- Title
- Conversation Date
- Project
- Owner Name
- Team

**Section: Summary & Coaching**
- Full Summary
- Full Coaching Feedback
- Conversation DNA Metrics

**Section: Related Information** (automatically added by Salesforce)
- Activity History (will show Events)
- Open Activities (will show Tasks)

**Save**

---

## Step 4: Set Permissions

**Navigate:** Setup → Permission Sets → Kai Integration Permissions → Object Settings

1. Find **KAI Conversation**
2. Click **Edit**
3. **Object Permissions:**
   - ☑ Read
   - ☑ Create
   - ☑ Edit
4. **Field Permissions:**
   - Grant Read/Edit access to all custom fields
5. **Save**

---

## Step 5: Verify Event/Task Can Link (WhatId)

No setup needed! Events and Tasks have a built-in `WhatId` field that can link to custom objects.

**To verify:**
1. Create a test KAI Conversation record manually
2. Create an Event
3. Set `Related To` field = your test KAI Conversation
4. Save
5. Go back to KAI Conversation → check **Activity History** section → should show the Event

---

## How the Relationship Works

### Architecture:

```
┌────────────────────────────────────────┐
│ KAI_Conversation__c (Custom Object)    │ ← PARENT (source of truth)
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│ • Name: "Conversation-0001"            │
│ • Title__c: "Conf/Sent Test 2.1"      │
│ • Full_Summary__c: [131KB full text]   │
│ • Full_Coaching_Feedback__c: [32KB]    │
│ • Conversation_DNA_Metrics__c: [32KB]  │
│                                        │
│ Related Lists (auto):                  │
│ ├─ Activity History ──────────────┐   │
│ └─ Open Activities ───────────────┼─┐ │
└───────────────────────────────────┼─┼─┘
                                    │ │
                          WhatId    │ │ WhatId
                          points    │ │ points
                          up        ▼ ▼
         ┌──────────────────┐    ┌──────────────────┐
         │ Event            │    │ Task             │
         │ ━━━━━━━━━━━━━━━│    │ ━━━━━━━━━━━━━━━│
         │ • Subject        │    │ • Subject        │
         │ • StartDateTime  │    │ • Status         │
         │ • WhatId ────────┼────┤ • WhatId ────────┤
         │   (= conversation│    │   (= conversation│
         │    record ID)    │    │    record ID)    │
         └──────────────────┘    └──────────────────┘
```

### Key Points:

- **WhatId** is a built-in Salesforce field on Event and Task
- It can point to any custom object (and some standard objects)
- When set, the Event/Task appears in the object's **Activity History** or **Open Activities**
- This is a **standard Salesforce pattern** - no custom lookup needed

---

## Step 6: Test

### Manual Test

1. Go to **KAI Conversations** tab (or App Launcher → KAI Conversations)
2. Click **New**
3. Fill in fields and Save
4. Note the record ID
5. Go to **Events** tab
6. Create a new Event
7. Set **Related To** = the KAI Conversation you just created
8. Save
9. Go back to the KAI Conversation record
10. See the Event in **Activity History**

### API Test

```bash
curl -X POST http://localhost:3000/api/sync/conversation/45211
```

Should create:
- 1 KAI Conversation record
- 1 Event (WhatId points to Conversation)
- 6 Tasks (WhatId points to Conversation)

**Verify in Salesforce:**
1. Find the KAI Conversation record
2. Scroll to **Activity History** → see Event
3. Scroll to **Open Activities** → see Tasks
4. Click Event → see **Related To** field shows the Conversation

---

## What You Created

**Custom Object:** `KAI_Conversation__c`

**Fields:**
- `KAI_Conversation_Id__c` (Number, External ID, Unique)
- `Title__c` (Text 255)
- `Conversation_Date__c` (Date/Time)
- `Full_Summary__c` (Long Text 131KB)
- `Full_Coaching_Feedback__c` (Long Text 32KB)
- `Conversation_DNA_Metrics__c` (Long Text 32KB)
- `Project__c` (Text 255)
- `Owner_Name__c` (Text 255)
- `Team__c` (Text 255)

**Relationships:**
- Event.WhatId → KAI_Conversation__c (many-to-one)
- Task.WhatId → KAI_Conversation__c (many-to-one)

**Benefits:**
- ✅ Proper Salesforce relationships via WhatId
- ✅ Related lists automatically work
- ✅ No Activity object limitations
- ✅ KAI Conversation is the "source of truth"
- ✅ Full text storage (no 255 char limits)
- ✅ Standard Salesforce pattern

---

## User Experience

**Viewing a Conversation:**
1. Open KAI Conversations tab
2. Click a conversation
3. See full summary + coaching feedback
4. Scroll down to **Activity History** → click Event to view meeting details
5. Scroll down to **Open Activities** → see action tasks

**Viewing an Event:**
1. Open Events tab
2. Click an event
3. See **Related To** field at top
4. Click it → opens the KAI Conversation with full details

---

## Done!

You now have:
- ✅ KAI Conversation object (parent/source of truth)
- ✅ Events link via WhatId (child)
- ✅ Tasks link via WhatId (child)
- ✅ Full text storage with Long Text Areas
- ✅ Native Salesforce relationships
- ✅ No custom lookups needed (uses standard WhatId)

Test the sync endpoint to verify everything works!
