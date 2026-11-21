# Phase 21 KNOWLEDGE

## Claude Code の hook（Windows）

- PreToolUse の hook のコマンドは Git Bash で動き、`$CLAUDE_PROJECT_DIR` は展開される（2026-11-21 Windows で確認）
- 終了コード 2 で止めると、`git add … && git commit …` のコマンド全体が実行されない（add もされない）
- Windows の Claude Code は git を PowerShell ツールで動かすことが多い。matcher が `Bash` だけだと hook が走らない
