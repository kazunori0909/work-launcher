// イベントの関数。アプリが決まった名前で呼ぶ（書き方は docs/config.md 10章）
// 使うものだけコメントを外して中身を書く。関数が無ければ呼ばない
module.exports = {
  // 案件を開くとき。画面を出す前（終わるまで画面を出さない）
  // async beforeOpen(ctx) {},

  // 案件を開くとき。画面を出したあと
  // async afterOpen(ctx) {},

  // 案件を閉じるとき。実行中のプロセスを止める前（終わるまで閉じずに待つ）
  // async beforeClose(ctx) {}
}
