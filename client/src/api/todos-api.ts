import { apiEndpoint } from '../config'
import { Todo } from '../types/Todo'
import { CreateTodoRequest } from '../types/CreateTodoRequest'
import Axios from 'axios'
import { UpdateTodoRequest } from '../types/UpdateTodoRequest'

var lastKey: string
var limit: number = 2

export async function getTodos(idToken: string): Promise<Todo[]> {
  console.log('Fetching todos')

  const response = await Axios.get(
    `${apiEndpoint}/todos?limit=${limit}&lastKey=${lastKey}`,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`
      }
    }
  )
  console.log('Todos:', response.data)
  lastKey = response.data.LastEvaluatedKey
  return response.data.Items
}

export async function createTodo(
  idToken: string,
  newTodo: CreateTodoRequest
): Promise<Todo> {
  console.log(JSON.stringify(newTodo))
  const response = await Axios.post(
    `${apiEndpoint}/todos`,
    JSON.stringify(newTodo),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`
      }
    }
  )
  return response.data
}

export async function patchTodo(
  idToken: string,
  todoId: string,
  updatedTodo: UpdateTodoRequest
): Promise<void> {
  await Axios.patch(
    `${apiEndpoint}/todos/${todoId}`,
    JSON.stringify(updatedTodo),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`
      }
    }
  )
}

export async function patchTodoFile(
  idToken: string,
  todoId: string,
  fileName: string
): Promise<void> {
  await Axios.patch(
    `${apiEndpoint}/todos/${todoId}`,
    JSON.stringify({ fileName: fileName }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`
      }
    }
  )
}

export async function deleteTodo(
  idToken: string,
  todoId: string
): Promise<void> {
  await Axios.delete(`${apiEndpoint}/todos/${todoId}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`
    }
  })
}

export async function getUploadUrl(
  idToken: string,
  todoId: string,
  filename: string
): Promise<string> {
  const response = await Axios.post(
    `${apiEndpoint}/todos/${todoId}/attachment?name=${filename}`,
    '',
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`
      }
    }
  )
  return response.data.uploadUrl
}

export async function uploadFile(
  uploadUrl: string,
  file: Buffer
): Promise<void> {
  await Axios.put(uploadUrl, file)
}
