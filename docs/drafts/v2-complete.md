# v2 (Phase 7) 完成ドラフト

## 追加機能サマリ

### 7-1: 設定画面 ✅
- ScreenshotOne / ScrapingBee / カスタムプロキシ / なし の選択UI
- APIキー入力（localStorageに永続化）
- リクエスト間隔スライダー（1-10秒）
- robots.txt 遵守チェックボックス
- ボット対策回避の説明表示

### 7-2: スクリーンショット取得API統合 ✅
- ScreenshotOne API: スクリーンショットのみ（シンプル）
- ScrapingBee API: スクショ + HTML取得（ボット対策回避対応、レジデンシャルプロキシ）
- カスタムプロキシ: 自前サーバー経由
- バッチ取得: レート制限付き一括取得、プログレス表示

### 7-3: NodeDetailPanel拡充 ✅
- スクリーンショット表示（クリックで拡大）
- ページメタ情報（title, description, h1, OGP）
- DOM構造ツリー表示（セマンティックタグのみ抽出）
- ビジュアルパターングループ表示
- 個別ページのスクショ取得ボタン
- リトライボタン（取得失敗時）

### 7-4: DOM/HTML構造取得 ✅
- HTMLからセマンティックタグ構造を抽出
- DOM fingerprint（ハッシュ）生成
- DOMParser使用（クライアントサイド完結）

### 7-5: 画像比較でパターン再分類 ✅
- pHash（知覚ハッシュ）: 高速フィルタリング
- SSIM（構造的類似度）: 精密比較
- ピクセルレベル差分: 補助判定
- 全てCanvas APIベース（外部ライブラリ不要）

### 7-6: DOM構造比較でパターン精度向上 ✅
- Jaccard類似度によるDOM構造比較
- 構造的シグネチャによるクイック比較
- CSSセレクタフィンガープリント
- DOM類似度でのグルーピング

### 7-7: ボット対策回避ロジック ✅
- robots.txt 解析・遵守（キャッシュ付き）
- エクスポネンシャルバックオフ（403/429検知時）
- ScrapingBee premium_proxy（レジデンシャルプロキシ）
- 設定可能なリトライ回数
- ブロック検知時の明確なエラー表示
- 個別リトライ機能

### 7-8: テスト ✅
- dom-comparator.test.ts: 6テスト
- robots-parser.test.ts: 5テスト
- image-comparator.test.ts: 6テスト
- **合計: 86テスト全パス**

## ビジュアルパターン分類パイプライン

```
スクリーンショット取得（API経由）
  ↓ robots.txt チェック
  ↓ レート制限遵守
  ↓ リトライ + バックオフ
  ↓
pHash 高速フィルタリング（類似度85%+）
  ↓
SSIM 精密比較（類似度75%+）
  ↓
DOM構造比較（類似度60%+、画像なしの場合も対応）
  ↓
VisualPatternGroup[] → UI表示
```

## ボット対策回避の仕組み

| レベル | 対策 | 実装 |
|--------|------|------|
| 基本 | robots.txt遵守 | robots-parser.ts |
| 基本 | レート制限 | 設定可能な間隔（デフォルト2秒） |
| API経由 | レジデンシャルプロキシ | ScrapingBee premium_proxy |
| API経由 | JS実行待ち | wait=2000ms |
| API経由 | 広告/トラッカーブロック | block_ads, block_trackers |
| リトライ | エクスポネンシャルバックオフ | 2s → 4s → 8s |
| UI | ブロック表示 | 「robots.txtにより禁止」等 |
| UI | 個別リトライ | ボタンクリックで再取得 |

## 新規ファイル一覧

- `src/types/screenshot.ts` - スクショ関連の型定義
- `src/utils/robots-parser.ts` - robots.txt解析
- `src/utils/screenshot-service.ts` - スクショ取得サービス
- `src/utils/image-comparator.ts` - 画像比較（pHash, SSIM, PixelDiff）
- `src/utils/dom-comparator.ts` - DOM構造比較
- `src/utils/visual-pattern-detector.ts` - ビジュアルパターン分類
- `src/store/screenshot-store.ts` - スクショ状態管理
- `src/components/SettingsPanel.tsx` - 設定画面

## リポジトリ
- GitHub: https://github.com/ttikoantt/sitemap-visualizer (private)
