import {
  calculateLogDragTension,
} from '../utils/logDragTension.js';

export function calculateLogDrag(req, res) {
  const result = calculateLogDragTension(req.body);
  res.json(result.json);
}
