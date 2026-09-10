import { z } from 'zod'

export const PostSchema = z.strictObject({
  userId: z.int().positive(),
  id: z.int().positive(),
  title: z.string().min(1),
  body: z.string().min(1),
})

export const PostListSchema = z.array(PostSchema)

export const NewPostSchema = z.strictObject({
  userId: z.int().positive(),
  title: z.string().min(1),
  body: z.string().min(1),
})

export type Post = z.infer<typeof PostSchema>

export type NewPost = z.infer<typeof NewPostSchema>
