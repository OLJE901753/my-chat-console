from ai_manager.models import PlanRequest, TaskIntent, ProposeChangeRequest, CodeChange

def test_plan_request_schema():
    req = PlanRequest(intents=[TaskIntent(description="scan leaves", priority="high")])
    assert req.intents[0].description == "scan leaves"


def test_propose_change_requires_boolean_default():
    req = ProposeChangeRequest(
        title="chore",
        justification="cleanup",
        changes=[CodeChange(path="a.py", diff="print('hi')")],
    )
    assert req.approval is False
