import * as uuid from 'uuid'

import { TodoAccess } from '../datalayer/todoAccess'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'

import { parseUserId } from '../auth/utils'
import { DataAccessResponse } from '../models/DataAccessResponse'
import { TodoUpdate } from '../models/TodoUpdate'

const todoAccess = new TodoAccess()

export async function createTodo(
  createTodoRequest: CreateTodoRequest,
  token: string
): Promise<DataAccessResponse> {
  const userId = await parseUserId(token)
  const todoId = uuid.v4()

  return await todoAccess.createTodo({
    userId: userId,
    todoId: todoId,
    ...createTodoRequest,
    done: false,
    createdAt: new Date().toISOString()
  })
}

export async function deleteTodo(todoId: string) {
  return await todoAccess.deleteTodo(todoId)
}

export async function updateTodo(todoId: string, updatedTodo: TodoUpdate) {
  return await todoAccess.updateTodo(todoId, updatedTodo)
}

export async function getTodos(token: string, limit: number, nextKey) {
  const userId = await parseUserId(token)
  return await todoAccess.getTodos(userId, limit, nextKey)
}
