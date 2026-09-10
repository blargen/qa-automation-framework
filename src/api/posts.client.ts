import type { APIRequestContext } from '@playwright/test'
import type { NewPost } from '@/schemas/post.schema'
import { type ApiResult, toApiResult } from './result'

export class PostsClient {
  constructor(private readonly request: APIRequestContext) {}

  async list(): Promise<ApiResult> {
    return toApiResult(await this.request.get('/posts'))
  }

  async listByUser(userId: number): Promise<ApiResult> {
    return toApiResult(await this.request.get('/posts', { params: { userId } }))
  }

  async getById(id: number): Promise<ApiResult> {
    return toApiResult(await this.request.get(`/posts/${id}`))
  }

  async commentsFor(id: number): Promise<ApiResult> {
    return toApiResult(await this.request.get(`/posts/${id}/comments`))
  }

  async create(post: NewPost): Promise<ApiResult> {
    return toApiResult(await this.request.post('/posts', { data: post }))
  }

  async replace(id: number, post: NewPost): Promise<ApiResult> {
    return toApiResult(await this.request.put(`/posts/${id}`, { data: post }))
  }

  async update(id: number, changes: Partial<NewPost>): Promise<ApiResult> {
    return toApiResult(await this.request.patch(`/posts/${id}`, { data: changes }))
  }

  async delete(id: number): Promise<ApiResult> {
    return toApiResult(await this.request.delete(`/posts/${id}`))
  }
}
