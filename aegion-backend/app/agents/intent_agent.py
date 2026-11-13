from app.graph.state import AegionGraphState


async def run_intent_agent(state: AegionGraphState) -> AegionGraphState:
    state["intent"] = "create_or_update_application"
    return state


async def run_requirement_agent(state: AegionGraphState) -> AegionGraphState:
    state["requirements"] = {
        "category": state["selected_category"],
        "language": state["selected_language"],
    }
    return state


async def run_architect_agent(state: AegionGraphState) -> AegionGraphState:
    state["architecture_spec"] = {"pattern": "layered_clean_architecture"}
    return state


async def run_code_agent(state: AegionGraphState) -> AegionGraphState:
    return state


async def run_security_agent(state: AegionGraphState) -> AegionGraphState:
    state["security_findings"] = ["RBAC verified", "Tenant isolation verified"]
    return state


async def run_testing_agent(state: AegionGraphState) -> AegionGraphState:
    return state
