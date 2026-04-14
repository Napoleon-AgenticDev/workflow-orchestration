#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SPECS_DIR="$SCRIPT_DIR/../../standards"

today=$(date +%F)
declare -a FIXES

for spec in $(find "$SPECS_DIR" -name "*.specification.md"); do
  # Ensure spec is readable
  [ -r "$spec" ] || continue

  first_line=$(head -n1 "$spec" || echo "")
  if [ "$first_line" != "---" ]; then
    # Prepend a minimal frontmatter
    tmp=$(mktemp)
    cat > "$tmp" <<EOF
---
title: 'TODO: add title'
category: 'Uncategorized'
feature: 'TODO: add feature'
lastUpdated: $today
source: 'Agent Alchemy Standards'
version: '1.0'
aiContext: true
---

EOF
    cat "$spec" >> "$tmp"
    mv "$tmp" "$spec"
    FIXES+=("$spec|added_frontmatter")
    continue
  fi

  # find closing delimiter line number
  end_line=$(awk 'NR>1 && /^---$/{print NR; exit}' "$spec" || true)
  if [ -z "$end_line" ]; then
    FIXES+=("$spec|no_closing_delimiter")
    continue
  fi

  # For each required key, check presence in frontmatter (lines 1..end_line)
  for key in title category feature lastUpdated source version aiContext; do
    if ! sed -n "1,${end_line}p" "$spec" | grep -q "^${key}:"; then
      tmp=$(mktemp)
      # write lines up to end_line-1
      head -n $((end_line-1)) "$spec" > "$tmp"
      # add the missing key placeholder
      case $key in
        title) echo "title: 'TODO: add title'" >> "$tmp" ;;
        category) echo "category: 'Uncategorized'" >> "$tmp" ;;
        feature) echo "feature: 'TODO: add feature'" >> "$tmp" ;;
        lastUpdated) echo "lastUpdated: $today" >> "$tmp" ;;
        source) echo "source: 'Agent Alchemy Standards'" >> "$tmp" ;;
        version) echo "version: '1.0'" >> "$tmp" ;;
        aiContext) echo "aiContext: true" >> "$tmp" ;;
      esac
      # closing delimiter
      echo '---' >> "$tmp"
      # append rest of file
      tail -n +$((end_line+1)) "$spec" >> "$tmp"
      mv "$tmp" "$spec"
      FIXES+=("$spec|added_${key}")
      # restart checks for this file (frontmatter changed)
      break
    fi
  done

  # Ensure aiContext=true if present but not true
  end_line=$(awk 'NR>1 && /^---$/{print NR; exit}' "$spec" || true)
  if sed -n "1,${end_line}p" "$spec" | grep -q "^aiContext:"; then
    val=$(sed -n "1,${end_line}p" "$spec" | grep "^aiContext:" | head -1 | cut -d: -f2 | tr -d ' \r\n"')
    if [ "$val" != "true" ]; then
      # replace the aiContext line
      tmp=$(mktemp)
      awk -v end=$end_line 'NR<=end{if(/^aiContext:/){print "aiContext: true"} else print} NR> end{print}' "$spec" > "$tmp"
      mv "$tmp" "$spec"
      FIXES+=("$spec|fixed_aiContext")
    fi
  fi
done

SKILLS_DIR="$SCRIPT_DIR/.."
for skill in $(find "$SKILLS_DIR" -name "SKILL.md" 2>/dev/null); do
  # ensure readable
  [ -r "$skill" ] || continue

  end_line=$(awk 'NR>1 && /^---$/{print NR; exit}' "$skill" || true)
  if [ -z "$end_line" ]; then
    # prepend minimal frontmatter
    tmp=$(mktemp)
    cat > "$tmp" <<EOF
---
title: 'TODO: add title'
version: '1.0'
aiContext: true
intents: ['TODO']
runner: ''
---

EOF
    cat "$skill" >> "$tmp"
    mv "$tmp" "$skill"
    FIXES+=("$skill|added_skill_frontmatter")
    continue
  fi

  # check required keys
  # if title missing but name present, copy name -> title
  if ! sed -n "1,${end_line}p" "$skill" | grep -q "^title:"; then
    if sed -n "1,${end_line}p" "$skill" | grep -q "^name:"; then
      name_val=$(sed -n "1,${end_line}p" "$skill" | grep "^name:" | head -1 | cut -d: -f2- | sed "s/^ //" )
      tmp=$(mktemp)
      head -n $((end_line-1)) "$skill" > "$tmp"
      echo "title: ${name_val}" >> "$tmp"
      echo '---' >> "$tmp"
      tail -n +$((end_line+1)) "$skill" >> "$tmp"
      mv "$tmp" "$skill"
      FIXES+=("$skill|copied_name_to_title")
      # recompute end_line
      end_line=$(awk 'NR>1 && /^---$/{print NR; exit}' "$skill" || true)
    fi
  fi

  for key in version aiContext intents; do
    if ! sed -n "1,${end_line}p" "$skill" | grep -q "^${key}:"; then
      tmp=$(mktemp)
      head -n $((end_line-1)) "$skill" > "$tmp"
      case $key in
        title) echo "title: 'TODO: add title'" >> "$tmp" ;;
        version) echo "version: '1.0'" >> "$tmp" ;;
        aiContext) echo "aiContext: true" >> "$tmp" ;;
        intents) echo "intents: ['TODO']" >> "$tmp" ;;
      esac
      echo '---' >> "$tmp"
      tail -n +$((end_line+1)) "$skill" >> "$tmp"
      mv "$tmp" "$skill"
      FIXES+=("$skill|added_${key}")
      break
    fi
  done
done

echo "Autofix summary:"
if [ ${#FIXES[@]} -eq 0 ]; then
  echo "  (no changes applied)"
else
  for f in "${FIXES[@]}"; do
    echo "  - $f"
  done
fi

exit 0

