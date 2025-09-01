import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import DOMPurify from 'dompurify'

// CSRF token management
let csrfToken: string | null = null

const generateCSRFToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

const getCSRFToken = (): string => {
  if (!csrfToken) {
    csrfToken = generateCSRFToken()
  }
  return csrfToken
}

// Input sanitization utility
const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
}

// Secure input component with validation
interface SecureInputProps {
  label: string
  name: string
  type?: 'text' | 'email' | 'password' | 'number' | 'url'
  placeholder?: string
  required?: boolean
  validation?: (value: string) => string | null
  onChange?: (value: string) => void
  value?: string
  disabled?: boolean
  className?: string
}

export const SecureInput: React.FC<SecureInputProps> = ({
  label,
  name,
  type = 'text',
  placeholder,
  required = false,
  validation,
  onChange,
  value = '',
  disabled = false,
  className = ''
}) => {
  const [inputValue, setInputValue] = useState(value)
  const [error, setError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    const sanitizedValue = sanitizeInput(rawValue)
    
    setInputValue(sanitizedValue)
    setIsDirty(true)

    // Validate input
    if (validation) {
      const validationError = validation(sanitizedValue)
      setError(validationError)
    } else {
      setError(null)
    }

    // Call parent onChange with sanitized value
    if (onChange) {
      onChange(sanitizedValue)
    }
  }, [validation, onChange])

  const handleBlur = useCallback(() => {
    if (required && !inputValue.trim()) {
      setError('This field is required')
    }
  }, [required, inputValue])

  useEffect(() => {
    setInputValue(value)
  }, [value])

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={name} className="text-sm font-medium">
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        className={`${error && isDirty ? 'border-red-500' : ''}`}
        autoComplete={type === 'password' ? 'new-password' : 'off'}
      />
      {error && isDirty && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}

// Secure textarea component
interface SecureTextareaProps {
  label: string
  name: string
  placeholder?: string
  required?: boolean
  rows?: number
  maxLength?: number
  onChange?: (value: string) => void
  value?: string
  disabled?: boolean
  className?: string
}

export const SecureTextarea: React.FC<SecureTextareaProps> = ({
  label,
  name,
  placeholder,
  required = false,
  rows = 3,
  maxLength,
  onChange,
  value = '',
  disabled = false,
  className = ''
}) => {
  const [inputValue, setInputValue] = useState(value)
  const [error, setError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const rawValue = e.target.value
    const sanitizedValue = sanitizeInput(rawValue)
    
    setInputValue(sanitizedValue)
    setIsDirty(true)

    // Check max length
    if (maxLength && sanitizedValue.length > maxLength) {
      setError(`Maximum ${maxLength} characters allowed`)
    } else {
      setError(null)
    }

    if (onChange) {
      onChange(sanitizedValue)
    }
  }, [maxLength, onChange])

  const handleBlur = useCallback(() => {
    if (required && !inputValue.trim()) {
      setError('This field is required')
    }
  }, [required, inputValue])

  useEffect(() => {
    setInputValue(value)
  }, [value])

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={name} className="text-sm font-medium">
        {label}
      </Label>
      <Textarea
        id={name}
        name={name}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        className={`${error && isDirty ? 'border-red-500' : ''}`}
      />
      {error && isDirty && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      {maxLength && (
        <p className="text-xs text-muted-foreground">
          {inputValue.length}/{maxLength} characters
        </p>
      )}
    </div>
  )
}

// Secure select component
interface SecureSelectProps {
  label: string
  name: string
  options: { value: string; label: string }[]
  placeholder?: string
  required?: boolean
  onChange?: (value: string) => void
  value?: string
  disabled?: boolean
  className?: string
}

export const SecureSelect: React.FC<SecureSelectProps> = ({
  label,
  name,
  options,
  placeholder,
  required = false,
  onChange,
  value = '',
  disabled = false,
  className = ''
}) => {
  const [selectedValue, setSelectedValue] = useState(value)
  const [error, setError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  const handleChange = useCallback((newValue: string) => {
    setSelectedValue(newValue)
    setIsDirty(true)
    setError(null)

    if (onChange) {
      onChange(newValue)
    }
  }, [onChange])

  const handleBlur = useCallback(() => {
    if (required && !selectedValue) {
      setError('This field is required')
    }
  }, [required, selectedValue])

  useEffect(() => {
    setSelectedValue(value)
  }, [value])

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={name} className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Select
        value={selectedValue}
        onValueChange={handleChange}
        disabled={disabled}
      >
        <SelectTrigger
          id={name}
          name={name}
          onBlur={handleBlur}
          className={`${error && isDirty ? 'border-red-500' : ''}`}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && isDirty && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}

// Main secure form component
interface SecureFormProps {
  onSubmit: (data: FormData) => Promise<void>
  children: React.ReactNode
  className?: string
  submitText?: string
  loading?: boolean
  disabled?: boolean
}

export const SecureForm: React.FC<SecureFormProps> = ({
  onSubmit,
  children,
  className = '',
  submitText = 'Submit',
  loading = false,
  disabled = false
}) => {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (isSubmitting || disabled) return

    try {
      setIsSubmitting(true)
      
      const formData = new FormData(e.currentTarget)
      
      // Add CSRF token to form data
      formData.append('csrf_token', getCSRFToken())
      
      await onSubmit(formData)
      
      toast({
        title: 'Success',
        description: 'Form submitted successfully',
      })
    } catch (error) {
      console.error('Form submission error:', error)
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Form submission failed',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [onSubmit, isSubmitting, disabled, toast])

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {/* Hidden CSRF token field */}
      <input type="hidden" name="csrf_token" value={getCSRFToken()} />
      
      {children}
      
      <Button
        type="submit"
        disabled={disabled || isSubmitting || loading}
        className="w-full"
      >
        {isSubmitting || loading ? 'Submitting...' : submitText}
      </Button>
    </form>
  )
}

// Export CSRF utilities for use in other components
export { getCSRFToken, generateCSRFToken }
