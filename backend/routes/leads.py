from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from typing import Optional
from datetime import datetime, timezone
import uuid
import csv
import io

from database import db
from auth import get_current_user
from models import LeadCreate, LeadUpdate, BulkUpdateLeads, BulkDeleteLeads

router = APIRouter(prefix="/leads")


@router.get("")
async def get_leads(
    user=Depends(get_current_user),
    status: Optional[str] = None, platform: Optional[str] = None,
    min_score: Optional[int] = None, max_score: Optional[int] = None,
    search: Optional[str] = None, tag: Optional[str] = None,
    sort_by: Optional[str] = "created_at", sort_order: Optional[str] = "desc",
    limit: int = 50, offset: int = 0
):
    query = {'user_id': user['id']}
    if status:
        query['status'] = status
    if platform:
        query['platform'] = platform
    if min_score is not None or max_score is not None:
        score_q = {}
        if min_score is not None:
            score_q['$gte'] = min_score
        if max_score is not None:
            score_q['$lte'] = max_score
        query['score'] = score_q
    if tag:
        query['tags'] = {'$in': [tag]}
    if search:
        query['$or'] = [
            {'name': {'$regex': search, '$options': 'i'}},
            {'handle': {'$regex': search, '$options': 'i'}}
        ]
    sort_dir = -1 if sort_order == 'desc' else 1
    leads = await db.leads.find(query, {'_id': 0}).sort(sort_by, sort_dir).skip(offset).limit(limit).to_list(limit)
    total = await db.leads.count_documents(query)
    return {'leads': leads, 'total': total}


@router.post("")
async def create_lead(data: LeadCreate, user=Depends(get_current_user)):
    lead_id = str(uuid.uuid4())
    score = min(100, int(data.engagement_rate * 20 + min(data.followers / 1000, 50)))
    lead_doc = {
        'id': lead_id, 'user_id': user['id'], 'name': data.name, 'handle': data.handle,
        'platform': data.platform, 'avatar': f"https://api.dicebear.com/7.x/avataaars/svg?seed={data.handle}",
        'bio': data.bio or '', 'followers': data.followers, 'engagement_rate': data.engagement_rate,
        'score': score, 'status': 'new', 'tags': data.tags, 'notes': data.notes or '',
        'last_contacted': None, 'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.leads.insert_one(lead_doc)
    lead_doc.pop('_id', None)
    return lead_doc


@router.get("/{lead_id}")
async def get_lead(lead_id: str, user=Depends(get_current_user)):
    lead = await db.leads.find_one({'id': lead_id, 'user_id': user['id']}, {'_id': 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.put("/{lead_id}")
async def update_lead(lead_id: str, data: LeadUpdate, user=Depends(get_current_user)):
    update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.leads.update_one({'id': lead_id, 'user_id': user['id']}, {'$set': update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    lead = await db.leads.find_one({'id': lead_id}, {'_id': 0})
    return lead


@router.delete("/{lead_id}")
async def delete_lead(lead_id: str, user=Depends(get_current_user)):
    result = await db.leads.delete_one({'id': lead_id, 'user_id': user['id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {'message': 'Lead deleted'}


@router.post("/bulk-import")
async def bulk_import_leads(file: UploadFile = File(...), user=Depends(get_current_user)):
    """Import leads from CSV file"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    try:
        contents = await file.read()
        decoded = contents.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(decoded))
        
        imported = 0
        skipped = 0
        errors = []
        
        for row_num, row in enumerate(csv_reader, start=2):
            try:
                # Required fields
                if not row.get('name') or not row.get('handle'):
                    skipped += 1
                    errors.append(f"Row {row_num}: Missing required fields (name, handle)")
                    continue
                
                # Check for duplicates
                existing = await db.leads.find_one({
                    'user_id': user['id'],
                    'handle': row['handle'],
                    'platform': row.get('platform', 'instagram')
                })
                
                if existing:
                    skipped += 1
                    errors.append(f"Row {row_num}: Lead @{row['handle']} already exists")
                    continue
                
                # Parse and validate data
                followers = int(row.get('followers', 0))
                engagement_rate = float(row.get('engagement_rate', 0.0))
                score = min(100, int(engagement_rate * 20 + min(followers / 1000, 50)))
                
                tags = []
                if row.get('tags'):
                    tags = [tag.strip() for tag in row.get('tags', '').split(',')]
                
                lead_doc = {
                    'id': str(uuid.uuid4()),
                    'user_id': user['id'],
                    'name': row['name'],
                    'handle': row['handle'],
                    'platform': row.get('platform', 'instagram'),
                    'avatar': f"https://api.dicebear.com/7.x/avataaars/svg?seed={row['handle']}",
                    'bio': row.get('bio', ''),
                    'followers': followers,
                    'engagement_rate': engagement_rate,
                    'score': score,
                    'status': row.get('status', 'new'),
                    'tags': tags,
                    'notes': row.get('notes', ''),
                    'last_contacted': None,
                    'created_at': datetime.now(timezone.utc).isoformat()
                }
                
                await db.leads.insert_one(lead_doc)
                imported += 1
                
            except ValueError as e:
                skipped += 1
                errors.append(f"Row {row_num}: Invalid data format - {str(e)}")
            except Exception as e:
                skipped += 1
                errors.append(f"Row {row_num}: {str(e)}")
        
        return {
            'success': True,
            'imported': imported,
            'skipped': skipped,
            'errors': errors[:10]  # Return first 10 errors
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process CSV: {str(e)}")


@router.post("/bulk-export")
async def bulk_export_leads(user=Depends(get_current_user)):
    """Export all leads to CSV"""
    leads = await db.leads.find({'user_id': user['id']}, {'_id': 0}).to_list(None)
    
    if not leads:
        raise HTTPException(status_code=404, detail="No leads to export")
    
    # Create CSV in memory
    output = io.StringIO()
    fieldnames = ['name', 'handle', 'platform', 'bio', 'followers', 'engagement_rate', 
                  'score', 'status', 'tags', 'notes', 'created_at']
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    
    for lead in leads:
        row = {
            'name': lead.get('name', ''),
            'handle': lead.get('handle', ''),
            'platform': lead.get('platform', ''),
            'bio': lead.get('bio', ''),
            'followers': lead.get('followers', 0),
            'engagement_rate': lead.get('engagement_rate', 0.0),
            'score': lead.get('score', 0),
            'status': lead.get('status', ''),
            'tags': ','.join(lead.get('tags', [])),
            'notes': lead.get('notes', ''),
            'created_at': lead.get('created_at', '')
        }
        writer.writerow(row)
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=leads_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        }
    )


@router.post("/bulk-update")
async def bulk_update_leads(data: BulkUpdateLeads, user=Depends(get_current_user)):
    """Update multiple leads at once"""
    if not data.lead_ids:
        raise HTTPException(status_code=400, detail="No lead IDs provided")
    
    if not data.updates:
        raise HTTPException(status_code=400, detail="No updates provided")
    
    # Validate that all leads belong to user
    count = await db.leads.count_documents({
        'id': {'$in': data.lead_ids},
        'user_id': user['id']
    })
    
    if count != len(data.lead_ids):
        raise HTTPException(status_code=403, detail="Some leads not found or unauthorized")
    
    # Perform bulk update
    result = await db.leads.update_many(
        {'id': {'$in': data.lead_ids}, 'user_id': user['id']},
        {'$set': data.updates}
    )
    
    return {
        'success': True,
        'updated': result.modified_count,
        'message': f"Updated {result.modified_count} leads"
    }


@router.post("/bulk-delete")
async def bulk_delete_leads(data: BulkDeleteLeads, user=Depends(get_current_user)):
    """Delete multiple leads at once"""
    if not data.lead_ids:
        raise HTTPException(status_code=400, detail="No lead IDs provided")
    
    # Delete leads
    result = await db.leads.delete_many({
        'id': {'$in': data.lead_ids},
        'user_id': user['id']
    })
    
    return {
        'success': True,
        'deleted': result.deleted_count,
        'message': f"Deleted {result.deleted_count} leads"
    }

