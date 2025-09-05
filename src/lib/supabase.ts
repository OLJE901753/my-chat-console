import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Require proper configuration
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  }
})

// Database types for TypeScript
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'manager' | 'worker' | 'viewer'
          created_at: string
          updated_at: string
          last_login: string | null
        }
        Insert: {
          id?: string
          email: string
          role: 'admin' | 'manager' | 'worker' | 'viewer'
          created_at?: string
          updated_at?: string
          last_login?: string | null
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'manager' | 'worker' | 'viewer'
          created_at?: string
          updated_at?: string
          last_login?: string | null
        }
      }
      farm_zones: {
        Row: {
          id: string
          name: string
          description: string | null
          coordinates: unknown // PostGIS polygon
          area_hectares: number
          crop_type: string
          planting_date: string | null
          harvest_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          coordinates: unknown
          area_hectares: number
          crop_type: string
          planting_date?: string | null
          harvest_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          coordinates?: unknown
          area_hectares?: number
          crop_type?: string
          planting_date?: string | null
          harvest_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sensors: {
        Row: {
          id: string
          name: string
          type: 'soil_moisture' | 'temperature' | 'humidity' | 'wind_speed' | 'rainfall' | 'solar_radiation' | 'air_quality'
          location: unknown // PostGIS point
          zone_id: string
          status: 'active' | 'inactive' | 'maintenance' | 'error'
          last_reading: unknown | null
          last_reading_time: string | null
          battery_level: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'soil_moisture' | 'temperature' | 'humidity' | 'wind_speed' | 'rainfall' | 'solar_radiation' | 'air_quality'
          location: unknown
          zone_id: string
          status: 'active' | 'inactive' | 'maintenance' | 'error'
          last_reading?: unknown | null
          last_reading_time?: string | null
          battery_level?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'soil_moisture' | 'temperature' | 'humidity' | 'wind_speed' | 'rainfall' | 'solar_radiation' | 'air_quality'
          location?: unknown
          zone_id?: string
          status?: 'active' | 'inactive' | 'maintenance' | 'error'
          last_reading?: unknown | null
          last_reading_time?: string | null
          battery_level?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      sensor_readings: {
        Row: {
          id: string
          sensor_id: string
          reading: unknown
          timestamp: string
          location: unknown
          quality_score: number
          created_at: string
        }
        Insert: {
          id?: string
          sensor_id: string
          reading: unknown
          timestamp: string
          location: unknown
          quality_score: number
          created_at?: string
        }
        Update: {
          id?: string
          sensor_id?: string
          reading?: unknown
          timestamp?: string
          location?: unknown
          quality_score?: number
          created_at?: string
        }
      }
      drones: {
        Row: {
          id: string
          name: string
          model: string
          status: 'idle' | 'flying' | 'charging' | 'maintenance' | 'error'
          current_location: unknown | null
          battery_level: number
          last_flight: string | null
          total_flight_hours: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          model: string
          status: 'idle' | 'flying' | 'charging' | 'maintenance' | 'error'
          current_location?: unknown | null
          battery_level: number
          last_flight?: string | null
          total_flight_hours?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          model?: string
          status?: 'idle' | 'flying' | 'charging' | 'maintenance' | 'error'
          current_location?: unknown | null
          battery_level?: number
          last_flight?: string | null
          total_flight_hours?: number
          created_at?: string
          updated_at?: string
        }
      }
      drone_missions: {
        Row: {
          id: string
          drone_id: string
          mission_type: 'surveillance' | 'mapping' | 'spraying' | 'monitoring'
          status: 'planned' | 'active' | 'completed' | 'cancelled' | 'error'
          flight_path: unknown | null
          start_time: string | null
          end_time: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          drone_id: string
          mission_type: 'surveillance' | 'mapping' | 'spraying' | 'monitoring'
          status: 'planned' | 'active' | 'completed' | 'cancelled' | 'error'
          flight_path?: unknown | null
          start_time?: string | null
          end_time?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          drone_id?: string
          mission_type?: 'surveillance' | 'mapping' | 'spraying' | 'monitoring'
          status?: 'planned' | 'active' | 'completed' | 'cancelled' | 'error'
          flight_path?: unknown | null
          start_time?: string | null
          end_time?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      weather_stations: {
        Row: {
          id: string
          name: string
          location: unknown
          elevation: number
          status: 'active' | 'inactive' | 'maintenance'
          last_update: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          location: unknown
          elevation: number
          status: 'active' | 'inactive' | 'maintenance'
          last_update?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          location?: unknown
          elevation?: number
          status?: 'active' | 'inactive' | 'maintenance'
          last_update?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      weather_data: {
        Row: {
          id: string
          station_id: string
          timestamp: string
          temperature: number
          humidity: number
          wind_speed: number
          wind_direction: number
          rainfall: number
          pressure: number
          solar_radiation: number
          created_at: string
        }
        Insert: {
          id?: string
          station_id: string
          timestamp: string
          temperature: number
          humidity: number
          wind_speed: number
          wind_direction: number
          rainfall: number
          pressure: number
          solar_radiation: number
          created_at?: string
        }
        Update: {
          id?: string
          station_id?: string
          timestamp?: string
          temperature?: number
          humidity?: number
          wind_speed?: number
          wind_direction?: number
          rainfall?: number
          pressure?: number
          solar_radiation?: number
          created_at?: string
        }
      }
      satellite_data: {
        Row: {
          id: string
          satellite: string
          data_type: 'ndvi' | 'soil_moisture' | 'temperature' | 'precipitation'
          timestamp: string
          coverage_area: unknown
          data_url: string
          processed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          satellite: string
          data_type: 'ndvi' | 'soil_moisture' | 'temperature' | 'precipitation'
          timestamp: string
          coverage_area: unknown
          data_url: string
          processed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          satellite?: string
          data_type?: 'ndvi' | 'soil_moisture' | 'temperature' | 'precipitation'
          timestamp?: string
          coverage_area?: unknown
          data_url?: string
          processed?: boolean
          created_at?: string
        }
      }
      gps_fences: {
        Row: {
          id: string
          name: string
          description: string | null
          boundary: unknown // PostGIS polygon
          active: boolean
          restrictions: string[] // ['no_drones', 'no_vehicles', 'restricted_access']
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          boundary: unknown
          active: boolean
          restrictions?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          boundary?: unknown
          active?: boolean
          restrictions?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      irrigation_zones: {
        Row: {
          id: string
          name: string
          zone_id: string
          status: 'active' | 'inactive' | 'maintenance'
          current_moisture: number
          target_moisture: number
          last_irrigation: string | null
          next_scheduled: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          zone_id: string
          status: 'active' | 'inactive' | 'maintenance'
          current_moisture: number
          target_moisture: number
          last_irrigation?: string | null
          next_scheduled?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          zone_id?: string
          status?: 'active' | 'inactive' | 'maintenance'
          current_moisture?: number
          target_moisture?: number
          last_irrigation?: string | null
          next_scheduled?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      access_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          resource_type: string
          resource_id: string | null
          ip_address: string
          user_agent: string
          timestamp: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          resource_type: string
          resource_id?: string | null
          ip_address: string
          user_agent: string
          timestamp: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          resource_type?: string
          resource_id?: string | null
          ip_address?: string
          user_agent?: string
          timestamp?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
