import {
  TodoResponseSchema,
  TodosResponseSchema,
  type TodoResponse,
} from './todo.schema.js';
import { PostResponseSchema, type PostResponse } from './post.schema.js';
import { UserResponseSchema, type UserResponse } from './user.schema.js';

export const decodeTodoResponse = (payload: unknown): TodoResponse =>
  TodoResponseSchema.parse(payload);

export const decodeTodosResponse = (payload: unknown): TodoResponse[] =>
  TodosResponseSchema.parse(payload);

export const decodePostResponse = (payload: unknown): PostResponse =>
  PostResponseSchema.parse(payload);

export const decodeUserResponse = (payload: unknown): UserResponse =>
  UserResponseSchema.parse(payload);
