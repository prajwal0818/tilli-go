export class AppError extends Error {
  readonly status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
