---
title: RefsとDOMアクセス
---

# RefsとDOMアクセス

Effuseの宣言的モデルは、ほとんどのDOM更新を自動的に処理しますが、フォーカスの管理、メディアの再生、サードパーティライブラリとの統合など、基礎となるDOM要素に直接アクセスする必要がある場合があります。Effuseは、**Refオブジェクト**と**Refコールバック**という2つの方法を提供します。

## Refオブジェクト

`createRef`関数は、DOM要素を保持できるミュータブルなrefオブジェクトを作成します。

```tsx
import { createRef, onMount } from '@effuse/core';

const MyComponent = define({
  script: () => {
    // 型付きのrefを作成
    const inputRef = createRef<HTMLInputElement>();

    onMount(() => {
      // .current経由で要素にアクセス
      inputRef.current?.focus();
    });

    return { inputRef };
  },
  template: ({ inputRef }) => (
    <input ref={inputRef} />
  )
});
```

### リアクティブなサブスクリプション

他のフレームワークの標準的なrefとは異なり、Effuseの`createRef`では変更を**サブスクライブ（購読）**することができます。これは、要素のマウントやアンマウントを追跡するのに便利です。

```tsx
const boxRef = createRef<HTMLDivElement>();

// 要素が変更される（マウント/アンマウントされる）とコールバックが発火します
boxRef.subscribe((el) => {
  if (el) {
    console.log('要素がマウントされました:', el);
    // ここでオブザーバーをアタッチできます（例: ResizeObserver）
  } else {
    console.log('要素がアンマウントされました');
  }
});
```

## Refコールバック

より細かい制御が必要な場合は、`ref`属性に関数を直接渡すことができます。この関数は、要素がマウントされたときにDOM要素とともに呼び出され、アンマウントされたときに`null`とともに呼び出されます。

```tsx
import type { RefCallback } from '@effuse/core';

const handleInputRef: RefCallback<HTMLInputElement> = (el) => {
  if (el) {
    console.log('Inputがマウントされました');
    el.focus();
  }
};

// テンプレート内:
<input ref={handleInputRef} />
```

## ベストプラクティス

- **過度な使用を避ける**: フォーカス、スクロール、メディア再生、計測などの命令的なアクションにのみrefを使用してください。
- **クリーンアップ**: refコールバックやサブスクリプションでイベントリスナーやオブザーバーをアタッチする場合は、適切にクリーンアップしてください。
