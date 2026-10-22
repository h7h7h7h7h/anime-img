# anime-img 引き継ぎメモ v3

## 目的
無検閲のアニメ画像生成(RunPod+ComfyUI)を、チャットとスマホのタップだけで回す。

## 窓口(GETのみ。POSTは不可)
https://little-frost-d979.sute-trial174.workers.dev/
使えるdo: status start stop rebuild ready gen img last file loras push save get deploy

## スマホ用ブックマーク
状態 ?do=status
起動 ?do=start
起動確認 ?do=ready
停止 ?do=stop
作り直し ?do=rebuild
LoRA一覧 ?do=loras
直近画像 ?do=file&name= (?do=last の戻り値)

## 生成の流れ
1 ?do=gen&p=プロンプト&lora=bocchi_gotoh_xl.safetensors&lw=0.75&w=832&h=1216
  → prompt_id が返る
2 ?do=img&id=prompt_id → done と files
3 ?do=push&name=ファイル名 → GitHubへ自動アップ、jsdelivr URL が返る

## いまの最優先課題
作り直したPodに起動コマンド(dockerArgs)が無く、ComfyUIが起動しない。
8888のJupyterだけが動く(8188は502)。
暫定回避: RunPodのConnectタブからJupyterを開き、ターミナルで
  cd /workspace/ComfyUI && nohup setsid python main.py --listen 0.0.0.0 --port 8188 > /tmp/c.log 2>&1 &
根本解決: worker.js を自己完結版に書き直して save → deploy

## 構成
Pod名 uncertain_purple_silkworm / dc US-IL-1 / RTX4090
ボリューム anime-sdxl dwti9uqtpb を /workspace
image runpod/pytorch:2.2.0-py3.10-cuda12.1.1-devel-ubuntu22.04
モデル waiIllustriousSDXL_v70.safetensors
LoRA bocchi_gotoh_xl.safetensors lw0.75
repo h7h7h7h7h/anime-img public
env RUNPOD_API_KEY POD_NAME DATACENTER GPU_TYPE GITHUB_REPO GITHUB_TOKEN CF_ACCOUNT CF_TOKEN
KV binding BOT
worker.sute-trial174 は旧フロント。1042(自分をfetch)で壊れてる

## サンドボックスは完全に密閉(重要)
- fetch / no-cors / script / img / JSONP / iframe遷移 / window.open / form送信 すべて不可
- JSは動くので長いURLは正確に作れる。ただし外に出す手段が無い
- 唯一読めるのは jsdelivr/unpkg/cdnjs/esm.sh の画像とスクリプト

## 確実な方法(この順で使う)
1 チャット本文のリンクをタップ(最短)
2 サンドボックスのtextareaにURLを出し、コピーしてアドレスバーに貼る
3 web_scrape でチャットから直接叩く

## 判明済み(再調査不要)
- サンドボックスの遷移系は全部NG。window.openもformもiframeも不可
- VeniceチャットはPOST不可。GETのみ
- web_scrape はセッションにより Tool not found になる
- CloudflareのURL上限は16KB。コード13225文字なら送信URLは13577文字でOK
- エンコード最小: 空白=%20、+=%2B、改行=%0A、%=%25、&=%26、#=%23、括弧=%28%29
- save/get で日本語とエンコードは往復OK
- 画像はGitHub+jsdelivr経由。base64は使わない
- Podのstartは500(在庫なし)になることがある。rebuildで作り直せば通る

## 運用ルール
- 生成後は必ずPodを止めるか確認。勝手に止めない
- 使わない時は停止(課金)
- ユーザーはターミナル苦手。長いコードは途中で切れる。返答も長いと止める

## 次の一手
1 worker.js自己完結版(rebuildにdockerArgs、?do=ui&auto=1、?do=env)を保存してデプロイ
2 rebuildでComfyUIが自動起動することを確認
3 その後 LoRA / img2img / ControlNet