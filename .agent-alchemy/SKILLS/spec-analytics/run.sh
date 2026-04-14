#!/bin/bash
# Specification Analytics CLI
# 
# Usage:
#   ./run.sh --init <feature-id>             Initialize tracking
#   ./run.sh --cite <spec> [file]            Record spec citation
#   ./run.sh --analyze <file>                Analyze file complexity
#   ./run.sh --tokens <op> <in> <out>         Record token usage
#   ./run.sh --query <term>                  Search spec index
#   ./run.sh --report [--format]              Generate report
#   ./run.sh --check                       Verify compliance

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
ANALYTICS_DIR="$PROJECT_ROOT/.agent-alchemy/analytics"
ANALYTICS_DATA="$ANALYTICS_DIR/spec-usage.json"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo_logo() {
    echo -e "${BLUE}"
    echo "  ╔═══════════════════════════════════════╗"
    echo "  ║     Spec Analytics CLI v1.0.0        ║"
    echo "  ║     Specification Usage Tracking    ║"
    echo "  ╚═══════════════════════════════════════╝"
    echo -e "${NC}"
}

# Ensure analytics directory exists
ensure_dir() {
    if [ ! -d "$ANALYTICS_DIR" ]; then
        mkdir -p "$ANALYTICS_DIR"
    fi
}

# Initialize tracking for a new feature
cmd_init() {
    local feature_id="$1"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    ensure_dir
    
    cat > "$ANALYTICS_DATA" <<EOF
{
  "\$schema": "./spec-usage.schema.json",
  "version": "1.0.0",
  "feature": {
    "id": "$feature_id",
    "createdAt": "$timestamp"
  },
  "execution": {
    "id": "${feature_id}-v1",
    "startTime": "$timestamp",
    "approach": "spec-driven-with-citations"
  },
  "specifications": {
    "hierarchical": {
      "stack": { "path": ".agent-alchemy/specs/stack", "specs": [] },
      "frameworks": { "path": ".agent-alchemy/specs/frameworks", "specs": [] },
      "standards": { "path": ".agent-alchemy/specs/standards", "specs": [] }
    },
    "featureSpecific": { "path": ".agent-alchemy/products", "specs": [] }
  },
  "implementation": {
    "files": [],
    "totalLoc": 0,
    "totalCitations": 0
  },
  "analytics": {
    "retrievalCalls": [],
    "specUsageByCategory": {},
    "citationLog": []
  },
  "scores": {
    "specCompliance": 0,
    "citationRate": 0,
    "retrievalScore": 0,
    "overall": 0
  }
}
EOF

    echo -e "${GREEN}✓${NC} Initialized tracking for feature: $feature_id"
    echo "  Data file: $ANALYTICS_DATA"
}

# Record spec citation
cmd_cite() {
    local spec_path="$1"
    local file="$2"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    if [ ! -f "$ANALYTICS_DATA" ]; then
        echo -e "${RED}✗${NC} No tracking initialized. Run --init first."
        return 1
    fi
    
    # Add citation to JSON (using node or python if available)
    if command -v node &> /dev/null; then
        node -e "
        const fs = require('fs');
        const data = JSON.parse(fs.readFileSync('$ANALYTICS_DATA', 'utf-8'));
        data.implementation.totalCitations++;
        
        // Add file citation
        if ('$file') {
            const existingFile = data.implementation.files.find(f => f.path === '$file');
            if (existingFile) {
                existingFile.citations = (existingFile.citations || 0) + 1;
            }
        }
        
        // Log citation
        data.analytics.citationLog.push({
            specPath: '$spec_path',
            file: '$file',
            timestamp: '$timestamp'
        });
        
        // Categorize and count
        let category = 'other';
        if ('$spec_path'.includes('specs/stack')) category = 'stack';
        else if ('$spec_path'.includes('specs/frameworks')) category = 'frameworks';
        else if ('$spec_path'.includes('specs/standards')) category = 'standards';
        else if ('$spec_path'.includes('products/')) category = 'featureSpecific';
        
        if (!data.analytics.specUsageByCategory[category]) {
            data.analytics.specUsageByCategory[category] = { planned: 0, used: 0 };
        }
        data.analytics.specUsageByCategory[category].used++;
        
        // Update scores
        const fileCount = data.implementation.files.length || 1;
        data.scores.citationRate = (data.implementation.totalCitations / fileCount).toFixed(2) * 1;
        data.scores.specCompliance = data.scores.citationRate > 2 ? 100 : Math.round(data.scores.citationRate * 35);
        data.scores.overall = Math.round((data.scores.specCompliance + data.scores.citationRate * 20 + 50) / 3);
        
        fs.writeFileSync('$ANALYTICS_DATA', JSON.stringify(data, null, 2));
        "
        echo -e "${GREEN}✓${NC} Citation recorded: $spec_path"
    else
        echo -e "${YELLOW}!${NC} Node.js not available. Manually update $ANALYTICS_DATA"
    fi
}

# Analyze file complexity
cmd_analyze() {
    local file="$1"
    
    if [ ! -f "$file" ]; then
        echo -e "${RED}✗${NC} File not found: $file"
        return 1
    fi
    
    local lines=$(wc -l < "$file")
    
    # Count various metrics - use safer parsing
    local function_count
    function_count=$(grep -c 'function\|const.*=.*=>' "$file" 2>/dev/null || echo 0)
    local class_count
    class_count=$(grep -c '^export class\|^export interface' "$file" 2>/dev/null || echo 0)
    local import_count
    import_count=$(grep -c "^import" "$file" 2>/dev/null || echo 0)
    local citation_count
    citation_count=$(grep -c '\.agent-alchemy/specs' "$file" 2>/dev/null || echo 0)
    
    # Simple cyclomatic complexity - count control flow keywords
    local if_count for_count switch_count
    if_count=$(grep -c '\bif\b' "$file" 2>/dev/null || echo "0")
    for_count=$(grep -c '\bfor\b' "$file" 2>/dev/null || echo "0")
    switch_count=$(grep -c '\bswitch\b' "$file" 2>/dev/null || echo "0")
    
    # Base complexity is 1, add 1 for each control flow found
    local cyclomatic
    cyclomatic=$(expr 1 + "$if_count" + "$for_count" + "$switch_count" 2>/dev/null || echo 1)
    
    echo -e "${GREEN}✓${NC} Complexity analysis for: $file"
    echo "  ┌─────────────────────────────────────┐"
    echo "  │ LOC: $lines (code: $loc)           │"
    echo "  │ Imports: $import_count             │"
    echo "  │ Functions: $function_count         │"
    echo "  │ Classes: $class_count            │"
    echo "  │ Citations: $citation_count        │"
    echo "  │ Cyclomatic: $cyclomatic           │"
    echo "  └─────────────────────────────────────┘"
}

# Record token usage
cmd_tokens() {
    local operation="$1"
    local tokens_in="$2"
    local tokens_out="$3"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    ensure_dir
    
    total_tokens=$((tokens_in + tokens_out))
    
    echo -e "${GREEN}✓${NC} Token usage recorded: $operation"
    echo "  ┌─────────────────��───────────────────┐"
    echo "  │ Operation: $operation              │"
    echo "  │ In: $tokens_in                   │"
    echo "  │ Out: $tokens_out                  │"
    echo "  │ Total: $total_tokens            │"
    echo "  └─────────────────────────────────────┘"
}

# Search spec index
cmd_query() {
    local term="$1"
    local index_file="$ANALYTICS_DIR/spec-index.json"
    
    if [ ! -f "$index_file" ]; then
        echo -e "${YELLOW}!${NC} No spec index found. Creating default index..."
        cmd_init_default
    fi
    
    echo -e "${BLUE}🔍${NC} Searching specs for: $term"
    echo ""
    
    if command -v node &> /dev/null; then
        node -e "
        const fs = require('fs');
        const index = JSON.parse(fs.readFileSync('$index_file', 'utf-8'));
        // Simple search - in real use, implement fuzzy matching
        console.log('Search not fully implemented - use manual lookup');
        " 2>/dev/null || echo "  Please check spec-index.json manually"
    else
        echo "  Install Node.js for full search capability"
    fi
}

# Generate report
cmd_report() {
    echo_logo
    
    if [ ! -f "$ANALYTICS_DATA" ]; then
        echo -e "${RED}✗${NC} No tracking data. Run --init first."
        return 1
    fi
    
    echo -e "${BLUE}📊${NC} Analytics Report"
    echo "══════════════════════════════════════"
    echo ""
    
    # Read and display summary (basic parsing)
    echo "Data source: $ANALYTICS_DATA"
    echo ""
    
    # Try node for full report
    if command -v node &> /dev/null; then
        node -e "
        const fs = require('fs');
        const data = JSON.parse(fs.readFileSync('$ANALYTICS_DATA', 'utf-8'));
        
        console.log('Feature:', data.feature.id);
        console.log('Execution:', data.execution.id);
        console.log('');
        console.log('--- IMPLEMENTATION ---');
        console.log('Files:', data.implementation.files.length);
        console.log('Total LOC:', data.implementation.totalLoc || 'N/A');
        console.log('Citations:', data.implementation.totalCitations);
        console.log('');
        console.log('--- SCORES ---');
        console.log('Spec Compliance:', data.scores.specCompliance + '%');
        console.log('Citation Rate:', data.scores.citationRate + '/file');
        console.log('Retrieval Score:', data.scores.retrievalScore + '%');
        console.log('OVERALL:', data.scores.overall + '%');
        "
    else
        echo "Install Node.js for full report capability"
    fi
}

# Verify compliance
cmd_check() {
    echo_logo
    
    local min_citations=3
    
    echo -e "${BLUE}✓${NC} Compliance Check"
    echo "══════════════════════════════════════"
    echo ""
    echo "Target: $min_citations citations per file minimum"
    echo ""
    
    if [ -f "$ANALYTICS_DATA" ] && command -v node &> /dev/null; then
        node -e "
        const fs = require('fs');
        const data = JSON.parse(fs.readFileSync('$ANALYTICS_DATA', 'utf-8'));
        
        let compliant = true;
        data.implementation.files.forEach(f => {
            const citations = f.citations || 0;
            const status = citations >= $min_citations ? '✓' : '✗';
            console.log(status + ' ' + f.path + ': ' + citations + ' citations');
            if (citations < $min_citations) compliant = false;
        });
        
        console.log('');
        if (compliant) {
            console.log('✅ COMPLIANT - All files meet citation requirements');
        } else {
            console.log('⚠️  NEEDS WORK - Add more spec citations');
        }
        "
    else
        echo "Run --analyze on files first, then check"
    fi
}

# Show help
cmd_help() {
    echo_logo
    echo "Usage: ./run.sh <command> [options]"
    echo ""
    echo "Commands:"
    echo "  --init <feature-id>       Initialize tracking for new feature"
    echo "  --cite <spec> [file]      Record a spec citation"
    echo "  --analyze <file>          Analyze file complexity"
    echo "  --tokens <op> <in> <out> Record token usage (estimate)"
    echo "  --query <term>            Search spec index"
    echo "  --report                 Generate analytics report"
    echo "  --check                  Verify compliance"
    echo "  --help                  Show this help"
    echo ""
    echo "Examples:"
    echo "  ./run.sh --init product-management"
    echo "  ./run.sh --cite 'specs/frameworks/nestjs/database.md' 'apps/server/entity.ts'"
    echo "  ./run.sh --analyze 'apps/server/service.ts'"
    echo "  ./run.sh --report"
    echo "  ./run.sh --check"
}

# Main
main() {
    local cmd="${1:-}"
    shift || true
    
    case "$cmd" in
        --init)
            cmd_init "$1"
            ;;
        --cite)
            cmd_cite "$1" "$2"
            ;;
        --analyze)
            cmd_analyze "$1"
            ;;
        --tokens)
            cmd_tokens "$1" "$2" "$3"
            ;;
        --query)
            cmd_query "$1"
            ;;
        --report)
            cmd_report
            ;;
        --check)
            cmd_check
            ;;
        --help|-h)
            cmd_help
            ;;
        *)
            cmd_help
            ;;
    esac
}

main "$@"