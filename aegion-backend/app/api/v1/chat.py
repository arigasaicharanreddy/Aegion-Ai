from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json
from app.graph.workflow import build_aegion_workflow

router = APIRouter()
workflow = build_aegion_workflow()


class ChatStreamRequest(BaseModel):
    project_id: str
    user_id: str
    message: str
    category: str = "HRMS"
    language: str = "Python"
    theme_id: str = "hrms-nebula-hr"
    project_memory: dict = {}


@router.post("/stream")
async def stream_agent_chat(payload: ChatStreamRequest):
    async def event_generator():
        initial_state = {
            "project_id": payload.project_id,
            "user_id": payload.user_id,
            "user_prompt": payload.message,
            "selected_category": payload.category,
            "selected_language": payload.language,
            "selected_theme_id": payload.theme_id,
            "project_memory": payload.project_memory,
            "retrieved_prompt_packs": [],
            "intent": None,
            "requirements": {},
            "architecture_spec": {},
            "database_schema": [],
            "generated_files": [],
            "security_findings": [],
            "test_suite": [],
            "final_response": "",
        }
        result = await workflow.ainvoke(initial_state)
        yield f"data: {json.dumps({'type': 'done', 'result': result})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
