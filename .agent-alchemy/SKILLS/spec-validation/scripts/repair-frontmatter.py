#!/usr/bin/env python3
"""Utility script to normalize specification frontmatter.

It removes duplicate `meta:` lines introduced by autofix scripts and injects a
proper `meta` block (matching `.agent-alchemy/schemas/spec-meta.schema.json`)
into any `.specification.md` file missing one.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
import json
import os
from pathlib import Path
import re
from typing import List

import yaml

ROOT = Path(__file__).resolve().parents[3]
SCHEMA_DATE = datetime.utcnow().date().isoformat()
META_ID_PATTERN = re.compile(r'[^a-z0-9]+')


@dataclass
class MetaContext:
    path: Path
    relative: str
    title: str
    version: str
    status: str
    scope: str
    tags: List[str]
    created_by: str
    created_at: str

    def to_lines(self) -> List[str]:
        return [
            'meta:',
            f'  id: {self.relative}',
            f"  title: '{self.title}'",
            f"  version: '{self.version}'",
            f'  status: {self.status}',
            f'  scope: {self.scope}',
            f'  tags: {json.dumps(self.tags)}',
            f'  createdBy: {self.created_by}',
            f"  createdAt: '{self.created_at}'",
        ]


def slugify(path: Path) -> str:
    rel = str(path.with_suffix('')).lower().replace('.specification', '')
    rel = rel.replace(os.sep, '-')
    return META_ID_PATTERN.sub('-', rel).strip('-') or 'spec-meta'


def remove_duplicate_meta(path: Path) -> bool:
    text = path.read_text(encoding='utf-8')
    lines = text.splitlines()
    if not lines or lines[0].strip() != '---':
        return False
    try:
        end_idx = next(i for i, line in enumerate(lines[1:], start=1) if line.strip() == '---')
    except StopIteration:
        return False
    front_lines = lines[1:end_idx]
    meta_seen = False
    changed = False
    new_front = []
    for line in front_lines:
        if line.strip() == 'meta:':
            if meta_seen:
                changed = True
                continue
            meta_seen = True
        new_front.append(line)
    if changed:
        rebuilt = ['---'] + new_front + ['---'] + lines[end_idx + 1 :]
        path.write_text('\n'.join(rebuilt) + ('\n' if text.endswith('\n') else ''), encoding='utf-8')
    return changed


def build_meta_context(path: Path, data: dict) -> MetaContext:
    rel = path.relative_to(ROOT)
    meta_id = slugify(rel)
    title = data.get('title') or rel.stem.replace('-', ' ').title()
    version = str(data.get('version') or '0.1.0')
    status = str(data.get('status') or 'draft')
    rel_str = str(rel)
    if '/frameworks/' in rel_str:
        scope = 'framework'
    elif '/standards/' in rel_str:
        scope = 'standards'
    elif '/products/' in rel_str or '/content-queue/' in rel_str:
        scope = 'feature'
    else:
        scope = 'spec'
    tags = data.get('keywords') if isinstance(data.get('keywords'), list) else []
    created_by = str(data.get('createdBy') or 'unknown')
    created_at = (data.get('createdAt') or data.get('lastUpdated') or SCHEMA_DATE)
    return MetaContext(
        path=path,
        relative=meta_id,
        title=title,
        version=version,
        status=status,
        scope=scope,
        tags=tags,
        created_by=created_by,
        created_at=created_at,
    )


def ensure_meta_block(path: Path) -> bool:
    text = path.read_text(encoding='utf-8')
    lines = text.splitlines()
    if not lines or lines[0].strip() != '---':
        return False
    try:
        end_idx = next(i for i, line in enumerate(lines[1:], start=1) if line.strip() == '---')
    except StopIteration:
        return False
    front_text = '\n'.join(lines[1:end_idx])
    try:
        data = yaml.safe_load(front_text) or {}
    except Exception:
        return False
    if isinstance(data.get('meta'), dict):
        return False
    ctx = build_meta_context(path, data)
    sanitized_front = [line for line in lines[1:end_idx] if line.strip() != 'meta:']
    new_front = ctx.to_lines() + sanitized_front
    rebuilt = ['---'] + new_front + lines[end_idx:]
    path.write_text('\n'.join(rebuilt) + ('\n' if text.endswith('\n') else ''), encoding='utf-8')
    return True


def main() -> None:
    removed = 0
    added = 0
    for spec in ROOT.rglob('*.specification.md'):
        if remove_duplicate_meta(spec):
            removed += 1
    for spec in ROOT.rglob('*.specification.md'):
        if ensure_meta_block(spec):
            added += 1
    print(f'Removed duplicate meta lines in {removed} files')
    print(f'Added meta blocks to {added} files')


if __name__ == '__main__':
    main()
