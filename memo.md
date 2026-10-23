# anime-img 引き継ぎメモ v9 (2026-10-23)
## 目的
無検閲のアニメ画像生成(RunPod + ComfyUI)を、チャットとスマホのタップだけで回す。

## メモの保管(2026-10-23 変更)
- このメモは GitHub リポジトリ h7h7h7h7h/anime-img の memo.md に置く
- 書き込み = GitHubモバイルで開いて貼るだけ(URLエンコード不要・長さ制限なし)
- 読み出し = 私が raw URL を web_scrape で読む(ユーザーは貼らなくてよい)

## 【重要】worker の ?do=save を使うときの必須ルール
- URLの末尾が `;` `)` などの記号で終わると、チャットがリンクの末尾を外して保存内容が欠ける
  (毎回43行目でSyntaxErrorになっていた原因。メモ保存が失敗していたのも同じ)
- 対策: content の末尾に必ず改行(%0A)を足す → URLが `A` で終わるので外されない
- 2KBを超えるようなら2ファイルに分割し、PC側で copy /b で連結する
- 失敗の見分け: 保存後に `SAVED 名前 NNNB` が出る。NNNが想定より小さければ欠けている

## 【重要】画像はGitHubに上げない
- 画像は worker の KV 直配信(?do=file&name=)だけを使う。git push はしない
- 生成物はKVに残る(bot_00065〜00072 等)。GitHubに置くのはコードとメモだけ

## 本体
anic v3h / https://little-frost-d979.sute-trial174.workers.dev/ (GETのみ)
do: status pods start stop rebuild ready gen img file list loras save get up sh env help

## 運用ルール
- web_scrape は「判断が要る1回」だけ。起動待ち(start→ready)は ?do=ready をユーザーがタップ
- サンドボックス(HTML)は使わない。毎回失敗する。画像は ?do=file&name= を直接開く
- 終わったら ?do=stop

## 生成コマンド
1枚: ?do=gen&p=タグ&lora=bocchi_gotoh_xl.safetensors&lw=0.8&w=832&h=1216
結果: ?do=img&id=prompt_id → 出たファイル名で ?do=file&name=ファイル名

## ControlNet でキャラ差し替え
?do=gen&ci=入力画像名&cn=cn-openpose-sdxl.safetensors&cp=OpenposePreprocessor&cs=0.8&dn=0.7&p=タグ&lora=..&lw=0.8
- cn = ControlNetモデルのファイル名
- cp = 前処理ノードのクラス名(OpenposePreprocessor)
- p = プロンプト(ここを間違えると missing_node_type エラー)
- dn<1 で元画像ベース。dnを下げるほど元絵に忠実 / cs はControlNet強度

## PCエージェント(2026-10-23 作成中)
- 目的: ユーザーにコマンドを打たせない。PCでダブルクリック→待つだけ
- 構成: C:\work\anime\anime.cmd(ランチャー) が KV の agent1.mjs + agent2.mjs を取って連結し node で実行
- タスクは KV の task.txt に1行ずつ書く(gen なら `gen ci=..&p=..`)。僕がURL1タップで置ける
- agent.mjs の機能: status/start/stop/ready/gen/file/task。画像は out\ に保存して自動で開く
- 注意: anime.cmd の中の `%` はURLエンコードでは %25。task.txt は行頭 # がコメント

## Pod
d4cnyyqmopxwtp / US-IL-1 / RTX4090 / ボリューム anime-sdxl
ComfyUIは自動起動。Jupyter 8888(トークン無し)。gotty Webターミナル 19123
罠: pkill -f 8000 は PID1 も殺してコンテナ再起動になる。8000番のPIDだけ kill

## 未解決 / 次回やること
1. 【最優先】ユーザーにコマンドを打たせない → PCエージェント(上)を完成させる
   - ?do=sh が死ぬ理由 = Podの8000番を http.server が占有している
   - A: エントリポイントの8000番を python3 /workspace/agent.py に変える → ?do=sh&c=CMD が復活
   - B: ComfyUIに remoctl ノード(/remoctl/sh, /remoctl/reboot) → 再起動も私が回せる
   - C: rm /workspace/pylibs/.v1 でコンテナ再起動時に全依存を入れ直す(恒久化)
   - 順番 A→C→B
2. skimage 未導入(dwpose系が死ぬ)
3. ?do=deploy が script "worker" 固定で本体に行かない(WORKER_NAME未定義)
4. gitに残った画像6枚を掃除

## ControlNet差し替えの現状(未完成)
元絵 input/HU5bfwdbAAA0_LF (1).jpg(コンビニ、青髪ルーシー+褐色の男)
目的: 女だけぼっちに差し替え、他は触
