/** An error whose message is safe to show to the user. */
export class UserError extends Error {}

export class NotFoundError extends UserError {
  constructor(what = 'That record') {
    super(`${what} was not found.`)
  }
}
