"""Lightweight in-memory rate limiting.

A minimal fixed-window limiter keyed by client IP. It needs no extra
dependencies and is good enough to blunt password brute-forcing and abuse of
the auth endpoints.

Caveat: state is per-process, so with multiple gunicorn workers the effective
limit is (limit * workers). For strict global limits use a shared store
(Redis) — this is a pragmatic first line of defence.
"""
import time
import threading
from collections import defaultdict, deque
from typing import Deque, Dict, Tuple

from fastapi import HTTPException, Request, status

_LOCK = threading.Lock()
_HITS: Dict[Tuple[str, str], Deque[float]] = defaultdict(deque)


def _client_ip(request: Request) -> str:
    # Behind the EB load balancer the real client is in X-Forwarded-For.
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def rate_limit(bucket: str, limit: int, window_seconds: int):
    """Return a FastAPI dependency enforcing `limit` requests per `window_seconds` per IP."""

    def dependency(request: Request) -> None:
        key = (bucket, _client_ip(request))
        now = time.time()
        cutoff = now - window_seconds
        with _LOCK:
            hits = _HITS[key]
            while hits and hits[0] < cutoff:
                hits.popleft()
            if len(hits) >= limit:
                retry = int(hits[0] + window_seconds - now) + 1
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many requests. Please slow down and try again shortly.",
                    headers={"Retry-After": str(max(retry, 1))},
                )
            hits.append(now)

    return dependency
