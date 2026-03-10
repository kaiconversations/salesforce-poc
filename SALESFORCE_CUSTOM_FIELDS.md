# Event & Task Custom Fields Setup

## Event Custom Fields

**Navigate:** Setup → Object Manager → **Activity** → Fields & Relationships → New

> Fields created on Activity are automatically available to both Event and Task.

### Create These 15 Fields:

| Field Label | API Name | Data Type | Length | Ext ID | Unique | Description |
|------------|----------|-----------|--------|--------|--------|-------------|
| **KAI Conversation ID** | `KAI_Conversation_Id__c` | Number | 18, 0 | ✅ | ❌ | Conversation identifier from KAI. NOT unique - multiple Events/Tasks can reference the same conversation. External ID only (no Unique constraint). |
| KAI Project | `KAI_Project__c` | Text | 255 | ❌ | ❌ | Project name from KAI |
| KAI Owner | `KAI_Owner__c` | Text | 255 | ❌ | ❌ | Owner display name from KAI |
| KAI Team | `KAI_Team__c` | Text | 255 | ❌ | ❌ | Team display name from KAI |
| KAI First Party Label | `KAI_First_Party_Label__c` | Text | 100 | ❌ | ❌ | First party label (e.g., "KAM", "Rep") |
| KAI Second Party Label | `KAI_Second_Party_Label__c` | Text | 100 | ❌ | ❌ | Second party label (e.g., "HCP", "Customer") |
| KAI Type | `KAI_Type__c` | Text | 50 | ❌ | ❌ | Conversation type (e.g., "sales", "training") |
| KAI Language | `KAI_Language__c` | Text | 10 | ❌ | ❌ | Language code (e.g., "en-gb", "en-us") |
| KAI Status | `KAI_Status__c` | Text | 50 | ❌ | ❌ | Conversation status (e.g., "published", "draft") |
| KAI Speaker Balance | `KAI_Speaker_Balance__c` | Text | 255 | ❌ | ❌ | Speaker participation ratio (e.g., "Operator: 86%, Customer: 14%") |
| KAI Clinical Focus | `KAI_Clinical_Focus__c` | Text | 50 | ❌ | ❌ | Percentage of conversation on clinical topics (e.g., "72%") |
| KAI Open Questions | `KAI_Open_Questions__c` | Number | 5, 0 | ❌ | ❌ | Count of open questions asked during conversation |
| KAI Closed Questions | `KAI_Closed_Questions__c` | Number | 5, 0 | ❌ | ❌ | Count of closed questions asked during conversation |
| KAI Coaching Score | `KAI_Coaching_Score__c` | Number | 5, 2 | ❌ | ❌ | Overall coaching score from -1.00 to 1.00 |
| KAI Coaching Feedback | `KAI_Coaching_Feedback__c` | Text Area | 255 | ❌ | ❌ | Coaching feedback summary (truncated). Full feedback in KAI Coaching Detail object. |

> **Important Notes:**
> - `KAI_Conversation_Id__c` is automatically available on both Event and Task. Don't create it twice.
> - **Do NOT mark this field as Unique** - multiple Events and Tasks can reference the same conversation. Only use External ID.
> - The Unique constraint should only exist on the `KAI_Conversation_Id__c` field in the **KAI_Conversation__c** custom object (for upsert operations).

### Field-Level Security

For each field:
1. Click field name → Set Field-Level Security
2. Grant **Visible + Edit** to integration user permission set
3. Grant **Visible** (read-only) to end user profiles
4. Save

### Page Layout (Event)

**Setup → Object Manager → Event → Page Layouts → Event Layout → Edit**

1. Drag a new **Section** onto layout
2. Name it: `KAI Meeting Details`
3. Drag all KAI fields into this section
4. Save

---

## Task Custom Fields

**Navigate:** Setup → Object Manager → **Task** → Fields & Relationships → New

### Create These 3 Fields:

> `KAI_Conversation_Id__c` already exists - it was created on Activity above. Only create these 3:

| Field Label | API Name | Data Type | Length | Picklist Values | Description |
|------------|----------|-----------|--------|-----------------|-------------|
| **KAI Action Type** | `KAI_Action_Type__c` | **Picklist** | - | Rep Action<br>HCP Commitment<br>Missed Action | Type of action item |
| KAI Success Criteria | `KAI_Success_Criteria__c` | Text Area | 255 | - | Success criteria for this action (e.g., "HCP confirms receipt") |
| KAI Action Number | `KAI_Action_Number__c` | Number | 3, 0 | - | Sequential action number (1, 2, 3, etc.) |

### Field-Level Security

Same as Event fields - grant permissions to integration user.

### Page Layout (Task)

**Setup → Object Manager → Task → Page Layouts → Task Layout → Edit**

1. Add a section `KAI Action Details`
2. Drag these fields in:
   - KAI Conversation ID (from Activity)
   - KAI Action Type
   - KAI Success Criteria
   - KAI Action Number
3. Save

---

## Next Step

➡️ **Create Custom Object:** See [CUSTOM_OBJECT_SETUP.md](./CUSTOM_OBJECT_SETUP.md) for full coaching data storage.

---

## Summary

**Fields Created:**
- Activity: 15 fields (available to Event and Task)
- Task-specific: 3 additional fields
- Custom Object: 5 fields (next step)

**Total unique fields:** 18 on Activity/Event/Task + 5 on Custom Object = 23 fields
