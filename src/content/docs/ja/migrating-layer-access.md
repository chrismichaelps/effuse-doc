---
title: レイヤーアクセスの移行
---

# レイヤーアクセスの移行

このガイドでは、既存のアプリケーションを文字列によるグローバルアクセスから、
具体的なレイヤー参照とローカルエイリアスへ移行します。互換 API は引き続き利用
できるため、段階的に移行できます。

## 目標とするモデル

```tsx
const app = await createApp(App).useLayers([AuthLayer]);

const Profile = define({
  layers: { auth: AuthLayer } as const,
  script({ layers: { auth } }) {
    return {
      user: auth.service('auth').currentUser(),
      session: auth.prop('session'),
    };
  },
  template: ({ user }) => <p>{user?.name}</p>,
});
```

初期化はコンポジションルートが所有します。ローカルエイリアスはコンポーネントが
所有します。具体的なレイヤーオブジェクトが、両者のあいだでサービスと props の型
を運びます。

## 1. `provides` を `services` に改名する

変更前:

```ts
defineLayer({
  name: 'auth',
  provides: { auth: () => authService },
});
```

変更後:

```ts
export const AuthLayer = defineLayer({
  name: 'auth',
  services: { auth: () => authService },
});
```

`provides` は互換用のエイリアスとして残ります。同じ機能に対して `provides` と
`services` を混在させないでください。

## 2. 文字列によるサービスアクセスを置き換える

変更前:

```ts
script({ useStore, useService }) {
  const auth = useStore('auth');
  const session = useService('session');
}
```

変更後:

```ts
layers: { auth: AuthLayer } as const,
script({ layers: { auth } }) {
  const authService = auth.service('auth');
  const session = auth.prop('session');
}
```

移行期の限定的な呼び出しでは、`useService(AuthLayer, 'auth')` によりローカル
エイリアスを追加せずに具体的なレイヤーの型付けを保てます。コンポーネントが複数の
レイヤーメンバーを利用する場合は、エイリアスレコードが推奨される形です。

## 3. hook の依存関係を置き換える

変更前:

```ts
defineHook({
  deps: ['auth'],
  setup({ layerProvider }) {
    return layerProvider('auth');
  },
});
```

変更後:

```ts
defineHook({
  layers: { auth: AuthLayer } as const,
  setup({ layers: { auth } }) {
    return auth.service('auth');
  },
});
```

これにより hook とコンポーネントは、同じ依存関係の語彙と、同じレイヤー未登録時の
診断を共有します。

## 4. レジストリ拡張を削除する

すべての利用側が具体的なレイヤーオブジェクトから契約を推論するようになったら、
`EffuseLayerRegistry` の宣言を削除します。未移行の文字列呼び出しが残っている
あいだだけ拡張を維持してください。

## 5. サーバー処理を所有レイヤーへ移す

切り離されたハンドラーを `server.api` または `server.actions` に移すか、既存の
ファイルを `fromServerFiles` で適合させます。これによりサーバーハンドラーは、
コンポーネントが使うのと同じサービスを推論し、`createLayerServerManifest` にも
現れるようになります。

## 6. コンポジションルートを検証する

宣言されたすべての利用側レイヤーは、クライアントのマウントまたはサーバーの
リクエスト処理より前に登録されている必要があります。移行中はネストされたルートと
遅延ルートを実際に動かしてください。バインディングが欠けている場合、Effuse は
コンポーネント名または hook 名、エイリアス、具体的なレイヤー名、そして登録方法を
報告します。

## 移行チェックリスト

- [ ] 各ドメインが 1 つの具体的なレイヤーオブジェクトをエクスポートしている。
- [ ] 新しいサービス宣言が `services` を使っている。
- [ ] コンポーネントと hook がエイリアスレコードを使っている。
- [ ] 文字列による `useStore`、`useService`、レイヤー props の呼び出しを削除した。
- [ ] 不要になったレジストリ拡張を削除した。
- [ ] サーバー API とアクションがレイヤーに所有されている、または適合済みである。
- [ ] 同じレイヤーグラフをクライアント、SSR、ハンドラー、マニフェストに渡している。
- [ ] 型チェック、対象テスト、遅延ルートの統合プローブが通っている。
