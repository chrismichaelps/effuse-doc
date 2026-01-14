---
title: Refs 与 DOM 访问
---

# Refs 与 DOM 访问

虽然 Effuse 的声明式模型自动处理大多数 DOM 更新，但有时你需要直接访问底层的 DOM 元素——例如，管理焦点、播放媒体或集成第三方库。Effuse 提供了两种处理 refs 的方式：**Ref 对象** 和 **Ref 回调**。

## Ref 对象

`createRef` 函数创建一个可以保存 DOM 元素的可变 ref 对象。

```tsx
import { createRef, onMount } from '@effuse/core';

const MyComponent = define({
  script: () => {
    // 创建一个带类型的 ref
    const inputRef = createRef<HTMLInputElement>();

    onMount(() => {
      // 通过 .current 访问元素
      inputRef.current?.focus();
    });

    return { inputRef };
  },
  template: ({ inputRef }) => (
    <input ref={inputRef} />
  )
});
```

### 响应式订阅

与其他框架中的标准 refs 不同，Effuse 的 `createRef` 允许你 **订阅** 更改。这对于追踪元素何时挂载或卸载非常有帮助。

```tsx
const boxRef = createRef<HTMLDivElement>();

// 当元素发生变化（挂载/卸载）时触发回调
boxRef.subscribe((el) => {
  if (el) {
    console.log('元素已挂载:', el);
    // 你可以在这里附加观察者（例如：ResizeObserver）
  } else {
    console.log('元素已卸载');
  }
});
```

## Ref 回调

为了更精细的控制，你可以直接将函数传递给 `ref` 属性。当 DOM 元素挂载时，此函数会被调用并传入该元素；当卸载时，会传入 `null`。

```tsx
import type { RefCallback } from '@effuse/core';

const handleInputRef: RefCallback<HTMLInputElement> = (el) => {
  if (el) {
    console.log('Input 已挂载');
    el.focus();
  }
};

// 在模板中：
<input ref={handleInputRef} />
```

## 最佳实践

- **避免过度使用**：仅将 refs 用于命令式操作（焦点、滚动、媒体播放）或测量。
- **清理**：如果你在 ref 回调或订阅中附加了事件监听器或观察者，请确保适当地清理它们。
