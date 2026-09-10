import type { UserName } from './users'

export const storageStatePath = (user: UserName): string => `playwright/.auth/${user}.json`
