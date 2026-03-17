from fastapi import APIRouter, Depends, HTTPException
import uuid
import json
import logging

from database import db
from auth import get_current_user
from config import EMERGENT_LLM_KEY
from models import AISuggestRequest, AIScoreRequest

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai")


@router.post("/suggest-reply")
async def suggest_reply(data: AISuggestRequest, user=Depends(get_current_user)):
    messages = await db.messages.find(
        {'conversation_id': data.conversation_id}, {'_id': 0}
    ).sort('timestamp', -1).limit(10).to_list(10)
    messages.reverse()
    conv = await db.conversations.find_one({'id': data.conversation_id}, {'_id': 0})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    message_history = "\n".join([
        f"{'You' if m['sender'] == 'user' else conv.get('lead_name', 'Lead')}: {m['content']}"
        for m in messages
    ])

    if not EMERGENT_LLM_KEY:
        return {'suggestions': [
            {"tone": "casual", "message": "Hey! That sounds awesome. I'd love to explore this further with you - when works best for a quick chat?", "explanation": "Warm and approachable, shows genuine interest"},
            {"tone": "professional", "message": "Thank you for your interest. I'd be happy to walk you through our offering and discuss how it aligns with your goals.", "explanation": "Builds credibility and shows expertise"},
            {"tone": "direct", "message": "Great question! Here's exactly what we can do for you - let me share a quick breakdown of the value we deliver.", "explanation": "Gets straight to the point with clear value proposition"}
        ]}

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"suggest-{uuid.uuid4()}",
            system_message="""You are a sales conversation assistant for social media DMs. 
Generate exactly 3 reply suggestions. Each with a different tone: casual, professional, and direct.
Return ONLY valid JSON array: [{"tone":"casual","message":"...","explanation":"..."},{"tone":"professional","message":"...","explanation":"..."},{"tone":"direct","message":"...","explanation":"..."}]"""
        )
        chat.with_model("openai", "gpt-5.2")
        prompt = f"Conversation with {conv.get('lead_name', 'prospect')} on {conv.get('platform', 'social media')}:\n\n{message_history}\n\n{f'Context: {data.context}' if data.context else ''}Generate 3 reply suggestions."
        response = await chat.send_message(UserMessage(text=prompt))
        response_text = str(response)
        start = response_text.find('[')
        end = response_text.rfind(']') + 1
        if start != -1 and end > start:
            suggestions = json.loads(response_text[start:end])
        else:
            suggestions = json.loads(response_text)
        return {'suggestions': suggestions}
    except Exception as e:
        logger.error(f"AI suggestion error: {e}")
        return {'suggestions': [
            {"tone": "casual", "message": "Hey! That sounds awesome. Let's definitely explore this further!", "explanation": "Warm and approachable"},
            {"tone": "professional", "message": "Thank you for sharing. I'd love to discuss how we can help achieve your goals.", "explanation": "Professional and confidence-building"},
            {"tone": "direct", "message": "Great question! Here's what I can offer you specifically...", "explanation": "Direct value proposition"}
        ]}


@router.post("/score-lead")
async def score_lead(data: AIScoreRequest, user=Depends(get_current_user)):
    lead = await db.leads.find_one({'id': data.lead_id, 'user_id': user['id']}, {'_id': 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if not EMERGENT_LLM_KEY:
        score = min(100, int(lead.get('engagement_rate', 0) * 20 + min(lead.get('followers', 0) / 1000, 50)))
        await db.leads.update_one({'id': data.lead_id}, {'$set': {'score': score}})
        return {'score': score, 'reasoning': 'Scored based on engagement rate and follower count', 'category': 'hot' if score >= 70 else 'warm' if score >= 40 else 'cold'}
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY, session_id=f"score-{uuid.uuid4()}",
            system_message='You are a lead scoring expert. Return ONLY JSON: {"score": <1-100>, "reasoning": "<brief>", "category": "<hot|warm|cold>"}'
        )
        chat.with_model("openai", "gpt-5.2")
        prompt = f"Score lead: {lead['name']} (@{lead['handle']}) on {lead['platform']}, {lead.get('followers',0)} followers, {lead.get('engagement_rate',0)}% engagement, bio: {lead.get('bio','N/A')}"
        response = await chat.send_message(UserMessage(text=prompt))
        response_text = str(response)
        start = response_text.find('{')
        end = response_text.rfind('}') + 1
        result = json.loads(response_text[start:end]) if start != -1 else json.loads(response_text)
        score = min(100, max(1, int(result.get('score', 50))))
        await db.leads.update_one({'id': data.lead_id}, {'$set': {'score': score}})
        return result
    except Exception as e:
        logger.error(f"AI scoring error: {e}")
        score = min(100, int(lead.get('engagement_rate', 0) * 20 + min(lead.get('followers', 0) / 1000, 50)))
        await db.leads.update_one({'id': data.lead_id}, {'$set': {'score': score}})
        return {'score': score, 'reasoning': 'Scored based on engagement and followers', 'category': 'warm' if score > 50 else 'cold'}
