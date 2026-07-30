---
title: 为什么选择 Effuse
---

# 为什么选择 Effuse

Effuse 面向这样的团队：希望前端代码在组件边界处保持轻量，同时让应用能力保持显式、
类型安全且可测试。

React 提供了广阔的生态，Vue 提供了平易近人的组件体验，Solid 提供了细粒度响应式，
Next 提供了服务端的应用原语。Effuse 应当通过将这些理念中有价值的部分统一到一个契约
之下来证明自己的价值：由层定义应用能力，组件以本地名称使用这些能力，而服务端路由与
操作则与拥有它们的服务放在一起。

## 现有的差距

大多数框架把一个应用拆散到过多互不相连的面上：

| 需求       | 常见的摩擦                                |
| ---------- | ----------------------------------------- |
| 共享服务   | 全局模块、上下文树，或没有类型的注入      |
| 服务端 API | 独立的路由文件，逐渐与服务层脱节          |
| 组件逻辑   | hook 与 import 泛滥，以及隐式的运行时依赖 |
| 响应式     | 粗粒度的重新渲染，或边界不清的编译器魔法  |
| 测试       | 业务能力与 UI 代码通过不同的接缝分别测试  |

Effuse 应当在不让组件代码变重的前提下，把这些边界表达清楚。

## Effuse 的契约

1. 由层拥有能力。
2. 组件与 hook 通过 `layers` 在本地引入能力。
3. 服务的类型由层定义推导而来。
4. 服务端路由与操作声明在拥有相应数据的层上。
5. 细粒度信号只更新依赖它的 UI。

```tsx
const AuthLayer = defineLayer({
  name: 'platformAuth',
  services: {
    auth: () => ({
      currentUser: () => ({ id: 'u1', name: 'Chris' }),
    }),
  },
  server: {
    api: {
      '/api/me': ({ services }) => services.auth.currentUser(),
    },
    actions: {
      refreshSession: ({ services }) => services.auth.currentUser(),
    },
  },
});

const ProfileButton = define({
  layers: { auth: AuthLayer } as const,
  script({ layers: { auth } }) {
    const user = auth.services.auth.currentUser();
    return { user };
  },
  template: ({ user }) => <button>{user.name}</button>,
});
```

层名可以在全局保持唯一（`platformAuth`），而组件可以使用自己想要的本地名称
（`auth`）。这样既保持了应用依赖图的稳定，也让组件代码保持可读。

## 它的价值所在

- 以能力为先的架构：认证、数据、分析、功能开关和 API 路由成为显式的应用模块，
  而不是隐藏的 import。
- 更好的组件开发体验：`define({ script, template })` 让逻辑与 UI 保持接近，
  而 `layers: { auth: AuthLayer }` 避免了字符串查找与逐层传递 props。
- 类型安全的服务访问：`auth.services.auth` 由 `defineLayer` 推导得出，组件无需
  手动重复声明服务类型。
- 服务端能力：由层拥有的 `server.api` 与 `server.actions` 让 Effuse 拥有类似
  Next 的请求处理面，同时不必把路由与实现它的能力分开。
- 细粒度更新：信号让状态变更精确生效，而不是默认触发整个组件子树重新渲染。
- 生产环境下的可测试性：层的服务、组件的 script 与服务端路由，可以通过同一份已
  声明的层依赖图单独测试，也可以整体测试。

## 非目标

- Effuse 不追求在数量上复制每个框架的所有特性。
- Effuse 不把应用依赖隐藏在环境全局变量背后。
- Effuse 不要求组件作者在本地别名更清晰时，还必须知道某个层内部的全局名称。
- Effuse 不把服务端路由做成独立于应用能力之外的另一套系统。

目标是用更小的表面积，组合出更强大的应用模型。

## 后续步骤

- [Effuse 入门](/docs/getting-started)
- [安装指南](/docs/installation)
- [组件 API](/docs/quick-start)
