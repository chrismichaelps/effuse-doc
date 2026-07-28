---
title: 迁移层访问方式
---

# 迁移层访问方式

本指南帮助现有应用从基于字符串的全局访问，迁移到具体的层引用与本地别名。兼容 API
仍然保留，因此可以逐步迁移。

## 目标模型

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

组合根负责初始化，组件负责自己的本地别名，具体的层对象在两者之间传递服务与 props
的类型。

## 1. 将 `provides` 改名为 `services`

之前：

```ts
defineLayer({
  name: 'auth',
  provides: { auth: () => authService },
});
```

之后：

```ts
export const AuthLayer = defineLayer({
  name: 'auth',
  services: { auth: () => authService },
});
```

`provides` 仍作为兼容别名保留。不要对同一能力同时使用 `provides` 和 `services`。

## 2. 替换基于字符串的服务访问

之前：

```ts
script({ useStore, useService }) {
  const auth = useStore('auth');
  const session = useService('session');
}
```

之后：

```ts
layers: { auth: AuthLayer } as const,
script({ layers: { auth } }) {
  const authService = auth.service('auth');
  const session = auth.prop('session');
}
```

对于过渡期的少量调用，`useService(AuthLayer, 'auth')` 可以在不引入本地别名的情况下
保留具体层的类型信息。当组件需要使用多个层成员时，别名记录仍是推荐写法。

## 3. 替换 hook 的依赖声明

之前：

```ts
defineHook({
  deps: ['auth'],
  setup({ layerProvider }) {
    return layerProvider('auth');
  },
});
```

之后：

```ts
defineHook({
  layers: { auth: AuthLayer } as const,
  setup({ layers: { auth } }) {
    return auth.service('auth');
  },
});
```

这样 hook 与组件就共享同一套依赖词汇，以及相同的缺失层诊断信息。

## 4. 移除注册表类型扩展

当所有使用方都能从具体的层对象推导出契约后，删除 `EffuseLayerRegistry` 声明。仅在
仍存在未迁移的字符串调用期间保留该扩展。

## 5. 把服务端逻辑移入所属的层

将游离的处理函数迁移到 `server.api` 或 `server.actions`，或使用 `fromServerFiles`
适配已有文件。此后服务端处理函数会推导出与组件相同的服务类型，并出现在
`createLayerServerManifest` 中。

## 6. 检查组合根

每个被声明使用的层，都必须在客户端挂载或服务端处理请求之前完成注册。迁移过程中请
实际运行嵌套路由与懒加载路由；当绑定缺失时，Effuse 会报告组件或 hook 名称、别名、
具体的层名称，以及对应的注册修复方式。

## 迁移检查清单

- [ ] 每个领域导出一个具体的层对象。
- [ ] 新的服务声明使用 `services`。
- [ ] 组件与 hook 使用别名记录。
- [ ] 已移除基于字符串的 `useStore`、`useService` 及层 props 调用。
- [ ] 不再需要时删除了注册表类型扩展。
- [ ] 服务端 API 与操作由层拥有，或已适配进层。
- [ ] 客户端、SSR、请求处理器与清单使用同一份层依赖图。
- [ ] 类型检查、针对性测试与懒加载路由集成探针全部通过。
