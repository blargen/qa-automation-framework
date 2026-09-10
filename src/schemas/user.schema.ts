import { z } from 'zod'

const NUMERIC_STRING = /^-?\d+(\.\d+)?$/

export const GeoSchema = z.strictObject({
  lat: z.string().regex(NUMERIC_STRING),
  lng: z.string().regex(NUMERIC_STRING),
})

export const AddressSchema = z.strictObject({
  street: z.string().min(1),
  suite: z.string().min(1),
  city: z.string().min(1),
  zipcode: z.string().min(1),
  geo: GeoSchema,
})

export const CompanySchema = z.strictObject({
  name: z.string().min(1),
  catchPhrase: z.string().min(1),
  bs: z.string().min(1),
})

export const UserSchema = z.strictObject({
  id: z.int().positive(),
  name: z.string().min(1),
  username: z.string().min(1),
  email: z.email(),
  address: AddressSchema,
  phone: z.string().min(1),
  website: z.string().min(1),
  company: CompanySchema,
})

export const UserListSchema = z.array(UserSchema)

export type User = z.infer<typeof UserSchema>
