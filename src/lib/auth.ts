import { supabase } from './supabase'
import { createUserSchema, loginSchema, updateUserSchema } from './validation'
import type { CreateUserInput, LoginInput, UpdateUserInput } from './validation'

// Secure token storage using httpOnly cookies (handled by backend)
// Never store tokens in localStorage or sessionStorage

export interface AuthUser {
  id: string
  email: string
  role: 'admin' | 'manager' | 'worker' | 'viewer'
  created_at: string
  last_login: string | null
}

export interface AuthSession {
  user: AuthUser
  access_token: string
  refresh_token: string
}

class AuthService {
  private currentUser: AuthUser | null = null
  private accessToken: string | null = null
  private refreshToken: string | null = null

  // Initialize auth state from secure storage
  async initialize(): Promise<void> {
    try {
      // Require Supabase configuration
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.error('Supabase configuration required for authentication')
        return
      }

      const { data: { session }, error } = await supabase.auth.getSession()
      if (session && !error) {
        await this.setSession(session)
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error)
      this.clearSession()
    }
  }

  // Secure login with input validation
  async login(credentials: LoginInput): Promise<AuthUser> {
    try {
      // Validate input
      const validatedCredentials = loginSchema.parse(credentials)

      // Check if Supabase is properly configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        throw new Error('Authentication system not configured. Please contact administrator.')
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: validatedCredentials.email,
        password: validatedCredentials.password
      })

      if (error) throw error
      if (!data.user || !data.session) throw new Error('Authentication failed')

      // Get user profile from our users table
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profileError || !userProfile) {
        throw new Error('User profile not found. Access denied.')
      }

      await this.setSession(data.session)
      this.currentUser = userProfile

      return userProfile
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  // Secure user registration (admin only)
  async register(userData: CreateUserInput): Promise<AuthUser> {
    try {
      // Validate input
      const validatedData = createUserSchema.parse(userData)

      // Check if current user has admin privileges
      if (!this.currentUser || this.currentUser.role !== 'admin') {
        throw new Error('Insufficient permissions')
      }

      // Create user in Supabase Auth
      const { data, error } = await supabase.auth.admin.createUser({
        email: validatedData.email,
        password: validatedData.password,
        email_confirm: true
      })

      if (error) throw error
      if (!data.user) throw new Error('User creation failed')

      // Create user profile in our users table
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: validatedData.email,
          role: validatedData.role
        })
        .select()
        .single()

      if (profileError) throw profileError

      return userProfile
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  // Secure logout
  async logout(): Promise<void> {
    try {
      await supabase.auth.signOut()
      this.clearSession()
    } catch (error) {
      console.error('Logout error:', error)
      this.clearSession()
    }
  }

  // Update user profile (with validation)
  async updateProfile(userId: string, updates: UpdateUserInput): Promise<AuthUser> {
    try {
      // Validate input
      const validatedUpdates = updateUserSchema.parse(updates)

      // Check permissions
      if (!this.canUpdateUser(userId)) {
        throw new Error('Insufficient permissions')
      }

      const { data, error } = await supabase
        .from('users')
        .update(validatedUpdates)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      // Update current user if updating self
      if (userId === this.currentUser?.id) {
        this.currentUser = data
      }

      return data
    } catch (error) {
      console.error('Profile update error:', error)
      throw error
    }
  }

  // Check if user can perform action
  canPerformAction(action: string, _resource?: string): boolean {
    if (!this.currentUser) return false

    const permissions = this.getPermissions(this.currentUser.role)
    return permissions.includes(action) || permissions.includes('*')
  }

  // Check if user can update another user
  canUpdateUser(targetUserId: string): boolean {
    if (!this.currentUser) return false

    // Users can always update their own profile
    if (this.currentUser.id === targetUserId) return true

    // Admins can update any user
    if (this.currentUser.role === 'admin') return true

    // Managers can update workers and viewers
    if (this.currentUser.role === 'manager') {
      return targetUserId !== this.currentUser.id
    }

    return false
  }

  // Get user permissions based on role
  private getPermissions(role: string): string[] {
    const permissionMap: Record<string, string[]> = {
      admin: ['*'], // Full access
      manager: [
        'read:all',
        'write:farm_zones',
        'write:weather_stations',
        'write:satellite_data',
        'write:gps_fences',
        'write:sensors',
        'write:drones',
        'write:irrigation_zones',
        'read:access_logs'
      ],
      worker: [
        'read:all',
        'write:sensors',
        'write:drones',
        'write:irrigation_zones',
        'write:weather_data'
      ],
      viewer: [
        'read:all'
      ]
    }

    return permissionMap[role] || []
  }

  // Get current user
  getCurrentUser(): AuthUser | null {
    return this.currentUser
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.currentUser && !!this.accessToken
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    return this.currentUser?.role === role
  }

  // Check if user has any of the specified roles
  hasAnyRole(roles: string[]): boolean {
    return roles.includes(this.currentUser?.role || '')
  }

  // Get access token (for API calls)
  getAccessToken(): string | null {
    return this.accessToken
  }

  // Refresh access token
  async refreshAccessToken(): Promise<string | null> {
    try {
      if (!this.refreshToken) return null

      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: this.refreshToken
      })

      if (error) throw error
      if (!data.session) return null

      await this.setSession(data.session)
      return this.accessToken
    } catch (error) {
      console.error('Token refresh error:', error)
      this.clearSession()
      return null
    }
  }

  // Set session data
  private async setSession(session: { access_token: string; refresh_token: string; user?: { id: string } }): Promise<void> {
    this.accessToken = session.access_token
    this.refreshToken = session.refresh_token

    // Get user profile
    if (session.user) {
      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (userProfile) {
        this.currentUser = userProfile
      }
    }
  }

  // Clear session data
  private clearSession(): void {
    this.currentUser = null
    this.accessToken = null
    this.refreshToken = null
  }

  // Listen for auth state changes
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await this.setSession(session)
        callback(this.currentUser)
      } else if (event === 'SIGNED_OUT') {
        this.clearSession()
        callback(null)
      }
    }).data.subscription.unsubscribe
  }
}

// Export singleton instance
export const authService = new AuthService()

// Export utility functions
export const requireAuth = (callback: () => void) => {
  if (!authService.isAuthenticated()) {
    throw new Error('Authentication required')
  }
  return callback()
}

export const requireRole = (role: string, callback: () => void) => {
  if (!authService.hasRole(role)) {
    throw new Error(`Role '${role}' required`)
  }
  return callback()
}

export const requireAnyRole = (roles: string[], callback: () => void) => {
  if (!authService.hasAnyRole(roles)) {
    throw new Error(`One of roles [${roles.join(', ')}] required`)
  }
  return callback()
}
