# EA Coding Rules

Sharing code makes everyone better. These rules keep it fair, respectful, and legally clean. Whether you're posting snippets or full EA source code, here's what you need to know.

## Quick Wins

- **Give credit always** – mention original authors and sources
- **License matters** – respect MIT, GPL, or proprietary restrictions
- **No code theft** – decompiling paid EAs is banned
- **Comment your code** – explain what functions do
- **Share responsibly** – don't leak paid source code you didn't create

## The Rules

1. **Credit the original author**: If you modify someone else's code, say so clearly. Example: "Based on @Username's Grid EA, modified for XAUUSD M5". Link to the original post if possible.

2. **Respect licenses**: Code comes with licenses (MIT, GPL, proprietary, etc.). MIT/GPL usually allows modification and sharing. Proprietary means you need permission. When in doubt, ask the author first.

3. **No decompiling paid EAs**: It's unethical and usually illegal. If someone sold you an .ex4/.ex5 file, you bought the executable, not the source code. Don't decompile it, reverse-engineer it, or share the internals.

4. **Share source code properly**: If you post .mq4/.mq5 code, format it properly (use code blocks), add comments, and explain what it does. Include dependencies and required libraries.

5. **Mark modifications clearly**: If you fork someone's EA, mark your changes. Comment like "// Modified by [YourName] - Changed lot sizing logic" so people know what's different.

6. **Don't steal paid work**: If you bought a paid EA with source code, you can't share that source unless the license explicitly allows it. Read the seller's terms.

7. **Test before sharing**: If you share EA code, test it yourself first. Don't post broken code and expect others to fix it. Share what works (or clearly label it as "untested/experimental").

8. **Keep secrets private**: Don't share code containing API keys, broker credentials, or license activation code. Strip that stuff out before posting.

## Fair Use Examples

**✅ GOOD:**
- Sharing your own EA source code with MIT license
- Posting a code snippet from a free EA with credit
- Modifying a GPL-licensed indicator and sharing improvements
- Asking for help with your own code in a forum thread
- Sharing backtesting results of any EA (paid or free)

**❌ BAD:**
- Decompiling a paid EA and posting the source
- Copying an EA from GitHub and claiming it as your own
- Sharing a purchased EA's source code without permission
- Removing author credits from code you modify
- Posting license keys or activation bypasses

## How to Give Proper Credit

**Format for forks and modifications:**

```
// Original EA: [Name] by [Author]
// Source: [Link to original post or GitHub]
// License: [MIT/GPL/etc]
// Modified by: [Your username]
// Changes: [Brief list of what you changed]
```

**Example:**

```
// Original EA: Simple MA Cross EA by @TradingGuru
// Source: https://yoforex.com/thread/simple-ma-cross-ea
// License: MIT
// Modified by: @YourUsername
// Changes: Added trailing stop, changed timeframe to M5, optimized for GBPUSD
```

## Mini-FAQ

**Q: Can I learn from decompiled code without sharing it?**  
A: Legally and ethically, no. If the author didn't provide source code, they didn't intend for you to see it. Study open-source EAs instead—there are thousands available.

**Q: What if someone stole my code?**  
A: Use the Report button and provide proof (original post link, timestamps, GitHub commits, etc.). We take code theft seriously and will remove stolen content.

**Q: Can I sell modified versions of free EAs?**  
A: Only if the license allows it. MIT license usually says yes. GPL requires you to share source. Proprietary/All Rights Reserved means ask permission first.

**Q: Is it okay to post code from paid courses?**  
A: No, unless the course allows it. Paid courses own their course materials. You can describe concepts or write your own version, but don't copy-paste course code.

**Q: What about posting broker API wrappers or helper functions?**  
A: Usually fine if you wrote them yourself. If you copied from a library or SDK, check its license. Most broker SDKs are open for use, but double-check.

## End Note

If you're unsure whether sharing something is okay, ask in **Coding & Development → MQL4/MQL5** and describe the situation. Someone will help you figure out the right approach.
