import type { APIResponse } from '@playwright/test'

export interface ApiResult {
  status: number
  headers: Record<string, string>
  body: unknown
  text: string
}

export async function toApiResult(response: APIResponse): Promise<ApiResult> {
  const text = await response.text()

  return {
    status: response.status(),
    headers: response.headers(),
    body: parseJson(text),
    text,
  }
}

function parseJson(text: string): unknown {
  if (text.length === 0) {
    return undefined
  }

  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}
