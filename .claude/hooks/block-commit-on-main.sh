#!/usr/bin/env sh
# PreToolUse(Bash) guard: refuse a direct commit on the protected branch — EXCEPT
# when every pending change is documentation (*.md or docs/**). Docs are low-risk
# content, so a session report or a doc tweak may land straight on main without
# the branch+PR ceremony. Code still requires a branch.
#
# Reads the hook payload (JSON) on stdin; exit 2 blocks the tool and feeds the
# stderr message back to Claude. No jq/node dependency.

payload=$(cat)

# Only concerned with commits.
case "$payload" in
  *"git commit"*) ;;
  *) exit 0 ;;
esac

# Only concerned with the protected branches.
branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
case "$branch" in
  main | master) ;;
  *) exit 0 ;;
esac

# `git add` and `git commit` are often a single command, so the staged set is not
# yet reliable at PreToolUse time. Inspect the whole working tree instead (porcelain
# = staged + unstaged + untracked) — conservative: any non-doc change blocks.
# Strip the 2 status columns + space; for renames keep the destination path.
paths=$(git status --porcelain 2>/dev/null | sed -e 's/^...//' -e 's/.* -> //')
non_doc=$(printf '%s\n' "$paths" | grep -vE '\.md$|^docs/' | grep -v '^$')

# Doc-only (or nothing pending) → allow the direct commit on main.
[ -z "$non_doc" ] && exit 0

echo "Refused: direct commit on '$branch'. Non-documentation changes are present:" >&2
printf '%s\n' "$non_doc" | sed 's/^/  - /' >&2
echo "Create a feature branch (each feature gets its own branch, merged via PR)." >&2
echo "Exception: a commit touching only docs (*.md or docs/**) may go directly to main." >&2
exit 2
