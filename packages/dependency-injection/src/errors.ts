export class AlreadyRegisteredError extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
  }
}

export class NotRegisteredError extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
  }
}

export class CircularDependenciesError extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
  }
}

export class ContainerSealedError extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
  }
}
