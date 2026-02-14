# Sitemap Visualizer - 設計書

## アーキテクチャ概要

```
CSV/Excel → file-parser → string[]（URLリスト）
  → url-parser → ParsedURL[]（解析済みURL）
  → tree-builder → URLTreeNode（階層ツリー）
  → pattern-detector → PatternGroup[]（パターングループ + 説明）
  → layout-engine → { nodes[], edges[] }（座標付き）
  → SitemapCanvas（React Flowで描画）
```

### 設計原則
- **純粋関数とUIの分離**: `src/utils/` は全て純粋関数、テスト容易性を最大化
- **Zustand による状態管理**: React Flowの頻繁な再レンダリングに対応するセレクタベースの購読
- **TDD**: テスト先行で全ユーティリティを実装

## コアモジュール

### 1. url-parser.ts
- `parseURL(raw: string): ParsedURL | null`
  - URL正規化、セグメント分割、エンコード文字デコード
- `parseURLList(rawList: string[]): ParsedURL[]`
  - 重複除去、不正URL除外

### 2. tree-builder.ts
- `buildURLTree(urls: ParsedURL[]): URLTreeNode`
  - Trieアルゴリズムでパスセグメントに基づくツリー構築
  - 単一ホスト→ホスト名ルート、複数ホスト→仮想ルート `(root)`

### 3. pattern-detector.ts
- `classifySegment(values: string[]): DynamicSegmentType`
  - 数値ID, UUID, 日付, スラッグ, 混合の分類
- `classifyPageType(node, siblingCount, parentSegment): { pageType, reason }`
  - 一覧/詳細/固定/ページネーション/不明の判定
- `detectPatterns(root: URLTreeNode): PatternGroup[]`
  - ツリー走査で兄弟ノードの動的セグメントを検出
  - MIN_GROUP_SIZE = 2以上で同じ親を持つ動的子ノードをグルーピング

### 4. layout-engine.ts
- `computeLayout(root, patterns, direction): Promise<{ nodes[], edges[] }>`
  - ELK.jsの `mrtree` アルゴリズムでツリーレイアウト計算
  - URLTreeNode → React Flow Node/Edge への変換

### 5. file-parser.ts
- `parseFile(file: File): Promise<string[]>`
  - CSV: Papa Parse、Excel: SheetJS（遅延import）
  - URL列の自動検出

## パターン検出アルゴリズム詳細

### 一覧 vs 詳細の判別

| 条件 | 判定 | 理由 |
|------|------|------|
| 子ノードあり | 一覧/カテゴリ | 子ページを持つ＝インデックスページ |
| 動的セグメント（ID/UUID/スラッグ）で終端、兄弟多数 | 詳細 | パターンの末端＝個別ページ |
| 静的セグメント、兄弟少数 | 固定 | about, contact等 |
| 親が "page" + 数値セグメント | ページネーション | /page/{n} パターン |
| 一覧系キーワード含む | 一覧 | /list, /archive, /category等 |

### なぜ同じパターンと判定されるか

各パターングループの `PatternExplanation` に以下を記録:
- `summary`: 「これらの45件のURLは /products/ の後に数値IDが続くパターンです」
- `pageTypeReason`: 「同じ親配下に45件の動的ページがあるため詳細ページと判定」
- `segments[]`: 各セグメントの位置・タイプ・サンプル値

## コンポーネント構成

| コンポーネント | 責務 |
|---|---|
| App | 状態に応じてEmptyState / Canvas切替 |
| EmptyState | ファイルアップロードUI、サンプルデータボタン |
| FileUploader | D&Dゾーン、ファイルpicker |
| SitemapCanvas | React Flowラッパー、ミニマップ、コントロール |
| URLNode | カスタムノード（箱型カード） |
| NodeDetailPanel | 右サイドバー、パターン詳細表示 |
| PatternLegend | 色凡例オーバーレイ |
| ToolbarControls | レイアウト切替、リセット |

## テスト構成

- `url-parser.test.ts`: 19テスト（URL解析の全エッジケース）
- `tree-builder.test.ts`: 11テスト（ツリー構築の全パターン）
- `file-parser.test.ts`: 11テスト（CSV解析、URL列検出）
- `pattern-detector.test.ts`: 21テスト（パターン検出、ページタイプ分類）
- `layout-engine.test.ts`: 7テスト（レイアウト計算、ノード/エッジ生成）
- **合計: 69テスト**
