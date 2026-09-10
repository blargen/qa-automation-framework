import { z } from 'zod'

export const PostSchema = z.strictObject({
  userId: z.int().positive(),
  id: z.int().positive(),
  title: z.string().min(1),
  body: z.string().min(1),
})

export const PostListSchema = z.array(PostSchema)

export type Post = z.infer<typeof PostSchema>
