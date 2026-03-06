# Claude Code Configuration Rules

## File Structure

```
.claude/
├── CLAUDE.md           # Project overview + references
├── rules/              # Guidelines (auto-loaded)
│   ├── general.md      # Global rules
│   └── specific.md     # Path-specific rules
└── skills/             # Automated tasks (auto-invoked)
    └── skill-name/
        └── SKILL.md
```

## Core Principles

### 1. No Duplication
- ❌ Same information in multiple files
- ✅ Single source of truth, others reference it

### 2. Path-Specific When Possible
- ❌ Global rules for layer-specific patterns
- ✅ Use `paths:` frontmatter to load only when needed

### 3. Skills vs Rules

**Use Skills for:**
- Repetitive tasks (type-check, create migration, add docs)
- Step-by-step automation
- Command execution

**Use Rules for:**
- Code patterns and guidelines
- Architecture decisions
- What to do / not to do

### 4. Keep It Concise
- Show pattern, not explanation
- 1-2 examples, not every variation
- Reference instead of repeat
