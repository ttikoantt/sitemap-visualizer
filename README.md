# Sitemap Visualizer

CSV/ExcelのURLリストをインポートして、インタラクティブなサイトマップを自動生成するWebアプリケーションです。

## 特徴

- **ドラッグ&ドロップ**でCSV/Excelファイルを読み込み
- **ツリー構造で可視化** — Miro/Figmaのようなスムーズなズーム・パン操作
- **ページパターン自動検出** — 一覧/詳細/固定/ページネーションを自動判定し、色分け＋日本語で理由を表示
- **スクリーンショット取得** (v2) — 外部APIでページのスクショ・メタ情報・DOM構造を取得
- **ビジュアルパターン分類** (v2) — 画像比較（pHash/SSIM）とDOM構造比較でページを自動グルーピング
- **GitHub Pages対応** — 静的SPAとしてデプロイ可能

## デモ

サンプルデータが内蔵されています。起動後「サンプルデータで試す」ボタンをクリックするだけで動作を確認できます。

## セットアップ

```bash
# リポジトリをクローン
git clone git@github.com:ttikoantt/sitemap-visualizer.git
cd sitemap-visualizer

# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev
```

ブラウザで `http://localhost:5173/sitemap-visualizer/` が開きます。

## 使い方

### 1. URLリストの読み込み

画面中央のアップロードエリアにCSVまたはExcelファイルをドラッグ&ドロップします。

**対応フォーマット:**
- CSV (.csv)
- Excel (.xlsx, .xls)

URL列は自動検出されます（ヘッダーに「url」「URL」「address」「link」等が含まれていればOK）。ヘッダーがない場合も、URLらしき列を自動判定します。

### 2. サイトマップの操作

| 操作 | 方法 |
|------|------|
| ズーム | マウスホイール / ピンチ |
| パン（移動） | ドラッグ |
| ノード選択 | クリック |
| 全体表示 | 右下のコントロールボタン |

### 3. パターンの確認

ノード（URLの箱）をクリックすると右パネルに詳細が表示されます：

- **パス** — 完全なURLパス
- **ページタイプ** — 一覧 / 詳細 / 固定 / ページネーション
- **URLパターン** — `/products/{id}` のようなパターン表記
- **判定理由** — なぜそのタイプと判定されたかの説明
- **セグメント分析** — 各パスセグメントの種類（固定/数値ID/スラッグ等）
- **サンプルURL** — 同じパターンに属するURLの一覧

左下の凡例パネルで、パターンごとの色と件数を確認できます。

### 4. レイアウト切替

ツールバーの「↓ 縦」「→ 横」ボタンでツリーの展開方向を切り替えられます。

### 5. スクリーンショット取得 (v2)

ツールバーの歯車アイコンから設定画面を開き、取得方法を選択します。

| 方法 | 説明 |
|------|------|
| ScreenshotOne | スクリーンショットのみ取得（シンプル） |
| ScrapingBee | スクショ + HTML取得（ボット対策回避対応） |
| カスタムプロキシ | 自前のプロキシサーバー経由 |
| なし | スクショ機能を使わない（デフォルト） |

APIキーを入力後、ツールバーの「全ページスクショ取得」でバッチ取得できます。取得後は「ビジュアル分類」ボタンで画像/DOM比較によるパターン再分類が実行されます。

**設定項目:**
- リクエスト間隔（1〜10秒）
- robots.txt遵守の有無
- APIキー（localStorageに保存）

## 技術スタック

| 技術 | 用途 |
|------|------|
| React + TypeScript + Vite | フレームワーク |
| @xyflow/react (React Flow) | インタラクティブキャンバス |
| elkjs (ELK.js) | ツリーレイアウト計算 |
| papaparse | CSV解析 |
| xlsx (SheetJS) | Excel解析 |
| zustand | 状態管理 |
| vitest | テスト（86件） |

## 開発

```bash
# テスト実行
npm test

# テスト（ウォッチモード）
npm run test:watch

# カバレッジ付きテスト
npm run test:coverage

# ビルド
npm run build

# Lint
npm run lint
```

## プロジェクト構造

```
src/
├── components/          # UIコンポーネント
│   ├── FileUploader.tsx     # D&Dアップロード
│   ├── SitemapCanvas.tsx    # React Flowキャンバス
│   ├── URLNode.tsx          # カスタムノード（箱）
│   ├── NodeDetailPanel.tsx  # 右パネル（詳細表示）
│   ├── PatternLegend.tsx    # 凡例
│   ├── ToolbarControls.tsx  # ツールバー
│   ├── SettingsPanel.tsx    # 設定画面
│   └── EmptyState.tsx       # 初期画面
├── store/               # 状態管理
│   ├── sitemap-store.ts     # メインストア
│   └── screenshot-store.ts  # スクショ設定・状態
├── types/               # 型定義
├── utils/               # コアロジック（純粋関数）
│   ├── url-parser.ts        # URL解析・正規化
│   ├── tree-builder.ts      # ツリー構築（Trie）
│   ├── pattern-detector.ts  # パターン検出
│   ├── layout-engine.ts     # ELKレイアウト
│   ├── file-parser.ts       # CSV/Excel読込
│   ├── screenshot-service.ts # スクショ取得
│   ├── image-comparator.ts  # 画像比較（pHash/SSIM）
│   ├── dom-comparator.ts    # DOM構造比較
│   ├── visual-pattern-detector.ts # ビジュアル分類
│   └── robots-parser.ts     # robots.txt解析
└── constants/           # 定数（カラーパレット等）
```

## デプロイ（GitHub Pages）

1. リポジトリの **Settings → Pages** を開く
2. **Source** を **GitHub Actions** に設定
3. `main` ブランチにプッシュすると自動デプロイ

## ライセンス

Private
