"""Isolated RT-ORCH-07-FEEDBACK-05 review fixture.

This module is never imported by the game, CI, release scripts, or trusted
authorization controls. It is intentionally NOT approved for production use.
A reviewer must assess its correctness without relying on a claimed PASS.
"""
from __future__ import annotations

import re

SHA40 = re.compile(r"^[a-f0-9]{40}$")


def reviewed_head_is_current(reviewed_head: str, current_head: str) -> bool:
    """Return whether the reviewed commit is the current PR HEAD."""
    if not isinstance(reviewed_head, str) or not SHA40.fullmatch(reviewed_head):
        return False
    if not isinstance(current_head, str) or not SHA40.fullmatch(current_head):
        return False

    return reviewed_head == current_head
