import { validationResult } from 'express-validator';
import { ApiError } from '../utils/errors.js';

export function handleValidation(req, res, next) {
  const result = validationResult(req);

  if (result.isEmpty()) {
    next();
    return;
  }

  next(
    new ApiError(
      'La solicitud contiene datos invalidos.',
      400,
      result.array().map((error) => ({
        field: error.path,
        message: error.msg,
      }))
    )
  );
}
