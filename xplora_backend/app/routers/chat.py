from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import ChatRoom, ChatMessage, User
from app.schemas import ChatRoomCreate, ChatRoomOut, ChatMessageOut, ChatMessageEdit
from app.utils import get_current_user
from datetime import datetime, timezone
from typing import Dict, List
import uuid

router = APIRouter()

# ── Connection Manager ────────────────────────────────────

class ConnectionManager:
    def __init__(self):
        self.active_rooms: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_uuid: str):
        await websocket.accept()
        if room_uuid not in self.active_rooms:
            self.active_rooms[room_uuid] = []
        self.active_rooms[room_uuid].append(websocket)

    def disconnect(self, websocket: WebSocket, room_uuid: str):
        if room_uuid in self.active_rooms:
            if websocket in self.active_rooms[room_uuid]:
                self.active_rooms[room_uuid].remove(websocket)
            if not self.active_rooms[room_uuid]:
                del self.active_rooms[room_uuid]

    async def broadcast(self, message: dict, room_uuid: str):
        if room_uuid not in self.active_rooms:
            return
        disconnected = []
        for connection in self.active_rooms[room_uuid]:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)
        for c in disconnected:
            self.active_rooms[room_uuid].remove(c)

    async def broadcast_except(self, message: dict, room_uuid: str, exclude: WebSocket):
        if room_uuid not in self.active_rooms:
            return
        for connection in self.active_rooms[room_uuid]:
            if connection != exclude:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

manager = ConnectionManager()


# ── Helper ────────────────────────────────────────────────

def format_message(msg: ChatMessage, sender: User) -> dict:
    return {
        "type": "message",
        "id": msg.id,
        "room_id": msg.room_id,
        "sender_id": msg.sender_id,
        "sender_name": sender.name,
        "sender_role": sender.role,
        "content": "" if msg.is_deleted else msg.content,
        "is_edited": msg.is_edited,
        "is_deleted": msg.is_deleted,
        "edited_at": msg.edited_at.isoformat() if msg.edited_at else None,
        "created_at": msg.created_at.isoformat(),
    }


# ── REST Endpoints ────────────────────────────────────────

# Create a new chat room (any logged-in user)
@router.post("/rooms", response_model=ChatRoomOut)
def create_room(
    body: ChatRoomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    room = ChatRoom(
        uuid=uuid.uuid4().hex,
        topic=body.topic,
        created_by=current_user.id,
        status="open"
    )
    db.add(room)
    db.commit()
    db.refresh(room)

    return {
        "id": room.id,
        "uuid": room.uuid,
        "topic": room.topic,
        "status": room.status,
        "created_by": room.created_by,
        "created_at": room.created_at,
        "creator_name": current_user.name,
    }


# Get all open rooms (experts/admin see all, users see only their own)
@router.get("/rooms")
def get_rooms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role in ["expert", "admin"]:
        rooms = db.query(ChatRoom).order_by(ChatRoom.created_at.desc()).all()
    else:
        rooms = db.query(ChatRoom).filter(
            ChatRoom.created_by == current_user.id
        ).order_by(ChatRoom.created_at.desc()).all()

    result = []
    for room in rooms:
        creator = db.query(User).filter(User.id == room.created_by).first()
        result.append({
            "id": room.id,
            "uuid": room.uuid,
            "topic": room.topic,
            "status": room.status,
            "created_by": room.created_by,
            "created_at": room.created_at,
            "creator_name": creator.name if creator else "Unknown",
        })
    return result


# Get single room info
@router.get("/rooms/{room_uuid}")
def get_room(
    room_uuid: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    room = db.query(ChatRoom).filter(ChatRoom.uuid == room_uuid).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    creator = db.query(User).filter(User.id == room.created_by).first()
    return {
        "id": room.id,
        "uuid": room.uuid,
        "topic": room.topic,
        "status": room.status,
        "created_by": room.created_by,
        "created_at": room.created_at,
        "creator_name": creator.name if creator else "Unknown",
    }


# Get chat history for a room
@router.get("/rooms/{room_uuid}/messages")
def get_messages(
    room_uuid: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    room = db.query(ChatRoom).filter(ChatRoom.uuid == room_uuid).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # users can only see their own rooms
    if current_user.role == "user" and room.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    messages = db.query(ChatMessage).filter(
        ChatMessage.room_id == room.id
    ).order_by(ChatMessage.created_at.asc()).all()

    result = []
    for msg in messages:
        sender = db.query(User).filter(User.id == msg.sender_id).first()
        result.append(format_message(msg, sender))
    return result


# ── DELETE ROOM (hard delete) ─────────────────────────────
# User can delete their own rooms; admin can delete any room.
@router.delete("/rooms/{room_uuid}")
def delete_room(
    room_uuid: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    room = db.query(ChatRoom).filter(ChatRoom.uuid == room_uuid).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # Permission check: owner or admin
    if current_user.role != "admin" and room.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed to delete this room")

    # Hard-delete all messages in the room first (FK constraint)
    db.query(ChatMessage).filter(ChatMessage.room_id == room.id).delete()
    db.delete(room)
    db.commit()
    return {"detail": "Room deleted"}


# Edit a message
@router.patch("/messages/{message_id}")
def edit_message(
    message_id: int,
    body: ChatMessageEdit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    msg = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    if msg.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot edit someone else's message")
    if msg.is_deleted:
        raise HTTPException(status_code=400, detail="Cannot edit a deleted message")

    msg.content = body.content
    msg.is_edited = True
    msg.edited_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(msg)

    sender = db.query(User).filter(User.id == msg.sender_id).first()
    return format_message(msg, sender)


# Delete a message (soft delete)
@router.delete("/messages/{message_id}")
def delete_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    msg = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    if msg.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot delete someone else's message")

    msg.is_deleted = True
    db.commit()
    return {"detail": "Message deleted"}


# Close a room (admin/expert only)
@router.patch("/rooms/{room_uuid}/close")
def close_room(
    room_uuid: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["expert", "admin"]:
        raise HTTPException(status_code=403, detail="Only experts or admin can close rooms")
    room = db.query(ChatRoom).filter(ChatRoom.uuid == room_uuid).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    room.status = "closed"
    db.commit()
    return {"detail": "Room closed"}


# ── WebSocket Endpoint ────────────────────────────────────

@router.websocket("/ws/{room_uuid}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_uuid: str,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    # verify token
    from app.utils import verify_token
    email = verify_token(token)
    if email is None:
        await websocket.close(code=1008)
        return

    current_user = db.query(User).filter(User.email == email).first()
    if current_user is None:
        await websocket.close(code=1008)
        return

    # verify room exists
    room = db.query(ChatRoom).filter(ChatRoom.uuid == room_uuid).first()
    if not room:
        await websocket.close(code=1008)
        return

    await manager.connect(websocket, room_uuid)

    # announce join
    await manager.broadcast({
        "type": "system",
        "text": f"{current_user.name} joined the chat.",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }, room_uuid)

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type", "message")

            if msg_type == "typing":
                await manager.broadcast_except({
                    "type": "typing",
                    "sender_name": current_user.name,
                }, room_uuid, websocket)

            elif msg_type == "stop_typing":
                await manager.broadcast_except({
                    "type": "stop_typing",
                    "sender_name": current_user.name,
                }, room_uuid, websocket)

            elif msg_type == "message":
                # save to DB
                msg = ChatMessage(
                    room_id=room.id,
                    sender_id=current_user.id,
                    content=data.get("text", ""),
                )
                db.add(msg)
                db.commit()
                db.refresh(msg)

                # broadcast to everyone in room
                await manager.broadcast(
                    format_message(msg, current_user),
                    room_uuid
                )

            elif msg_type == "edit":
                message_id = data.get("message_id")
                new_text = data.get("text", "")
                msg = db.query(ChatMessage).filter(
                    ChatMessage.id == message_id,
                    ChatMessage.sender_id == current_user.id
                ).first()
                if msg and not msg.is_deleted:
                    msg.content = new_text
                    msg.is_edited = True
                    msg.edited_at = datetime.now(timezone.utc)
                    db.commit()
                    db.refresh(msg)
                    await manager.broadcast({
                        **format_message(msg, current_user),
                        "type": "edit",
                    }, room_uuid)

            elif msg_type == "delete":
                message_id = data.get("message_id")
                msg = db.query(ChatMessage).filter(
                    ChatMessage.id == message_id,
                    ChatMessage.sender_id == current_user.id
                ).first()
                if msg:
                    msg.is_deleted = True
                    db.commit()
                    await manager.broadcast({
                        "type": "delete",
                        "message_id": message_id,
                        "room_uuid": room_uuid,
                    }, room_uuid)

    except WebSocketDisconnect:
        manager.disconnect(websocket, room_uuid)
        await manager.broadcast({
            "type": "system",
            "text": f"{current_user.name} left the chat.",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }, room_uuid)