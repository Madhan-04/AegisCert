import { z } from 'zod';

export function validate(schema) {
  return (req, res, next) => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }
      next();
    } catch (err) {
      const errorMsg = err.errors 
        ? err.errors.map(e => `[${e.path.join('.')}] ${e.message}`).join(', ') 
        : err.message;
      return res.status(400).json({
        success: false,
        message: 'Request payload validation failed.',
        error: errorMsg,
        timestamp: new Date().toISOString(),
        requestId: req.requestId || 'N/A'
      });
    }
  };
}

// Validation Schemas
export const loginSchema = {
  body: z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
    role: z.enum(['admin', 'institution', 'student', 'verifier'])
  })
};

export const mpinSchema = {
  body: z.object({
    mpin: z.string().length(6, 'MPIN must be exactly 6 numeric digits').regex(/^\d+$/, 'MPIN must only contain numeric digits')
  })
};

export const issueCertificateSchema = {
  body: z.object({
    id: z.string().optional(),
    studentName: z.string().min(1, 'Student name is required'),
    rollNo: z.string().min(1, 'Roll number is required'),
    regNo: z.string().min(1, 'Registration number is required'),
    degree: z.string().min(1, 'Degree is required'),
    department: z.string().min(1, 'Department is required'),
    cgpa: z.number().min(0).max(4.0),
    dob: z.string().optional(),
    yearOfPassout: z.string().optional(),
    pdfMarksheet: z.string().optional(),
    blockchainHash: z.string().optional()
  })
};

export const updateCertificateStatusSchema = {
  body: z.object({
    status: z.enum(['active', 'suspended', 'revoked']),
    reason: z.string().min(1, 'Reason for update is required')
  })
};
