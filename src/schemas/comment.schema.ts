import { z } from 'zod'

export const CommentSchema = z.strictObject({
  postId: z.int().positive(),
  id: z.int().positive(),
  name: z.string().min(1),
  email: z.email(),
  body: z.string().min(1),
})

export const CommentListSchema = z.array(CommentSchema)

export type Comment = z.infer<typeof CommentSchema>
