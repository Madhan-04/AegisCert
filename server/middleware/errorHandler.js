import crypto from 'crypto';

export function generateRequestId(req, res, next) {
  req.requestId = crypto.randomUUID();
  
  // Attach standard success formatter helper
  res.sendSuccess = (data) => {
    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  };

  next();
}

export function errorHandler(err, req, res, next) {
  // If headers have already been sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  console.error(`[CRITICAL ERROR] RequestID: ${req.requestId || 'N/A'} -`, err);

  const status = err.status || 500;
  const message = err.message || 'An unexpected internal server error occurred.';
  const errorDetail = err.error || err.name || 'INTERNAL_SERVER_ERROR';

  res.status(status).json({
    success: false,
    message,
    error: errorDetail,
    timestamp: new Date().toISOString(),
    requestId: req.requestId || 'N/A'
  });
}
