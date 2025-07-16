# セットアップガイド

## 1. Supabaseプロジェクトの作成

### 1.1 Supabaseアカウントの作成
1. [Supabase](https://supabase.com/)にアクセス
2. 「Start your project」をクリック
3. GitHubアカウントでサインイン

### 1.2 新しいプロジェクトの作成
1. ダッシュボードで「New project」をクリック
2. プロジェクト名を入力（例：`name-change-game`）
3. データベースパスワードを設定
4. リージョンを選択（Japan (Tokyo)推奨）
5. 「Create new project」をクリック

## 2. データベーステーブルの作成

### 2.1 SQLエディタでテーブルを作成
1. Supabaseプロジェクトのダッシュボードで「SQL Editor」をクリック
2. 新しいクエリを作成
3. `supabase-setup.sql`の内容をコピー＆ペーストして実行

### 2.2 テーブル作成の確認
以下のテーブルが作成されていることを確認：
- `rooms`：ゲームルーム情報
- `name_pairs`：名前ペア情報
- `votes`：投票データ

## 3. APIキーの取得

### 3.1 プロジェクトの設定から取得
1. Supabaseプロジェクトのダッシュボードで「Settings」→「API」をクリック
2. 以下の情報をコピー：
   - Project URL
   - anon public key

### 3.2 設定ファイルの更新
`config.js`ファイルを開き、以下を更新：

```javascript
const CONFIG = {
    supabase: {
        url: 'https://your-project-id.supabase.co',  // ← Project URLに置き換え
        anonKey: 'your-anon-key-here'  // ← anon public keyに置き換え
    },
    // ... その他の設定
};
```

## 4. Row Level Security (RLS) の設定

### 4.1 RLSポリシーの確認
`supabase-setup.sql`に含まれるRLSポリシーが正しく設定されていることを確認：

- 全ユーザーがデータを読み取り可能
- 全ユーザーがデータを挿入可能
- 適切なアクセス制御が設定されている

### 4.2 リアルタイム機能の有効化
1. Supabaseダッシュボードで「Database」→「Replication」をクリック
2. 以下のテーブルでリアルタイム機能を有効化：
   - `rooms`
   - `name_pairs`
   - `votes`

## 5. ローカル開発環境での実行

### 5.1 必要なファイルの配置
プロジェクトディレクトリに以下のファイルがあることを確認：
- `index.html`
- `script.js`
- `supabase-client.js`
- `config.js`
- `package.json`

### 5.2 ローカルサーバーの起動
```bash
# Python 3の場合
python -m http.server 8000

# Node.jsの場合
npx http-server -p 8000
```

### 5.3 アプリケーションの確認
1. ブラウザで `http://localhost:8000` にアクセス
2. 「ゲームマスター」と「参加者」の両方の機能をテスト

## 6. GitHub Pagesでのデプロイ

### 6.1 GitHubリポジトリの作成
1. GitHubで新しいリポジトリを作成
2. ローカルプロジェクトをリポジトリにプッシュ

### 6.2 GitHub Pagesの設定
1. リポジトリの「Settings」→「Pages」をクリック
2. Source を「Deploy from a branch」に設定
3. Branch を「main」に設定
4. 「Save」をクリック

### 6.3 デプロイの確認
数分後、`https://yourusername.github.io/name-change-game/`でアプリケーションが利用可能になります。

## 7. トラブルシューティング

### 7.1 Supabase接続エラー
- config.jsの設定値が正しいか確認
- SupabaseプロジェクトのURLとキーが正しいか確認
- ブラウザの開発者ツールでエラーメッセージを確認

### 7.2 データベースエラー
- テーブルが正しく作成されているか確認
- RLSポリシーが設定されているか確認
- SQLエディタでクエリを手動実行してテスト

### 7.3 リアルタイム機能が動作しない
- Supabaseでリアルタイム機能が有効になっているか確認
- ブラウザのコンソールでWebSocket接続を確認
- 複数のブラウザタブでテスト

## 8. セキュリティ考慮事項

### 8.1 APIキーの管理
- anon keyは公開されても問題ないが、service_role keyは絶対に公開しない
- 本番環境では環境変数を使用してAPIキーを管理

### 8.2 RLSポリシー
- 実際の運用では、より厳密なRLSポリシーを検討
- 悪意のあるユーザーによるデータ改ざんを防ぐ

### 8.3 レート制限
- 必要に応じて、Supabaseのレート制限機能を設定
- 大量のリクエストから保護

## 9. 運用・保守

### 9.1 ログの監視
- Supabaseダッシュボードでログを監視
- エラーやパフォーマンスの問題を早期発見

### 9.2 バックアップ
- Supabaseは自動でバックアップを取得
- 重要なデータは定期的にエクスポート

### 9.3 更新・拡張
- 新機能の追加時は、データベーススキーマの変更に注意
- 既存データへの影響を事前に確認