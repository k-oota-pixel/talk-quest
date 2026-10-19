# テーマ別日常英会話 / Talk Quest

もんすたでぃの英語初心者向け文字チャットです。80テーマから選択し、ランダムな架空の人物と自由に会話します。会話の回数制限や強制終了はありません（サーバーの短時間・日次の利用上限はあります）。

## 構成

- `index.html`, `style.css`, `app.mjs`: ビルド不要のGitHub Pages画面。
- `topics.mjs`: 原案と同じ番号の80テーマ、日本語案内、分類。
- `persona.mjs`: ランダムseedから再現可能な人物設定。名前・性別・年齢層・性格・生活背景を確定。人種の分類は持たず、年齢層と性別に合う6種類の人物イラストを表示します。
- AI: 既存 `k-oota-pixel/task-quest` の `POST /api/talk-quest` を使用。Firebase ID tokenをサーバーで検証し、Geminiのキーはサーバー内に保持します。
- 3回に1回、AIが質問せずに自分の話を終え、生徒が質問できるヒントを返します。英語はA1の短文、日本語訳は必要なときだけ表示します。
- 会話は画面内のメモリのみで保持。直近20メッセージと固定人物設定をAIに送信します。先生用履歴・成績保存はありません。古い自由会話の細部は長い会話では引き継がれない場合があります。

## 公開

GitHub Pagesで `main` ブランチの `/ (root)` を公開してください。公開先は `https://k-oota-pixel.github.io/talk-quest/` です。サーバー側の対応PRを先にマージします。

サーバーは既存 `GEMINI_API_KEY` / `GEMINI_MODEL` を使用し、必要に応じて `TALK_GEMINI_API_KEY` / `TALK_GEMINI_MODEL` で上書きできます。`TALK_DAILY_LIMIT` は既定2000、1ユーザー20回/分、同時8件まで。日次上限はUTC基準・インスタンスのメモリ管理です。

## 確認

Node.js 22以降で `node --test tests/*.test.mjs`。ブラウザー検証はPlaywrightが利用できる環境で `node tests/browser.cjs`。`PLAYWRIGHT_MODULE` でモジュールの場所、`CHROME_PATH` でブラウザー実行ファイルを指定できます。
ブラウザー検証はFirebaseとAI通信をモックします。本番のGoogleログインと実AIとの会話には利用者のログインが必要です。

`topics.mjs` と `persona.mjs` を変更する際は、サーバー側の `talk-topics.mjs` と `talk-persona.mjs` も同じ内容に更新してください。
