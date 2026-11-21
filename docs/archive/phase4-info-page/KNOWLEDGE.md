# Phase 4 で確かめた挙動・制約

## PATH（Mac）

- Finder・ダブルクリックで起動したアプリの PATH は `/usr/bin:/bin:/usr/sbin:/sbin` 程度。
  mise・Homebrew の node などが見つからない
- `$SHELL -ilc` で PATH を読むと、ターミナルと同じ PATH が取れる（開発機で約 20ms）。
  `-i` が無いと `.zshrc` が読まれず、mise・Homebrew の設定を拾えないことがある。
  rc の出力に紛れないよう、印で挟んで取り出している
- 最小限の PATH（`env -i ... PATH=/usr/bin:/bin:/usr/sbin:/sbin`）で起動しても、node・docker が見つかることを確認した

## 導入を促すスタブ（Mac）

- `/usr/bin/git`・`/usr/bin/python3` は Command Line Tools が無いと、`/usr/bin/java` は JDK が無いと、
  実行したときに導入を促すダイアログを出すことがある。ターミナルの `java -version` は
  「Unable to locate a Java Runtime」を出して失敗する
- そのため、組み込みのツールがこれらのスタブを指すときは、先に `xcode-select -p`・`/usr/libexec/java_home`
  で本体の有無を確かめ、無ければ実行せずに「未インストール」とする

## 値の取り方（Mac）

- OS: `sw_vers`。コンピュータ名: `scutil --get ComputerName`（`os.hostname()` はネットワーク名で別物）
- 使用中のメモリ: `vm_stat` のアクティブ + 固定 + 圧縮で占有。アクティビティモニタの「使用済みメモリ」に近い。
  `os.freemem()` はキャッシュを除いた空きで、Mac ではほぼ常に小さく、使用量の目安にならない
- GPU: `system_profiler SPDisplaysDataType -json`。Apple シリコンは `sppci_cores`・
  `spdisplays_mtlgpufamilysupport`（`spdisplays_metal4` など）。ドライバーのバージョンの項目は無い
- ドライブ: `mount` の出力から `/` と `/Volumes/*`（`nobrowse` を除く）を選び、`fs.statfs` で容量を取る。
  APFS の `/` は読み取り専用のシステムボリュームで、`df` の使用量は小さく出る。同じ入れ物で空きを分け合うため、
  使用量は 全体 - 空き で見る。応答の無いネットワークドライブで止まらないよう、3秒で打ち切る
- 全部を集めて約 150ms（開発機。ツール4つを含む）
