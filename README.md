# 名前変えゲーム - 投票アプリ

## 概要
参加者がMetapageなどで名前を変更し、他の参加者がその変更後の名前が誰の本名なのかを推測するゲームアプリです。

## 技術スタック
- **フロントエンド**: HTML5, CSS3 (Material Design 3.0), JavaScript (ES6+)
- **バックエンド**: Supabase (PostgreSQL + リアルタイム機能)
- **デザインシステム**: Material Design 3.0
- **アイコン**: Material Icons

## プロジェクト構造

```
name_change_game/
├── index.html              # メインアプリケーション
├── results.html            # 結果表示ページ
├── config.js               # 設定ファイル
├── supabase-client.js      # Supabaseクライアント
├── styles/                 # CSSスタイルシート
│   ├── material-design.css # Material Design基本スタイル
│   ├── typography.css      # タイポグラフィ
│   ├── components.css      # UIコンポーネント
│   ├── buttons.css         # ボタンスタイル
│   ├── forms.css          # フォーム要素
│   └── responsive.css      # レスポンシブデザイン
└── js/                     # JavaScriptモジュール
    ├── app.js              # メインアプリケーション
    ├── gamemaster.js       # ゲームマスター機能
    ├── room-manager.js     # ルーム管理
    ├── name-manager.js     # 名前管理
    ├── voting-manager.js   # 投票機能
    ├── results-manager.js  # 結果管理
    ├── step-manager.js     # ステップ進行管理
    ├── realtime-manager.js # リアルタイム更新
    └── ui-manager.js       # UI管理
```

## 機能

### ゲームマスター機能
1. **ルーム作成**: 一意のルームIDでゲームルームを作成
2. **URL共有**: 参加者用のURLを生成・共有
3. **名前登録**: 参加者の元の名前と変更後の名前を登録
4. **投票制御**: 投票の開始・終了、時間制限設定
5. **結果確認**: 投票結果の確認と詳細表示

### 参加者機能
1. **自動参加**: 共有URLからの自動ルーム参加
2. **名前確認**: 登録された変更後の名前一覧の確認
3. **投票**: 各変更後の名前に対する推測投票
4. **結果確認**: 投票結果の確認

### リアルタイム機能
- 名前リストの即座の更新
- 投票状態の同期
- 投票結果のリアルタイム反映

## Material Design 3.0 実装

### カラーシステム
- Primary: #6750A4 (紫系)
- Success: #00C853 (緑系)
- Error: #BA1A1A (赤系)
- Surface: #FFFBFE (ライト系背景)

### タイポグラフィ
- Headline Large/Medium/Small
- Title Large/Medium
- Body Large/Medium
- Label Large

### コンポーネント
- Material Design準拠のボタン、カード、フォーム
- Elevation（影）システム
- Material Iconsの活用

## コード構造

### モジュール設計
各機能を独立したJavaScriptモジュールに分割:

- **AppState**: グローバル状態管理
- **GameMaster**: ゲームマスター専用機能
- **RoomManager**: ルーム参加・状態管理
- **NameManager**: 名前の追加・削除・表示
- **VotingManager**: 投票機能・タイマー管理
- **ResultsManager**: 結果計算・詳細表示
- **StepManager**: ゲーム進行ステップ管理
- **RealtimeManager**: Supabaseリアルタイム機能
- **UI**: メッセージ表示・画面切り替え

### CSS設計
Material Design原則に基づく機能別CSS分割:

- CSS変数による統一されたデザイントークン
- コンポーネントベースのスタイル構造
- デスクトップ最適化レスポンシブデザイン

## セットアップ

### 1. Supabaseプロジェクトの設定

1. [Supabase](https://supabase.com/)でプロジェクトを作成
2. 以下のテーブルを作成:

#### rooms テーブル
```sql
CREATE TABLE rooms (
  id VARCHAR(8) PRIMARY KEY,
  voting_active BOOLEAN DEFAULT FALSE,
  voting_end_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### changed_names テーブル
```sql
CREATE TABLE changed_names (
  id SERIAL PRIMARY KEY,
  room_id VARCHAR(8) REFERENCES rooms(id) ON DELETE CASCADE,
  changed_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### original_names テーブル
```sql
CREATE TABLE original_names (
  id SERIAL PRIMARY KEY,
  room_id VARCHAR(8) REFERENCES rooms(id) ON DELETE CASCADE,
  original_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### votes テーブル
```sql
CREATE TABLE votes (
  id SERIAL PRIMARY KEY,
  room_id VARCHAR(8) REFERENCES rooms(id) ON DELETE CASCADE,
  changed_name_id INTEGER REFERENCES changed_names(id) ON DELETE CASCADE,
  selected_original_name VARCHAR(100) NOT NULL,
  voter_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(room_id, changed_name_id, voter_id)
);
```

### 2. 環境変数の設定

`script.js`の以下の部分を実際のSupabaseプロジェクトの値に置き換えてください：

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

### 3. Row Level Security (RLS) の設定

セキュリティのため、各テーブルにRLSポリシーを設定してください：

```sql
-- rooms テーブル
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read rooms" ON rooms FOR SELECT USING (true);
CREATE POLICY "Anyone can insert rooms" ON rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update rooms" ON rooms FOR UPDATE USING (true);

-- name_pairs テーブル
ALTER TABLE name_pairs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read name_pairs" ON name_pairs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert name_pairs" ON name_pairs FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete name_pairs" ON name_pairs FOR DELETE USING (true);

-- votes テーブル
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read votes" ON votes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert votes" ON votes FOR INSERT WITH CHECK (true);
```

## 使い方

### ゲームマスター

1. 「ゲームマスター」ボタンをクリック
2. 自動生成された共有URLを参加者に送信
3. 「元の名前」リストを作成（参加者の変更前の名前）
4. 「変更後の名前」リストを作成（参加者がMetapageで変更した名前）
5. 「投票開始」ボタンで投票を開始
6. 「投票終了」ボタンで投票を終了し、結果を確認

### 参加者

1. **事前準備**: Metapage内で自分の名前を変更
2. 共有URLにアクセス、または「参加者」ボタンをクリックしてルームIDを入力
3. 「変更後の名前」一覧を確認
4. 投票開始後、各「変更後の名前」に対して「元の名前（誰だと思うか）」を選択
5. 「投票する」ボタンで投票を送信
6. 投票終了後、結果を確認

## 開発

### ローカルでの実行

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm start
```

### デプロイ

```bash
# GitHub Pagesにデプロイ
npm run deploy
```

## セキュリティ考慮事項

- 個人情報は一切収集しません
- 投票は匿名で行われます
- 重複投票はセッションベースで防止されます
- SupabaseのRLSによりデータアクセスが制御されます

## ライセンス

MIT License