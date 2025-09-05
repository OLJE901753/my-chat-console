import { z } from 'zod'

// Base validation schemas
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(1, 'Email is required')
  .max(255, 'Email too long')
  .transform(email => email.toLowerCase().trim())

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
    'Password must contain uppercase, lowercase, number, and special character')

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(50, 'Username too long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')

// User validation schemas
export const userRoleSchema = z.enum(['admin', 'manager', 'worker', 'viewer'])

export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  role: userRoleSchema.default('viewer')
})

export const updateUserSchema = z.object({
  email: emailSchema.optional(),
  role: userRoleSchema.optional()
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
})

// Farm zone validation schemas
export const farmZoneSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Name contains invalid characters'),
  description: z.string()
    .max(500, 'Description too long')
    .optional(),
  coordinates: z.string()
    .min(1, 'Coordinates are required')
    .regex(/^POLYGON\(\([0-9.,\s-]+\)\)$/, 'Invalid polygon format'),
  area_hectares: z.number()
    .positive('Area must be positive')
    .max(10000, 'Area too large'),
  crop_type: z.string()
    .min(1, 'Crop type is required')
    .max(50, 'Crop type too long')
    .regex(/^[a-zA-Z\s]+$/, 'Crop type contains invalid characters'),
  planting_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .optional(),
  harvest_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .optional()
})

// Sensor validation schemas
export const sensorTypeSchema = z.enum([
  'soil_moisture', 'temperature', 'humidity', 'wind_speed', 
  'rainfall', 'solar_radiation', 'air_quality'
])

export const sensorSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Name contains invalid characters'),
  type: sensorTypeSchema,
  location: z.string()
    .min(1, 'Location is required')
    .regex(/^POINT\([0-9.,\s-]+\)$/, 'Invalid point format'),
  zone_id: z.string().uuid('Invalid zone ID'),
  status: z.enum(['active', 'inactive', 'maintenance', 'error']).default('active'),
  battery_level: z.number()
    .min(0, 'Battery level cannot be negative')
    .max(100, 'Battery level cannot exceed 100')
    .optional()
})

// Drone validation schemas
export const droneSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Name contains invalid characters'),
  model: z.string()
    .min(1, 'Model is required')
    .max(100, 'Model too long')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Model contains invalid characters'),
  status: z.enum(['idle', 'flying', 'charging', 'maintenance', 'error']).default('idle'),
  current_location: z.string()
    .regex(/^POINT\([0-9.,\s-]+\)$/, 'Invalid point format')
    .optional(),
  battery_level: z.number()
    .min(0, 'Battery level cannot be negative')
    .max(100, 'Battery level cannot exceed 100')
})

// Mission validation schemas
export const missionSchema = z.object({
  drone_id: z.string().uuid('Invalid drone ID'),
  mission_type: z.enum(['surveillance', 'mapping', 'spraying', 'monitoring']),
  status: z.enum(['planned', 'active', 'completed', 'cancelled', 'error']).default('planned'),
  flight_path: z.string()
    .regex(/^LINESTRING\([0-9.,\s-]+\)$/, 'Invalid linestring format')
    .optional(),
  start_time: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/, 'Invalid datetime format')
    .optional(),
  end_time: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/, 'Invalid datetime format')
    .optional()
})

// Weather station validation schemas
export const weatherStationSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Name contains invalid characters'),
  location: z.string()
    .min(1, 'Location is required')
    .regex(/^POINT\([0-9.,\s-]+\)$/, 'Invalid point format'),
  elevation: z.number()
    .min(-1000, 'Elevation too low')
    .max(10000, 'Elevation too high'),
  status: z.enum(['active', 'inactive', 'maintenance']).default('active')
})

// GPS fence validation schemas
export const gpsFenceSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Name contains invalid characters'),
  description: z.string()
    .max(500, 'Description too long')
    .optional(),
  boundary: z.string()
    .min(1, 'Boundary is required')
    .regex(/^POLYGON\(\([0-9.,\s-]+\)\)$/, 'Invalid polygon format'),
  active: z.boolean().default(true),
  restrictions: z.array(z.enum(['no_drones', 'no_vehicles', 'restricted_access'])).default([])
})

// Irrigation zone validation schemas
export const irrigationZoneSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Name contains invalid characters'),
  zone_id: z.string().uuid('Invalid zone ID'),
  status: z.enum(['active', 'inactive', 'maintenance']).default('active'),
  current_moisture: z.number()
    .min(0, 'Moisture cannot be negative')
    .max(100, 'Moisture cannot exceed 100'),
  target_moisture: z.number()
    .min(0, 'Target moisture cannot be negative')
    .max(100, 'Target moisture cannot exceed 100'),
  last_irrigation: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/, 'Invalid datetime format')
    .optional(),
  next_scheduled: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/, 'Invalid datetime format')
    .optional()
})

// Generic ID validation
export const idSchema = z.string().uuid('Invalid ID format')

// Pagination and filtering
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc')
})

// Search validation
export const searchSchema = z.object({
  query: z.string()
    .min(1, 'Search query is required')
    .max(100, 'Search query too long')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Search query contains invalid characters'),
  filters: z.record(z.any()).optional()
})

// Export all schemas
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type FarmZoneInput = z.infer<typeof farmZoneSchema>
export type SensorInput = z.infer<typeof sensorSchema>
export type DroneInput = z.infer<typeof droneSchema>
export type MissionInput = z.infer<typeof missionSchema>
export type WeatherStationInput = z.infer<typeof weatherStationSchema>
export type GpsFenceInput = z.infer<typeof gpsFenceSchema>
export type IrrigationZoneInput = z.infer<typeof irrigationZoneSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
export type SearchInput = z.infer<typeof searchSchema>
