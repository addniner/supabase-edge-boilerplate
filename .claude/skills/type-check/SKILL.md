---
name: type-check
description: Run Deno type checking for all edge functions. Use when checking TypeScript types, before deployment, or when the user mentions type errors or type checking.
---

# Type Check

Runs Deno type checking for all Supabase edge functions.

## Instructions

1. Run the type checking script from project root:

   ```bash
   .scripts/deno-check.sh
   ```

2. If there are type errors:
   - Report all errors clearly
   - Show file paths with line numbers
   - Explain what each error means
   - Do NOT attempt to fix errors automatically

3. If no errors:
   - Confirm that all types are valid

## Important Notes

- This script checks the `api` edge function in `supabase/functions/api/`
- Type errors must be fixed before deployment
- The script runs without any arguments
- Always run from the project root directory
- Use `.scripts/deno-check.sh -r` to reload Deno cache if needed
