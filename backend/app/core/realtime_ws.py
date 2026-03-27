"""Real-time WebSocket endpoint for Supabase Realtime relay."""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from supabase import create_client, Client

from app.config import settings

router = APIRouter(tags=["Realtime"])


def get_supabase() -> Client:
    """Create Supabase client."""
    return create_client(settings.supabase_url, settings.supabase_key)


@router.websocket("/ws/session/{session_code}")
async def websocket_endpoint(websocket: WebSocket, session_code: str):
    """Relay Supabase Realtime postgres_changes to connected clients."""
    await websocket.accept()
    supabase = get_supabase()
    channel = supabase.channel(f"session:{session_code}")

    async def on_change(payload):
        await websocket.send_json(payload)

    channel.on(
        "postgres_changes",
        {"event": "*", "schema": "public", "table": "responses"},
        on_change,
    )
    channel.on(
        "postgres_changes",
        {"event": "*", "schema": "public", "table": "themes"},
        on_change,
    )
    channel.subscribe()

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        await channel.unsubscribe()
