"""Fixture-only database access. Never accepts an external database path."""
import sqlite3
from pathlib import Path

def local_database():
    root=Path(__file__).resolve().parent.parent/'.wrangler/matchmelo-state/v3/d1'
    for candidate in root.rglob('*.sqlite'):
        connection=sqlite3.connect(candidate,timeout=10)
        if connection.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='auth_user'").fetchone():
            return connection
        connection.close()
    raise RuntimeError('Build and migrate the local Matchmelo database first.')
