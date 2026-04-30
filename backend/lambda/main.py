import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Attr
from fastapi import FastAPI, HTTPException
from mangum import Mangum
from pydantic import BaseModel, EmailStr
from typing import Any, Literal, Optional

EMPLOYEES_TABLE = os.environ.get("EMPLOYEES_TABLE", "employees")
QUESTIONS_TABLE = os.environ.get("QUESTIONS_TABLE", "questions")
ROLES_TABLE = os.environ.get("ROLES_TABLE", "roles")
SESSIONS_TABLE = os.environ.get("SESSIONS_TABLE", "sessions")

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(EMPLOYEES_TABLE)
questions_table = dynamodb.Table(QUESTIONS_TABLE)
roles_table = dynamodb.Table(ROLES_TABLE)
sessions_table = dynamodb.Table(SESSIONS_TABLE)

ROLES_CONFIG_KEY = "roles"
INITIAL_ROLES_CONFIG = {
    "config_id": ROLES_CONFIG_KEY,
    "internal_roles": [
        "Admin",
        "Receptionist",
        "Doctor",
        "Lab Technician",
        "Practice Manager",
        "Groomer",
    ],
    "external_roles": [
        "client",
        "client_pet1",
        "client_pet2",
    ],
}

Role = Literal["Admin", "Receptionist", "Doctor", "Lab Technician", "Practice Manager", "Groomer"]


def _clean(obj: Any) -> Any:
    """Recursively convert DynamoDB Decimals to int/float for JSON serialisation."""
    if isinstance(obj, list):
        return [_clean(i) for i in obj]
    if isinstance(obj, dict):
        return {k: _clean(v) for k, v in obj.items()}
    if isinstance(obj, Decimal):
        n = int(obj)
        return n if Decimal(n) == obj else float(obj)
    return obj


def _seed_roles():
    try:
        response = roles_table.get_item(Key={"config_id": ROLES_CONFIG_KEY})
        if "Item" not in response:
            roles_table.put_item(Item=INITIAL_ROLES_CONFIG)
    except Exception:
        pass


@asynccontextmanager
async def lifespan(_: FastAPI):
    _seed_roles()
    yield


app = FastAPI(title="Dr. Paws Training API", lifespan=lifespan)


# ── Pydantic models ────────────────────────────────────────────────────────────

class RegistrationRequest(BaseModel):
    email: EmailStr
    petName: str
    role: Role


class ActorPayload(BaseModel):
    id: str
    name: str
    type: str


class SceneEventPayload(BaseModel):
    id: int
    actor: str
    action: str
    lines: str
    requires_response: bool


class QuestionPayload(BaseModel):
    roles: list[str]
    actors: list[ActorPayload]
    scene: list[SceneEventPayload]


class StartSessionPayload(BaseModel):
    question_id: str
    actor_id: str
    employee_email: str


class RespondPayload(BaseModel):
    event_id: int
    action: str
    lines: str = ""


# ── Health ─────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}


# ── Roles ──────────────────────────────────────────────────────────────────────

@app.get("/roles")
def get_roles():
    response = roles_table.get_item(Key={"config_id": ROLES_CONFIG_KEY})
    if "Item" not in response:
        raise HTTPException(status_code=404, detail="Roles config not found")
    item = response["Item"]
    return {
        "internal_roles": item["internal_roles"],
        "external_roles": item["external_roles"],
    }


# ── Registration ───────────────────────────────────────────────────────────────

@app.post("/register")
def register(payload: RegistrationRequest):
    item = {
        "email": payload.email,
        "petName": payload.petName,
        "role": payload.role,
        "status": "inprogress",
        "questions_done": [],
    }
    try:
        table.put_item(Item=item)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save: {str(e)}")
    return {"message": "Registration successful", "data": item}


# ── Questions ──────────────────────────────────────────────────────────────────

@app.post("/questions", status_code=201)
def create_question(payload: QuestionPayload):
    question_id = str(uuid.uuid4())
    item = {
        "question_id": question_id,
        "roles": payload.roles,
        "actors": [a.model_dump() for a in payload.actors],
        "scene": [e.model_dump() for e in payload.scene],
    }
    try:
        questions_table.put_item(Item=item)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return item


@app.get("/questions")
def list_questions(role: Optional[str] = None):
    try:
        if role:
            response = questions_table.scan(FilterExpression=Attr("roles").contains(role))
        else:
            response = questions_table.scan()
        return _clean(response["Items"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/questions/{question_id}")
def get_question(question_id: str):
    response = questions_table.get_item(Key={"question_id": question_id})
    if "Item" not in response:
        raise HTTPException(status_code=404, detail="Question not found")
    return _clean(response["Item"])


# ── Sessions ───────────────────────────────────────────────────────────────────

@app.post("/sessions", status_code=201)
def start_session(payload: StartSessionPayload):
    q_res = questions_table.get_item(Key={"question_id": payload.question_id})
    if "Item" not in q_res:
        raise HTTPException(status_code=404, detail="Question not found")

    question = q_res["Item"]
    actor_ids = [a["id"] for a in question["actors"]]
    if payload.actor_id not in actor_ids:
        raise HTTPException(status_code=400, detail="Actor not found in question")

    item = {
        "session_id": str(uuid.uuid4()),
        "employee_email": payload.employee_email,
        "question_id": payload.question_id,
        "actor_id": payload.actor_id,
        "status": "active",
        "responses": [],
        "started_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        sessions_table.put_item(Item=item)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return item


@app.get("/sessions/{session_id}")
def get_session(session_id: str):
    response = sessions_table.get_item(Key={"session_id": session_id})
    if "Item" not in response:
        raise HTTPException(status_code=404, detail="Session not found")
    return _clean(response["Item"])


@app.post("/sessions/{session_id}/respond")
def respond_to_event(session_id: str, payload: RespondPayload):
    s_res = sessions_table.get_item(Key={"session_id": session_id})
    if "Item" not in s_res:
        raise HTTPException(status_code=404, detail="Session not found")
    session = s_res["Item"]

    if session["status"] != "active":
        raise HTTPException(status_code=400, detail="Session is not active")

    q_res = questions_table.get_item(Key={"question_id": session["question_id"]})
    question = _clean(q_res["Item"])

    event = next((e for e in question["scene"] if e["id"] == payload.event_id), None)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event["actor"] != session["actor_id"]:
        raise HTTPException(status_code=400, detail="This event belongs to a different actor")
    if not event.get("requires_response"):
        raise HTTPException(status_code=400, detail="This event does not require a response")
    if any(r["event_id"] == payload.event_id for r in session["responses"]):
        raise HTTPException(status_code=409, detail="Already responded to this event")

    is_correct = payload.action == event["action"]
    response_entry = {
        "event_id": payload.event_id,
        "action": payload.action,
        "lines": payload.lines,
        "is_correct": is_correct,
        "correct_action": event["action"],
    }

    updated_responses = list(session["responses"]) + [response_entry]

    # Determine if all interactive events for this actor are now answered
    interactive = [
        e for e in question["scene"]
        if e["actor"] == session["actor_id"] and e.get("requires_response")
    ]
    responded_ids = {r["event_id"] for r in updated_responses}
    all_done = all(e["id"] in responded_ids for e in interactive)

    new_status = "completed" if all_done else "active"
    score = None
    completed_at = None

    if all_done:
        correct_count = sum(1 for r in updated_responses if r["is_correct"])
        score = round(correct_count / len(interactive) * 100) if interactive else 100
        completed_at = datetime.now(timezone.utc).isoformat()

    update_expr = "SET #r = :r, #s = :s"
    expr_names = {"#r": "responses", "#s": "status"}
    expr_values = {":r": updated_responses, ":s": new_status}

    if score is not None:
        update_expr += ", score = :sc, completed_at = :ca"
        expr_values[":sc"] = score
        expr_values[":ca"] = completed_at

    try:
        sessions_table.update_item(
            Key={"session_id": session_id},
            UpdateExpression=update_expr,
            ExpressionAttributeNames=expr_names,
            ExpressionAttributeValues=expr_values,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    result: dict = {
        "event_id": payload.event_id,
        "is_correct": is_correct,
        "correct_action": event["action"],
        "correct_lines": event["lines"],
        "session_status": new_status,
    }
    if score is not None:
        result["score"] = score
    return result


handler = Mangum(app)
