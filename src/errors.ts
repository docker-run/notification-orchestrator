export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly expose: boolean = false
  ) {
    super(message);
    this.name = HttpError.name;
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

export class HttpNotFoundError extends HttpError {
  constructor(
    message = 'Not found',
    public readonly status = 404
  ) {
    super(message, status, status < 500);
    this.name = HttpNotFoundError.name;
    Object.setPrototypeOf(this, HttpNotFoundError.prototype);
  }
}
