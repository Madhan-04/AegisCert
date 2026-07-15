import * as institutionService from '../services/institutionService.js';

export async function getAll(req, res, next) {
  try {
    const list = await institutionService.getAll();
    return res.sendSuccess(list);
  } catch (e) {
    next(e);
  }
}

export async function getById(req, res, next) {
  try {
    const inst = await institutionService.getById(req.params.id);
    if (!inst) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found.',
        error: 'NOT_FOUND'
      });
    }
    return res.sendSuccess(inst);
  } catch (e) {
    next(e);
  }
}

export async function create(req, res, next) {
  try {
    const inst = await institutionService.create(req.body, req.user.username);
    return res.sendSuccess(inst);
  } catch (e) {
    next(e);
  }
}

export async function update(req, res, next) {
  try {
    const inst = await institutionService.update(req.params.id, req.body, req.user.username);
    return res.sendSuccess(inst);
  } catch (e) {
    next(e);
  }
}

export async function remove(req, res, next) {
  try {
    await institutionService.remove(req.params.id);
    return res.sendSuccess({ message: 'Institution deleted successfully.' });
  } catch (e) {
    next(e);
  }
}
