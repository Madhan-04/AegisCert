export function authorize(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied: User is unauthenticated.',
        error: 'UNAUTHENTICATED'
      });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied: Role "${req.user.role}" does not have privileges for this action.`,
        error: 'FORBIDDEN'
      });
    }
    next();
  };
}

export function requireOwnInstitution(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied: User is unauthenticated.',
      error: 'UNAUTHENTICATED'
    });
  }

  // Super admins bypass all multi-tenant isolation constraints
  if (req.user.role === 'admin') {
    return next();
  }

  const userInstId = req.user.institutionId;
  const bodyInstId = req.body.institutionId;
  const paramInstId = req.params.institutionId;
  const queryInstId = req.query.institutionId;

  if (bodyInstId && bodyInstId !== userInstId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Cannot manipulate assets belonging to another institution.',
      error: 'TENANT_ISOLATION_VIOLATION'
    });
  }

  if (paramInstId && paramInstId !== userInstId && paramInstId !== 'own' && paramInstId !== ':institutionId') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Request parameters target a different tenant.',
      error: 'TENANT_ISOLATION_VIOLATION'
    });
  }

  if (queryInstId && queryInstId !== userInstId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Query filters target a different tenant.',
      error: 'TENANT_ISOLATION_VIOLATION'
    });
  }

  next();
}
