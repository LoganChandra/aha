#!/usr/bin/env bash
# Overnight OpenRouter spend guard (Logan, 2026-10-29: "i dont want you to burn all my credits").
# Prints spent and remaining against the cap; exits 1 when the cap is reached.
BASE=507.43   # key usage when the overnight loop was set up (2026-10-29 00:07 MYT)
CAP=${CAP:-7.00}   # Logan, 2026-10-29 02:13: "put the spend cap for these rounds to 7"
K=$(grep -m1 '^OPENROUTER_API_KEY=' "$(dirname "$0")/../.env.local" | cut -d= -f2-)
USAGE=$(curl -s https://openrouter.ai/api/v1/key -H "Authorization: Bearer $K" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['usage'])")
python3 -c "
spent = $USAGE - $BASE; left = $CAP - spent
print(f'overnight spent \${spent:.3f} of \${$CAP:.2f} cap, \${left:.3f} left')
raise SystemExit(0 if left > 0.05 else 1)"
