import { apiEndpoint } from '../config'
import { Todo } from '../types/Todo'
import { CreateTodoRequest } from '../types/CreateTodoRequest'
import Axios from 'axios'
import { UpdateTodoRequest } from '../types/UpdateTodoRequest'

interface getTodosInterface {
  todos: Todo[]
  lastEvaluatedKey: string
}

interface getSearchTodosInterface {
  todos: []
  from: number
}

export async function getTodos(
  idToken: string,
  limit?: number,
  lastKey?: string
): Promise<getTodosInterface> {
  console.log(`Fetching todos`)
  var response
  try {
    response = await Axios.get(
      `${apiEndpoint}/todos?limit=${limit}&nextKey=${lastKey}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`
        }
      }
    )
  } catch (e) {
    response = await Axios.get(`${apiEndpoint}/todos?limit=${limit}&nextKey=`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`
      }
    })
  }
  console.log('Todos:', response.data)
  // response.data.LastEvaluatedKey
  if (lastKey === response.data.LastEvaluatedKey) {
    return {
      todos: [],
      lastEvaluatedKey: lastKey
    } as getTodosInterface
  }

  const stateProps: getTodosInterface = {
    todos: response.data.Items,
    lastEvaluatedKey: response.data.LastEvaluatedKey
  }

  return stateProps
}

export async function createTodo(
  idToken: string,
  newTodo: CreateTodoRequest
): Promise<Todo> {
  // console.log(JSON.stringify(newTodo))
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
  console.log(`patching priority ${todoId}`)
  await Axios.patch(
    `${apiEndpoint}/todos/${todoId}`,
    JSON.stringify(updatedTodo),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`
      }
    }
  ).catch((e) => {})
}

export async function patchTodoFile(
  idToken: string,
  todoId: string,
  fileName: string
): Promise<void> {
  console.log(`patching the changes`)
  await Axios.patch(
    `${apiEndpoint}/todos/${todoId}/attachment?filename=${fileName}`,
    {},
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`
      }
    }
  ).catch((e) => {
    console.log(`e`)
  })
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
    `${apiEndpoint}/todos/${todoId}/attachment?filename=${filename}`,
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

export async function getSearchTodos(
  idToken: string,
  searchStr: string,
  from?: number
): Promise<getSearchTodosInterface> {
  console.log(`Fetching searchstr todos`)
  var response
  if (from) {
    response = await Axios.get(
      `${apiEndpoint}/todos/search?query=${searchStr}&from=${from}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`
        }
      }
    )
  } else {
    response = await Axios.get(
      `${apiEndpoint}/todos/search?query=${searchStr}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`
        }
      }
    )
  }
  const stateProps: getSearchTodosInterface = {
    todos: response.data.Items,
    from: from + response.data.Items.length
  }

  return stateProps
}
