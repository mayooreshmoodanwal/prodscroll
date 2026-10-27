export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
export async function decodeResponse<T>(response: Response): Promise<T> {
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const failure = data as {
      error?: { message?: string; code?: string };
    } | null;
    throw new ApiError(
      failure?.error?.message ||
        `Something went wrong (${response.status}). Please try again.`,
      response.status,
      failure?.error?.code,
    );
  }
  return data as T;
}
