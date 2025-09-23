# 宮治研究室 相模原祭制作 チームD 「CANDY CAMERA.」

このプロジェクトは、以下の技術スタックを使用して構築されています：

- **Next.js 15** (App Router) - React フレームワーク
- **TypeScript** - 型安全性
- **Tailwind CSS** - スタイリング
- **Supabase** - バックエンド・データベース
- **Prisma** - 型安全な ORM 兼クエリビルダー
- **MediaPipe Hands** - ハンド検出・トラッキング

## 機能

- 📱 **リアルタイムハンド検出**: WebカメラからMediaPipe Handsを使用して手の動きを検出
- 🍭 **リンゴ飴合成**: ハンド検出結果に基づきキャンディ画像を合成
- 🗄️ **データベース統合**: Supabase + Prisma でのデータ永続化
- 🎯 **型安全**: TypeScript と Prisma による完全な型安全性

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env` ファイルをプロジェクトルートに作成して、チームのNotionにあるSupabaseプロジェクトの情報を設定してください：

### 3. データベースマイグレーション

```bash
# Prisma Client を生成
npx prisma generate

# seedファイル を実行
npx prisma db seed
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
- `npx prisma generate` - Prisma Client を生成
- `npx prisma db seed` - シードデータを投入
- `npx prisma studio` - Prisma Studio を起動（データベース管理UI）

## 撮影フロー概要

1. ブラウザでアプリケーションにアクセスし、カメラの使用を許可
2. 表示されるモーダルから背景画像を選択（後から再選択も可能）
3. 手を認識させてリンゴ飴が手の位置に合成されるのを確認
4. 「写真を撮る」で背景・人物・リンゴ飴を合成したプリクラ風画像を生成
5. 保存確認ダイアログからそのまま保存操作へ進むと Supabase にアップロードされ、ダウンロード画面へ遷移
