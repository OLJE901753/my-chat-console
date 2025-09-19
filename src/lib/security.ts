// Security configuration and utilities for the farm management system

// Security headers configuration
export const securityHeaders = {
  // Prevent clickjacking attacks
  'X-Frame-Options': 'DENY',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Enable XSS protection
  'X-XSS-Protection': '1; mode=block',
  
  // Strict Transport Security (HTTPS only)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https: wss:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '),
  
  // Permissions Policy
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()'
  ].join(', ')
}

// HTTPS enforcement
export const enforceHTTPS = (): void => {
  if (typeof window !== 'undefined' && window.location.protocol === 'http:') {
    // Redirect to HTTPS
    window.location.href = window.location.href.replace('http:', 'https:')
  }
}

// Environment security checks
export const checkEnvironmentSecurity = (): void => {
  const isProduction = import.meta.env.PROD
  const isHTTPS = typeof window !== 'undefined' && window.location.protocol === 'https:'
  
  if (isProduction && !isHTTPS) {
    console.error('Security Warning: Production environment must use HTTPS')
    throw new Error('HTTPS is required in production')
  }
  
  // Check for sensitive environment variables in client
  const sensitiveVars = ['VITE_SUPABASE_SERVICE_KEY', 'VITE_DATABASE_URL', 'VITE_API_SECRET']
  sensitiveVars.forEach(varName => {
    if (import.meta.env[varName]) {
      console.error(`Security Warning: Sensitive variable ${varName} exposed in client`)
      throw new Error(`Sensitive variable ${varName} cannot be exposed in client`)
    }
  })
}

// Rate limiting configuration
export const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
}

// Input sanitization levels
export const sanitizationLevels = {
  strict: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i
  },
  moderate: {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i
  },
  permissive: {
    ALLOWED_TAGS: ['*'],
    ALLOWED_ATTR: ['*'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i
  }
}

// Password strength requirements
export const passwordRequirements = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  forbiddenPatterns: [
    /password/i,
    /123456/,
    /qwerty/i,
    /admin/i,
    /user/i
  ]
}

// Session security configuration
export const sessionConfig = {
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  httpOnly: true,
  secure: true, // HTTPS only
  sameSite: 'strict' as const,
  path: '/'
}

// API security configuration
export const apiSecurityConfig = {
  maxRequestSize: '10mb',
  timeout: 30000, // 30 seconds
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://yourdomain.com'] 
      : ['http://localhost:3000', 'http://localhost:8080'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
  }
}

// Audit logging configuration
export const auditConfig = {
  enabled: true,
  logLevel: 'info',
  sensitiveFields: ['password', 'token', 'secret', 'key'],
  logEvents: [
    'user.login',
    'user.logout',
    'user.create',
    'user.update',
    'user.delete',
    'data.access',
    'data.modify',
    'system.config_change'
  ]
}

// Security middleware configuration
export const securityMiddlewareConfig = {
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https:"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  },
  cors: apiSecurityConfig.cors,
  rateLimit: rateLimitConfig
}

// Security utility functions
export const securityUtils = {
  // Generate secure random string
  generateSecureToken: (length: number = 32): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  },

  // Validate file upload security
  validateFileUpload: (file: File): { valid: boolean; error?: string } => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
    
    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds maximum allowed size' }
    }
    
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File type not allowed' }
    }
    
    return { valid: true }
  },

  // Check if request is from trusted source
  isTrustedSource: (origin: string): boolean => {
    const trustedOrigins = [
      'https://yourdomain.com',
      'https://api.yourdomain.com'
    ]
    
    if (process.env.NODE_ENV === 'development') {
      trustedOrigins.push('http://localhost:3000', 'http://localhost:8080')
    }
    
    return trustedOrigins.includes(origin)
  },

  // Sanitize sensitive data for logging
  sanitizeForLogging: (data: unknown): unknown => {
    const sensitiveFields = auditConfig.sensitiveFields
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: Record<string, unknown> = { ...(data as Record<string, unknown>) }
      
      for (const field of sensitiveFields) {
        if (field in sanitized) {
          sanitized[field] = '[REDACTED]'
        }
      }
      
      return sanitized
    }
    
    return data
  }
}

// Export default security configuration
export default {
  headers: securityHeaders,
  enforceHTTPS,
  checkEnvironmentSecurity,
  rateLimit: rateLimitConfig,
  sanitization: sanitizationLevels,
  password: passwordRequirements,
  session: sessionConfig,
  api: apiSecurityConfig,
  audit: auditConfig,
  middleware: securityMiddlewareConfig,
  utils: securityUtils
}
