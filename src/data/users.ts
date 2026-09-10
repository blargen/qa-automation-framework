export const PASSWORD = process.env.SAUCE_PASSWORD ?? 'secret_sauce'

export const USERS = {
  standard: 'standard_user',
  lockedOut: 'locked_out_user',
  problem: 'problem_user',
  performanceGlitch: 'performance_glitch_user',
  error: 'error_user',
  visual: 'visual_user',
} as const

export type UserName = (typeof USERS)[keyof typeof USERS]

export const ACCOUNTS_THAT_AUTHENTICATE: UserName[] = [
  USERS.problem,
  USERS.performanceGlitch,
  USERS.error,
  USERS.visual,
]
