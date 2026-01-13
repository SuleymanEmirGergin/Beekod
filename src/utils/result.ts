export type Result<T, E = Error> = Success<T> | Failure<E>;

export class Success<T> {
  readonly ok = true as const;
  constructor(readonly value: T) {}
}

export class Failure<E> {
  readonly ok = false as const;
  constructor(readonly error: E) {}
}

export function ok<T>(value: T): Success<T> {
  return new Success(value);
}

export function fail<E>(error: E): Failure<E> {
  return new Failure(error);
}

export function isSuccess<T, E>(result: Result<T, E>): result is Success<T> {
  return result.ok;
}

export function isFailure<T, E>(result: Result<T, E>): result is Failure<E> {
  return !result.ok;
}
