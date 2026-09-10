import { test as base } from '@playwright/test'
import { CommentsClient } from '@/api/comments.client'
import { PostsClient } from '@/api/posts.client'
import { UsersClient } from '@/api/users.client'

interface ApiFixtures {
  postsApi: PostsClient
  usersApi: UsersClient
  commentsApi: CommentsClient
}

export const test = base.extend<ApiFixtures>({
  postsApi: async ({ request }, use) => {
    await use(new PostsClient(request))
  },
  usersApi: async ({ request }, use) => {
    await use(new UsersClient(request))
  },
  commentsApi: async ({ request }, use) => {
    await use(new CommentsClient(request))
  },
})
