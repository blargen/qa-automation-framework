import type { APIRequestContext } from '@playwright/test'
import { type ApiResult, toApiResult } from './result'

export class UsersClient {
  constructor(private readonly request: APIRequestContext) {}

  async list(): Promise<ApiResult> {
    return toApiResult(await this.request.get('/users'))
  }

  async getById(id: number): Promise<ApiResult> {
    return toApiResult(await this.request.get(`/users/${id}`))
  }

  async postsFor(id: number): Promise<ApiResult> {
    return toApiResult(await this.request.get(`/users/${id}/posts`))
  }
}
