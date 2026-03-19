import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict

import frontmatter

from app.db.data import upsert_post


def load_post(file_path: Path) -> Dict[str, Any]:
    post = frontmatter.load(file_path)
    metadata = post.metadata or {}
    if "slug" not in metadata:
        metadata["slug"] = file_path.stem
    now_iso = datetime.utcnow().isoformat() + "Z"
    metadata.setdefault("publishedAt", now_iso)
    metadata["updatedAt"] = now_iso
    return {
        "slug": metadata["slug"],
        "title": metadata.get("title") or metadata["slug"],
        "summary": metadata.get("summary"),
        "contentMarkdown": post.content,
        "tags": metadata.get("tags", []),
        "publishedAt": metadata.get("publishedAt"),
        "updatedAt": metadata.get("updatedAt"),
        "heroMediaUrl": metadata.get("heroMediaUrl"),
        "isVideo": metadata.get("isVideo", False),
        "status": metadata.get("status", "published"),
    }


def sync_blog_content(content_dir: Path, dry_run: bool = False) -> None:
    for file_path in content_dir.glob("*.md"):
        document = load_post(file_path)
        print(f"Upserting post: {document['slug']}")
        if dry_run:
            print(json.dumps(document, indent=2))
        else:
            upsert_post(document)


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    content_dir = root / "content" / "blog"
    content_dir.mkdir(parents=True, exist_ok=True)
    sync_blog_content(content_dir, dry_run=False)


if __name__ == "__main__":
    main()
