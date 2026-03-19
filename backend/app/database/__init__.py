"""
Database Package
================

Exports database utilities for the interview simulator.
"""

from sqlalchemy.ext.declarative import declarative_base

# Base class for all ORM models
Base = declarative_base()

# Import after Base is defined to avoid circular imports
from .db import SessionLocal, get_db, engine

__all__ = ["Base", "SessionLocal", "get_db", "engine"]
