---
title: サーバー API とアクション
---

# サーバー API とアクション

Effuse のサーバー機能はレイヤーグラフを拡張します。1 つの機能が、そのサービス、
HTTP ルート、アクション、バリデーション、失敗、ミドルウェア、メタデータ、
マニフェストのエントリ、クライアント契約を 1 つの定義の中で所有します。

## API ルート

```ts
import { defineLayer, LayerServerError } from '@effuse/core';

export const UsersLayer = defineLayer({
  name: 'users',
  services: {
    users: () => ({
      find: (id: string) => ({ id, name: 'Chris' }),
      create: (name: string) => ({ id: crypto.randomUUID(), name }),
    }),
  },
  server: {
    api: {
      '/api/users/[id]': {
        GET: ({ params, services }) => {
          const user = services.users.find(params.id);
          if (!user) {
            throw new LayerServerError('USER_NOT_FOUND', 'User not found.', {
              status: 404,
              details: { id: params.id },
            });
          }
          return user;
        },
      },
    },
  },
});
```

ハンドラーは、リクエスト URL、params、query、レイヤーのサービス、すべての
サービスバッグ、ボディリーダー、バリデーション、レスポンスヘルパー、リクエスト
コンテキストを受け取ります。プレーンオブジェクトは JSON としてシリアライズされ、
`Response` はそのまま通過します。

## バリデーションとフォーム

バリデーターは関数でも、`parse` または `safeParse` を持つスキーマオブジェクトでも
構いません。

```ts
const parseLogin = (value: unknown): { email: string; password: string } => {
  const input = value as Record<string, unknown>;
  if (
    !input ||
    typeof input.email !== 'string' ||
    typeof input.password !== 'string'
  ) {
    throw new Error('email and password are required');
  }
  return { email: input.email, password: input.password };
};

export const AuthLayer = defineLayer({
  name: 'auth',
  services: {
    auth: () => ({
      login: (email: string, password: string) =>
        password === 'secret' ? { id: 'u1', email } : null,
    }),
  },
  server: {
    api: {
      '/api/auth/login': {
        POST: async ({ validate, services, response }) => {
          const input = await validate.formData(parseLogin);
          const user = services.auth.login(input.email, input.password);
          if (!user) {
            return response.error('INVALID_CREDENTIALS', 'Login failed.', {
              status: 401,
            });
          }
          return response.redirect('/dashboard', 303);
        },
      },
    },
  },
});
```

バリデーション失敗は `400` と `EFFUSE_VALIDATION_FAILED`、入力元、正規化された
問題点を返します。ドメインの失敗には `LayerServerError` または
`response.error(code, message, options)` を使います。

## アップロード

```ts
const UploadLayer = defineLayer({
  name: 'uploads',
  server: {
    api: {
      '/api/uploads': {
        POST: async ({ formData, response }) => {
          const data = await formData();
          const file = data.get('file');
          if (!(file instanceof File)) {
            return response.error('FILE_REQUIRED', 'Select a file.', {
              status: 400,
            });
          }
          return { name: file.name, size: file.size, type: file.type };
        },
      },
    },
  },
});
```

Effuse はマルチパートデータを解析しますが、保存先は選びません。保存ポリシーを
差し替え可能かつテスト可能に保つため、レイヤーのサービスを通じてファイルを
ストリームまたは永続化してください。

## アクション

アクションは、公開ルートの形を必要としないドメインの更新処理のための、レイヤー
スコープの POST 操作です。

```ts
export const CartLayer = defineLayer({
  name: 'cart',
  services: {
    cart: () => ({ refresh: () => ({ total: 42 }) }),
  },
  server: {
    actions: {
      refresh: ({ services }) => services.cart.refresh(),
    },
  },
});

const cartActions = createLayerActionClient(CartLayer);
const cart = await cartActions.refresh();
```

アクションの URL にはレイヤー名が含まれます。

```text
/_effuse/actions/cart/refresh
```

そのため、2 つのレイヤーが同じローカル名のアクションを持っても衝突しません。

```ts
const authActions = createLayerActionClient(AuthLayer);
const billingActions = createLayerActionClient(BillingLayer);

await authActions.refresh();
await billingActions.refresh();
```

スコープなしの従来のアクション URL は互換性のために残っています。新しい
クライアントでは、アクションの所有関係を明示するために、レイヤーオブジェクトか
マニフェストクライアントを使ってください。

## マニフェストと型付きクライアント

```ts
const manifest = createLayerServerManifest([UsersLayer, CartLayer]);
const client = createLayerServerManifestClient(manifest, {
  baseUrl: 'https://example.com',
});

await client.route('/api/users/[id]', {
  method: 'GET',
  params: { id: 'u1' },
});

await client.action('cart', 'refresh');
```

リテラルのマニフェストは、レイヤー名、アクション、ルートパス、メソッド、params
を制約します。`generateLayerServerClientModule` は、マニフェスト、ファクトリー、
推論されたクライアント型を含む決定的なモジュールを出力します。

## ファイルシステムアダプター

Next 風のフォルダー構成を好むチームは、それをレイヤーにマッピングできます。

```ts
import {
  defineLayer,
  fromServerFiles,
  type ServerActionFileModule,
  type ServerApiFileModule,
} from '@effuse/core';

const files = import.meta.glob<ServerApiFileModule | ServerActionFileModule>(
  ['/src/server/api/**/*.ts', '/src/server/actions/**/*.ts'],
  { eager: true }
);

export const AppServerLayer = defineLayer({
  name: 'app-server',
  server: fromServerFiles(files),
});
```

既定のルートには `src/server/api`、`app/api`、`src/api`、`src/server/actions`、
`app/actions`、`src/actions` が含まれます。ブラケットの params とルートグループは、
同じ実行時マッチャーとマニフェストにマッピングされます。重複または曖昧な
ファイルはマニフェストの診断になります。

このフォルダー規約は入力アダプターです。レイヤーとは別の 2 つ目のサーバー
ランタイムを作るものではありません。

## リクエストパイプライン

```text
リクエスト
  -> ルートのマッチング
  -> 依存順に並んだレイヤーミドルウェア
  -> ルート/アクションのミドルウェア
  -> バリデーションとハンドラー
  -> メタデータによるレスポンスポリシー
  -> トレースイベント
  -> サーバーエンドポイントが一致しない場合は SSR へフォールバック
```

ルートとアクションのメタデータは、キャッシュ、CORS、ランタイム、リージョン、
実行時間、独自のポリシーデータに対応します。可観測性フックは安定したサーバー
トレースイベントを受け取り、シンクの失敗がアプリケーションのレスポンスを
置き換えることはありません。

## 本番運用のルール

1. ルートとアクションは、そのサービスを所有するレイヤーと同じ場所に置く。
2. 信頼できないリクエストデータは、ハンドラーの境界で検証する。
3. エラー文字列を解析するのではなく、構造化されたドメインエラーを返す。
4. ドメイン間で名前が重複する場合は、スコープ付きのアクションクライアントを使う。
5. fetch のパスを複製せず、マニフェストからクライアントを生成する。
6. ファイルルートはレイヤーの入力として扱い、CI でマニフェストの診断を確認する。
7. アップロード、永続化、認証、テレメトリーはサービスの背後に置く。

## 次のステップ

- [レイヤーアクセスの移行](/docs/migrating-layer-access)
- [Props](/docs/props)
- [なぜ Effuse なのか](/docs/why-effuse)
