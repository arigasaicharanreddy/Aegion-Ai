from typing import TypedDict, List, Dict, Any, Optional


class AegionGraphState(TypedDict):
    project_id: str
    user_id: str
    user_prompt: str
    selected_category: str
    selected_language: str
    selected_theme_id: str
    project_memory: Dict[str, Any]
    retrieved_prompt_packs: List[str]
    intent: Optional[str]
    requirements: Dict[str, Any]
    architecture_spec: Dict[str, Any]
    database_schema: List[Dict[str, Any]]
    generated_files: List[Dict[str, str]]
    security_findings: List[str]
    test_suite: List[Dict[str, str]]
    final_response: str
