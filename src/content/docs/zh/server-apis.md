---
title: 服务端 API 与操作
---

# 服务端 API 与操作

Effuse 的服务端功能是层依赖图的延伸。一个能力在同一份定义中拥有它的服务、HTTP
路由、操作、校验、错误、中间件、元数据、清单条目以及客户端契约。

## API 路由

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

处理函数可以拿到请求 URL、params、query、当前层的服务、所有层的服务集合、请求体
读取器、校验工具、响应辅助函数以及请求上下文。普通对象会被序列化为 JSON，而
`Response` 值原样返回。

## 校验与表单

校验器可以是函数，也可以是带有 `parse` 或 `safeParse` 方法的 schema 对象。

```ts
const parseLogin = (value: unknown): { email: string; password: string } => {
  const input = value as Record<string, unknown>;
  if (!input || typeof input.email !== 'string' || typeof input.password !== 'string') {
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

校验失败会返回 `400`，并带上 `EFFUSE_VALIDATION_FAILED`、输入来源以及规范化后的
问题列表。业务层面的失败请使用 `LayerServerError` 或
`response.error(code, message, options)`。

## 文件上传

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

Effuse 会解析 multipart 数据，但不替你决定存储方式。请通过层的服务来流式处理或
持久化文件，以便存储策略保持可替换、可测试。

## 操作（Actions）

操作是层级作用域的 POST 调用，适用于不需要公开路由形态的领域变更。

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

操作的 URL 中包含层名称：

```text
/_effuse/actions/cart/refresh
```

因此两个层可以拥有同名的本地操作而不会冲突：

```ts
const authActions = createLayerActionClient(AuthLayer);
const billingActions = createLayerActionClient(BillingLayer);

await authActions.refresh();
await billingActions.refresh();
```

不带作用域的旧版操作 URL 仅为兼容而保留。新的客户端应使用层对象或清单客户端，
以便操作的归属保持明确。

## 清单与类型化客户端

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

字面量清单会约束层名称、操作、路由路径、方法与 params。
`generateLayerServerClientModule` 会生成一个确定性的模块，其中包含清单、工厂函数
以及推导出的客户端类型。

## 文件系统适配器

习惯 Next 风格目录结构的团队，可以把它映射到一个层上：

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

默认的根目录包括 `src/server/api`、`app/api`、`src/api`、`src/server/actions`、
`app/actions` 和 `src/actions`。方括号参数与路由分组会映射到同一套运行时匹配器和
清单。重复或有歧义的文件会转化为清单诊断信息。

目录约定只是一个输入适配器，它不会在层之外再造一套服务端运行时。

## 请求管线

```text
请求
  -> 路由匹配
  -> 按依赖顺序执行的层中间件
  -> 路由/操作中间件
  -> 校验与处理函数
  -> 基于元数据的响应策略
  -> 追踪事件
  -> 没有匹配到服务端端点时回退到 SSR
```

路由与操作的元数据支持缓存、CORS、运行时、区域、时长以及自定义策略数据。可观测性
钩子会收到稳定的服务端追踪事件；上报端失败不会替换应用返回的响应。

## 生产实践

1. 把路由和操作与拥有其服务的层放在一起。
2. 在处理函数的边界校验不可信的请求数据。
3. 返回结构化的领域错误，而不是去解析错误字符串。
4. 当不同领域出现重名时，使用带作用域的操作客户端。
5. 从清单生成客户端，而不是重复编写 fetch 路径。
6. 把文件路由视为层的输入，并在 CI 中检查清单诊断。
7. 把上传、持久化、认证与遥测都放在服务背后。
