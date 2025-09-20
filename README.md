# MediaPipe Hands + Fabric.js + Supabase + Prisma プロジェクト

このプロジェクトは、以下の技術スタックを使用して構築されています：

- **Next.js 15** (App Router) - React フレームワーク
- **TypeScript** - 型安全性
- **Tailwind CSS** - スタイリング
- **Supabase** - バックエンド・データベース
- **Prisma** - 型安全な ORM 兼クエリビルダー
- **MediaPipe Hands** - ハンド検出・トラッキング
- **Fabric.js** - キャンバス描画ライブラリ

## 機能

- 📱 **リアルタイムハンド検出**: WebカメラからMediaPipe Handsを使用して手の動きを検出
- 🎨 **インタラクティブキャンバス**: Fabric.jsを使用した描画・編集機能
- 🗄️ **データベース統合**: Supabase + Prisma でのデータ永続化
- 🎯 **型安全**: TypeScript と Prisma による完全な型安全性

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local` ファイルを編集して、あなたのSupabaseプロジェクトの情報を設定してください：

```env
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# データベース接続
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

### 3. データベースマイグレーション

```bash
# Prisma Client を生成
npm run prisma:generate

# 本番環境など既存の DB にマイグレーションを適用
npm run prisma:migrate
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

アプリケーションが `http://localhost:3000` で起動します。

## 利用可能なスクリプト

- `npm run dev` - 開発サーバーを起動
- `npm run build` - プロダクション用にビルド
- `npm run start` - プロダクションサーバーを起動
- `npm run lint` - ESLintを実行
- `npm run prisma:generate` - Prisma Client を生成
- `npm run prisma:migrate` - マイグレーションを適用
- `npm run prisma:studio` - Prisma Studio を起動（データベース管理UI）

## 使い方

1. ブラウザでアプリケーションにアクセス
2. カメラの使用を許可
3. 左側でハンド検出を確認
4. 右側のキャンバスで描画・編集
5. データはSupabaseデータベースに保存可能

## 環境変数設定

`.env.local` ファイルで以下の値を設定してください：

```env
# あなたのSupabaseプロジェクトの情報に置き換えてください
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_postgres_connection_string
```
