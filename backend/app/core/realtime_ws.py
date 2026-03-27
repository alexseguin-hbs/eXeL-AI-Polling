"""Real-time WebSocket endpoint for Supabase Realtime relay."""

import os

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from supabase import create_client, Client

router = APIRouter(tags=["Realtime"])

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")


def get_supabase() -> Client:
    """Create Supabase client."""
    return create_client(SUPABASE_URL, SUPABASE_KEY)


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
