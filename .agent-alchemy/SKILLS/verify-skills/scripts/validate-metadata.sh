#!/bin/bash

echo "🔍 Validating Specification Metadata..."
echo ""

# Script root and repository root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$( cd "$SCRIPT_DIR/../../.." && pwd )"

# Default specs directory (can pass as first arg)
SPECS_DIR="${1:-$REPO_ROOT/.agent-alchemy/specs}"

total=0
valid=0
enhanced=0
declare -a invalid
declare -a needs_enhancement

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check required fields
check_required_fields() {
  local file=$1
  local has_title=$(grep -c "^title:" "$file" 2>/dev/null || echo "0")
  local has_category=$(grep -c "^category:" "$file" 2>/dev/null || echo "0")
  local has_feature=$(grep -c "^feature:" "$file" 2>/dev/null || echo "0")
  local has_lastUpdated=$(grep -c "^lastUpdated:" "$file" 2>/dev/null || echo "0")
  local has_source=$(grep -c "^source:" "$file" 2>/dev/null || echo "0")
  local has_version=$(grep -c "^version:" "$file" 2>/dev/null || echo "0")
  local has_aiContext=$(grep -c "^aiContext:" "$file" 2>/dev/null || echo "0")
  
  # Remove newlines and ensure numeric
  has_title=$(echo "$has_title" | tr -d '\n\r' | grep -o '[0-9]*' | head -1)
  has_category=$(echo "$has_category" | tr -d '\n\r' | grep -o '[0-9]*' | head -1)
  has_feature=$(echo "$has_feature" | tr -d '\n\r' | grep -o '[0-9]*' | head -1)
  has_lastUpdated=$(echo "$has_lastUpdated" | tr -d '\n\r' | grep -o '[0-9]*' | head -1)
  has_source=$(echo "$has_source" | tr -d '\n\r' | grep -o '[0-9]*' | head -1)
  has_version=$(echo "$has_version" | tr -d '\n\r' | grep -o '[0-9]*' | head -1)
  has_aiContext=$(echo "$has_aiContext" | tr -d '\n\r' | grep -o '[0-9]*' | head -1)
  
  # Default to 0 if empty
  : ${has_title:=0}
  : ${has_category:=0}
  : ${has_feature:=0}
  : ${has_lastUpdated:=0}
  : ${has_source:=0}
  : ${has_version:=0}
  : ${has_aiContext:=0}
  
  if [ "$has_title" -eq 0 ]; then echo "missing: title"; return 1; fi
  if [ "$has_category" -eq 0 ]; then echo "missing: category"; return 1; fi
  if [ "$has_feature" -eq 0 ]; then echo "missing: feature"; return 1; fi
  if [ "$has_lastUpdated" -eq 0 ]; then echo "missing: lastUpdated"; return 1; fi
  if [ "$has_source" -eq 0 ]; then echo "missing: source"; return 1; fi
  if [ "$has_version" -eq 0 ]; then echo "missing: version"; return 1; fi
  if [ "$has_aiContext" -eq 0 ]; then echo "missing: aiContext"; return 1; fi
  
  return 0
}

# Function to check optional/enhanced fields
check_enhanced_fields() {
  local file=$1
  local has_keywords=$(grep -c "^keywords:" "$file" 2>/dev/null || echo "0")
  local has_topics=$(grep -c "^topics:" "$file" 2>/dev/null || echo "0")
  local has_useCases=$(grep -c "^useCases:" "$file" 2>/dev/null || echo "0")
  
  # Remove newlines and ensure numeric
  has_keywords=$(echo "$has_keywords" | tr -d '\n\r' | grep -o '[0-9]*' | head -1)
  has_topics=$(echo "$has_topics" | tr -d '\n\r' | grep -o '[0-9]*' | head -1)
  has_useCases=$(echo "$has_useCases" | tr -d '\n\r' | grep -o '[0-9]*' | head -1)
  
  # Default to 0 if empty
  : ${has_keywords:=0}
  : ${has_topics:=0}
  : ${has_useCases:=0}
  
  # Return 0 if all enhanced fields present
  if [ "$has_keywords" -gt 0 ] && [ "$has_topics" -gt 0 ] && [ "$has_useCases" -gt 0 ]; then
    return 0
  fi
  
  # Return details about missing fields
  local missing=""
  [ "$has_keywords" -eq 0 ] && missing="${missing}keywords, "
  [ "$has_topics" -eq 0 ] && missing="${missing}topics, "
  [ "$has_useCases" -eq 0 ] && missing="${missing}useCases, "
  echo "${missing%, }"
  return 1
}

# Find all specification files
for spec in $(find "$SPECS_DIR" -name "*.specification.md"); do
  total=$((total + 1))
  spec_name=$(basename "$spec")
  
  # Check if file starts with frontmatter delimiter
  first_line=$(head -1 "$spec")
  if [ "$first_line" != "---" ]; then
    invalid+=("$spec_name|No frontmatter found")
    continue
  fi
  
  # Check required fields
  missing=$(check_required_fields "$spec")
  if [ $? -ne 0 ]; then
    invalid+=("$spec_name|$missing")
    continue
  fi
  
  # If required fields are present, count as valid
  valid=$((valid + 1))
  
  # Check enhanced fields
  missing_enhanced=$(check_enhanced_fields "$spec")
  if [ $? -eq 0 ]; then
    enhanced=$((enhanced + 1))
  else
    needs_enhancement+=("$spec_name|Missing: $missing_enhanced")
  fi
done

# Calculate percentages
if [ $total -gt 0 ]; then
  valid_percent=$((valid * 100 / total))
  enhanced_percent=$((enhanced * 100 / total))
  overall_quality=$(( (valid_percent + enhanced_percent) / 2 ))
else
  valid_percent=0
  enhanced_percent=0
  overall_quality=0
fi

# Display results
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📊 Validation Results${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Total specifications: $total"
echo ""
echo -e "${GREEN}  ✅ Valid (required fields): $valid / $total (${valid_percent}%)${NC}"
echo -e "${BLUE}  ⭐ Enhanced (optional fields): $enhanced / $total (${enhanced_percent}%)${NC}"
echo ""
echo -e "  ${YELLOW}Overall Quality Score: ${overall_quality}%${NC}"
echo ""

# Show invalid specifications
if [ ${#invalid[@]} -gt 0 ]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "${RED}❌ Specifications with MISSING REQUIRED fields:${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  for item in "${invalid[@]}"; do
    IFS='|' read -r name reason <<< "$item"
    echo -e "  ${RED}✗${NC} $name"
    echo "    Issue: $reason"
  done
  echo ""
fi

# Show specs needing enhancement
if [ ${#needs_enhancement[@]} -gt 0 ]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "${YELLOW}⚠️  Specifications needing ENHANCEMENT:${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  for item in "${needs_enhancement[@]}"; do
    IFS='|' read -r name reason <<< "$item"
    echo -e "  ${YELLOW}⚠${NC} $name"
    echo "    $reason"
  done
  echo ""
fi

# Success message if all valid
if [ ${#invalid[@]} -eq 0 ]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "${GREEN}✅ All specifications have required metadata!${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
fi

# Recommendations
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📝 Recommendations:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ${#invalid[@]} -gt 0 ]; then
  echo "  1. Fix ${#invalid[@]} specifications with missing required fields"
  echo "     Priority: CRITICAL"
  echo ""
fi

if [ ${#needs_enhancement[@]} -gt 0 ]; then
  echo "  2. Enhance ${#needs_enhancement[@]} specifications with optional fields"
  echo "     Priority: HIGH (improves discoverability)"
  echo ""
fi

if [ ${#invalid[@]} -eq 0 ] && [ ${#needs_enhancement[@]} -eq 0 ]; then
  echo -e "  ${GREEN}✨ All specifications meet the standard!${NC}"
  echo "     Consider periodic reviews to maintain quality."
  echo ""
fi

echo "  See: specification-metadata-standard.specification.md"
echo ""

# Exit code
if [ ${#invalid[@]} -gt 0 ]; then
  exit 1
else
  # Continue to validate SKILL.md files
  SKILLS_DIR="$REPO_ROOT/.agent-alchemy/SKILLS"
  declare -a skill_invalid
  declare -a skill_needs

  for skill in $(find "$SKILLS_DIR" -name "SKILL.md" 2>/dev/null); do
    skill_name=$(basename "$(dirname "$skill")")
    # accept either title or name as identifier
    has_title=$(grep -c "^title:" "$skill" 2>/dev/null || echo "0")
    has_name=$(grep -c "^name:" "$skill" 2>/dev/null || echo "0")
    has_version=$(grep -c "^version:" "$skill" 2>/dev/null || echo "0")
    has_aiContext=$(grep -c "^aiContext:" "$skill" 2>/dev/null || echo "0")
    has_intents=$(grep -c "^intents:" "$skill" 2>/dev/null || echo "0")
    has_runner=$(grep -c "^runner:" "$skill" 2>/dev/null || echo "0")

    has_title=$(echo "$has_title" | tr -d '\n\r' | grep -o '[0-9]*' | head -1)
    has_name=$(echo "$has_name" | tr -d '\n\r' | grep -o '[0-9]*' | head -1)
    has_version=$(echo "$has_version" | tr -d '\n\r' | grep -o '[0-9]*' | head -1)
    has_aiContext=$(echo "$has_aiContext" | tr -d '\n\r' | grep -o '[0-9]*' | head -1)
    has_intents=$(echo "$has_intents" | tr -d '\n\r' | grep -o '[0-9]*' | head -1)
    has_runner=$(echo "$has_runner" | tr -d '\n\r' | grep -o '[0-9]*' | head -1)

    : ${has_title:=0}
    : ${has_name:=0}
    : ${has_version:=0}
    : ${has_aiContext:=0}
    : ${has_intents:=0}
    : ${has_runner:=0}

    # require at least title or name
    if [ "$has_title" -eq 0 ] && [ "$has_name" -eq 0 ]; then
      skill_invalid+=("$skill_name|Missing required SKILL identifier (title or name)")
      continue
    fi

    # recommended fields
    if [ "$has_version" -eq 0 ]; then
      skill_needs+=("$skill_name|Missing version (recommended)")
    fi
    if [ "$has_aiContext" -eq 0 ]; then
      skill_needs+=("$skill_name|Missing aiContext (recommended)")
    fi
    if [ "$has_intents" -eq 0 ]; then
      skill_needs+=("$skill_name|Missing intents (recommended)")
    fi
    if [ "$has_runner" -eq 0 ]; then
      skill_needs+=("$skill_name|Missing runner (recommended)")
    fi
  done

  if [ ${#skill_invalid[@]} -gt 0 ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${RED}❌ SKILL files with MISSING REQUIRED fields:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    for item in "${skill_invalid[@]}"; do
      IFS='|' read -r name reason <<< "$item"
      echo -e "  ${RED}✗${NC} $name"
      echo "    Issue: $reason"
    done
    echo ""
    exit 1
  fi

  if [ ${#skill_needs[@]} -gt 0 ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${YELLOW}⚠️  SKILL files needing enhancement:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    for item in "${skill_needs[@]}"; do
      IFS='|' read -r name reason <<< "$item"
      echo -e "  ${YELLOW}⚠${NC} $name"
      echo "    $reason"
    done
    echo ""
  fi

  exit 0
fi
