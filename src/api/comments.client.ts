import type { APIRequestContext } from '@playwright/test'
import { type ApiResult, toApiResult } from './result'

export class CommentsClient {
  constructor(private readonly request: APIRequestContext) {}

  async list(): Promise<ApiResult> {
    return toApiResult(await this.request.get('/comments'))
  }

  async getById(id: number): Promise<ApiResult> {
    return toApiResult(await this.request.get(`/comments/${id}`))
  }

  async listByPost(postId: number): Promise<ApiResult> {
    return toApiResult(await this.request.get('/comments', { params: { postId } }))
  }
}
