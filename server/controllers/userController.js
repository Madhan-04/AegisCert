import * as userService from '../services/userService.js';

export async function getAll(req, res, next) {
  try {
    const list = await userService.getAll(req.user);
    return res.sendSuccess(list);
  } catch (e) {
    next(e);
  }
}

export async function getById(req, res, next) {
  try {
    const user = await userService.getById(req.params.id, req.user);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
        error: 'NOT_FOUND'
      });
    }
    return res.sendSuccess(user);
  } catch (e) {
    next(e);
  }
}

export async function create(req, res, next) {
  try {
    const user = await userService.create(req.body, req.user);
    return res.sendSuccess(user);
  } catch (e) {
    next(e);
  }
}

export async function update(req, res, next) {
  try {
    const user = await userService.update(req.params.id, req.body, req.user);
    return res.sendSuccess(user);
  } catch (e) {
    next(e);
  }
}

export async function remove(req, res, next) {
  try {
    await userService.remove(req.params.id, req.user);
    return res.sendSuccess({ message: 'User profile deleted successfully.' });
  } catch (e) {
    next(e);
  }
}
