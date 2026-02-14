# Sitemap Visualizer

CSV/ExcelのURLリストをインポートして、インタラクティブなサイトマップを自動生成するWebアプリケーションです。

## 特徴

- **案件管理** — リポジトリ内にCSVを配置、ディレクトリで案件を分けてWeb UIから切替
- **ドラッグ&ドロップ**でCSV/Excelファイルを直接読み込みも可能
- **ツリー構造で可視化** — Miro/Figmaのようなスムーズなズーム・パン操作
- **ページパターン自動検出** — 一覧/詳細/固定/ページネーションを自動判定し、色分け＋日本語で理由を表示
- **スクリーンショット自動取得** — GitHub Actions + Playwright でスクショ・メタ情報・DOM構造を自動取得（APIキー不要）
- **ビジュアルパターン分類** — 画像比較（pHash/SSIM）とDOM構造比較でページを自動グルーピング
- **GitHub Pages対応** — 静的SPAとしてデプロイ可能

## セットアップ

```bash
git clone git@github.com:ttikoantt/sitemap-visualizer.git
cd sitemap-visualizer
npm install
npm run dev
```

ブラウザで `http://localhost:5173/sitemap-visualizer/` が開きます。

## 使い方

### 1. 案件の選択

起動すると登録済みの案件一覧がドロップダウンに表示されます。案件を選択して「読み込み」ボタンを押すと、サイトマップが生成されます。

CSVファイルのドラッグ&ドロップでも直接読み込めます。

### 2. サイトマップの操作

| 操作 | 方法 |
|------|------|
| ズーム | マウスホイール / ピンチ |
| パン（移動） | ドラッグ |
| ノード選択 | クリック |
| 全体表示 | 右下のコントロールボタン |

### 3. パターンの確認

ノードをクリックすると右パネルに詳細が表示されます：

- **パス** — 完全なURLパス
- **ページタイプ** — 一覧 / 詳細 / 固定 / ページネーション
- **URLパターン** — `/products/{id}` のようなパターン表記
- **判定理由** — なぜそのタイプと判定されたかの説明
- **スクリーンショット** — Playwrightで自動取得した画像（取得済みの場合）
- **メタ情報** — title, description, h1, OGP
- **DOM構造** — セマンティックタグの構造ツリー

### 4. レイアウト切替

ツールバーの「縦」「横」ボタンでツリーの展開方向を切り替えられます。

### 5. スクリーンショット

スクリーンショットはGitHub Actionsで自動的に取得されます（APIキー不要）。

- **自動実行**: CSVファイルを更新してプッシュすると自動トリガー
- **手動実行**: GitHub Actions タブ → Take Screenshots → Run workflow
- **ローカル実行**: `npm run screenshots`

スクショ取得後、ツールバーの「ビジュアル分類」ボタンで画像/DOM比較によるパターン再分類が実行できます。

## 案件の追加方法

1. `public/data/{案件ID}/` ディレクトリを作成
2. `urls.csv` を配置（`url` ヘッダー付き）
3. `public/data/index.json` に追記:

```json
{
  "projects": [
    { "id": "example-com", "name": "Example.com", "description": "サンプル" },
    { "id": "new-project", "name": "New Project", "description": "新規案件" }
  ]
}
```

4. プッシュ → GitHub Actionsでスクショ自動生成 → デプロイ

### ディレクトリ構成

```
public/data/
├── index.json              # 案件一覧
├── example-com/
│   ├── urls.csv            # URLリスト
│   ├── screenshots/        # Playwright生成画像
│   └── screenshots.json    # マニフェスト
└── another-project/
    ├── urls.csv
    ├── screenshots/
    └── screenshots.json
```

## 技術スタック

| 技術 | 用途 |
|------|------|
| React + TypeScript + Vite | フレームワーク |
| @xyflow/react (React Flow) | インタラクティブキャンバス |
| elkjs (ELK.js) | ツリーレイアウト計算 |
| papaparse | CSV解析 |
| xlsx (SheetJS) | Excel解析 |
| zustand | 状態管理 |
| Playwright | スクリーンショット取得 (CI) |
| vitest | テスト |

## 開発

```bash
# テスト実行
npm test

# テスト（ウォッチモード）
npm run test:watch

# ビルド
npm run build

# スクリーンショット生成（ローカル）
npm run screenshots

# Lint
npm run lint
```

## プロジェクト構造

```
src/
├── components/              # UIコンポーネント
│   ├── ProjectSelector.tsx      # 案件選択ドロップダウン
│   ├── FileUploader.tsx         # D&Dアップロード
│   ├── SitemapCanvas.tsx        # React Flowキャンバス
│   ├── URLNode.tsx              # カスタムノード（箱）
│   ├── NodeDetailPanel.tsx      # 右パネル（詳細表示）
│   ├── PatternLegend.tsx        # 凡例
│   ├── ToolbarControls.tsx      # ツールバー
│   ├── SettingsPanel.tsx        # SS情報表示
│   └── EmptyState.tsx           # 初期画面
├── store/                   # 状態管理
│   ├── sitemap-store.ts         # メインストア（案件管理含む）
│   └── screenshot-store.ts      # SSマニフェスト管理
├── utils/                   # コアロジック
│   ├── url-parser.ts            # URL解析・正規化
│   ├── tree-builder.ts          # ツリー構築（Trie）
│   ├── pattern-detector.ts      # パターン検出
│   ├── layout-engine.ts         # ELKレイアウト
│   ├── file-parser.ts           # CSV/Excel読込
│   ├── project-loader.ts        # 案件・マニフェスト読込
│   ├── image-comparator.ts      # 画像比較（pHash/SSIM）
│   ├── dom-comparator.ts        # DOM構造比較
│   └── visual-pattern-detector.ts # ビジュアル分類
├── types/                   # 型定義
└── constants/               # 定数
scripts/
└── take-screenshots.ts      # Playwrightスクショスクリプト
```

## デプロイ（GitHub Pages）

1. リポジトリの **Settings → Pages** を開く
2. **Source** を **GitHub Actions** に設定
3. `main` ブランチにプッシュすると自動デプロイ

## ライセンス

Private
