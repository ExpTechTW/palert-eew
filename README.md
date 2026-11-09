# P-Alert EEW

> [!WARNING]
> **實驗性專案**
>
> 這是用 P-Alert 測站資料做地震預警的實驗程式。2025 年邊跑邊改，Discord 通知的名稱到最後都還掛著「測試」。沒有測試，沒有文件，`core/intensity.js` 和 `core/server.js` 到現在還是空檔案。
>
> 現在開源出來給大家參觀。不保證能跑，也請不要當成實際的防災依據。

## 這是什麼

接收 P-Alert 測站的即時 PGA 資料，用 STA/LTA 判斷測站觸發，分群成地震事件，再用網格搜尋估算震央、深度和規模，把結果發到 Discord。

| 檔案 | 做什麼 |
|---|---|
| `core/data/realtime.js` | 從 WebSocket 接收測站即時資料 |
| `core/data/replay.js` | 重播模式，從 `data/` 讀歷史資料 |
| `core/trigger.js` | STA/LTA 測站觸發 |
| `core/eq.js` | 事件分群、凍結異常測站、判斷是否發布 |
| `core/search.js` | 網格搜尋定位、估計規模 |
| `core/eew.js` | 發布各報與最終報，事件結束後存到 `history/` |
| `utils/loc.js` | 由經緯度查鄉鎮或海域名稱 |
| `resource/station.csv` | 測站清單 |

## 歷史

**2025/02/02 ~ 2025/06/14**，一共 36 個 commit，其中 34 個在第一個月。

| 時間 | 發生了什麼 |
|---|---|
| 2025/02/02 | 第一個 commit |
| 2025/06/14 | 最後一個 commit |
| 2026/11/09 | 去敏後開源 |

開源前已經把 Webhook 和資料來源網址都換成環境變數，舊的 git 歷史沒有一起公開。

## 跑起來（如果你堅持）

```bash
cp .env.example .env   # 填入需要的值
bun install
bun index.js
```

或是用 `Dockerfile`。

`config.js` 可以切換 `side`（`LOCAL` / `SERVER`）和 `mode`（`ONLINE` / `REPLAY`）。

資料來源沒有附在這個 repo 裡，`PALERT_WS_URL` 要自己提供。連線後程式會送出 `{"type":"subscribe","data":"station"}`，伺服器要持續回傳這種格式，超過 5 秒沒有訊息就會重新連線：

```json
{ "type": "PGA", "data": { "timestamp": "2025-02-02T00:00:00.000Z", "dataVals": { "W102": 0.12 } } }
```

`REPLAY` 模式則是從 `data/*.json` 讀取，每個檔案的內容就是上面 `data` 那一層。

沒填 Webhook 不會當掉，只是每次要發送時會印出錯誤。

## 授權

[AGPL-3.0](LICENSE)
