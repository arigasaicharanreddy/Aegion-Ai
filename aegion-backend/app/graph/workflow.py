from langgraph.graph import StateGraph, END
from app.graph.state import AegionGraphState
from app.agents.intent_agent import run_intent_agent
from app.agents.requirement_agent import run_requirement_agent
from app.agents.architect_agent import run_architect_agent
from app.agents.code_agent import run_code_agent
from app.agents.security_agent import run_security_agent
from app.agents.testing_agent import run_testing_agent


def build_aegion_workflow():
    graph = StateGraph(AegionGraphState)

    graph.add_node("intent", run_intent_agent)
    graph.add_node("requirement", run_requirement_agent)
    graph.add_node("architect", run_architect_agent)
    graph.add_node("codegen", run_code_agent)
    graph.add_node("security", run_security_agent)
    graph.add_node("testing", run_testing_agent)

    graph.set_entry_point("intent")
    graph.add_edge("intent", "requirement")
    graph.add_edge("requirement", "architect")
    graph.add_edge("architect", "codegen")
    graph.add_edge("codegen", "security")
    graph.add_edge("security", "testing")
    graph.add_edge("testing", END)

    return graph.compile()
