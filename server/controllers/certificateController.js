import * as certificateService from '../services/certificateService.js';

export async function getAll(req, res, next) {
  try {
    const list = await certificateService.getAll(req.user);
    return res.sendSuccess(list);
  } catch (e) {
    next(e);
  }
}

export async function getById(req, res, next) {
  try {
    const cert = await certificateService.getById(req.params.id, req.user);
    if (!cert) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found.',
        error: 'NOT_FOUND'
      });
    }
    return res.sendSuccess(cert);
  } catch (e) {
    next(e);
  }
}

export async function publicLookup(req, res, next) {
  try {
    const cert = await certificateService.publicLookup(req.params.id);
    if (!cert) {
      return res.status(404).json({
        success: false,
        message: 'No certificate exists under the provided cryptographic signature reference.',
        error: 'NOT_FOUND'
      });
    }
    return res.sendSuccess(cert);
  } catch (e) {
    next(e);
  }
}

export async function issue(req, res, next) {
  try {
    const cert = await certificateService.issueCertificate(req.body, req.user);
    return res.sendSuccess(cert);
  } catch (e) {
    next(e);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const { status, reason } = req.body;
    const cert = await certificateService.updateStatus(req.params.id, status, reason, req.user);
    return res.sendSuccess(cert);
  } catch (e) {
    next(e);
  }
}
