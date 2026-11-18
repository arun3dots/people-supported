/** Only a transport failure may be queued; a rejected API request must remain an error. */
export class MobileNetworkError extends Error {
  constructor() {
    super('Unable to connect to the server. Please check your connection.');
    this.name = 'MobileNetworkError';
  }
}

export function isNetworkError(error: unknown): error is MobileNetworkError {
  return error instanceof MobileNetworkError;
}
