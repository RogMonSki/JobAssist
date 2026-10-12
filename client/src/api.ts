interface ErrorResponse {
  message?: string
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = options.body instanceof FormData ? undefined : { 'Content-Type': 'application/json' }
  const res = await fetch(path, {
    credentials: 'include',
    headers,
    ...options,
  })

  const data = res.status === 204 ? null : ((await res.json()) as T | ErrorResponse)

  if (!res.ok) {
    throw new Error((data as ErrorResponse)?.message || 'Something went wrong')
  }
  return data as T
}
