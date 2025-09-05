import { useState, useCallback } from 'react';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  success: boolean;
}

export interface AsyncOperationOptions<T = unknown> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

export function useAsyncOperation<T = unknown>(
  initialData: T | null = null,
  options: AsyncOperationOptions<T> = {}
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    loading: false,
    error: null,
    success: false,
  });

  const execute = useCallback(async (
    operation: () => Promise<T>,
    customOptions: AsyncOperationOptions<T> = {}
  ) => {
    const mergedOptions = { ...options, ...customOptions };
    
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      success: false,
    }));

    try {
      const result = await operation();
      
      setState({
        data: result,
        loading: false,
        error: null,
        success: true,
      });

      if (mergedOptions.onSuccess) {
        mergedOptions.onSuccess(result);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        success: false,
      }));

      if (mergedOptions.onError) {
        mergedOptions.onError(error instanceof Error ? error : new Error(errorMessage));
      }

      throw error;
    }
  }, [options]);

  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
      success: false,
    });
  }, [initialData]);

  const setError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      error,
      loading: false,
      success: false,
    }));
  }, []);

  const setData = useCallback((data: T) => {
    setState(prev => ({
      ...prev,
      data,
      error: null,
      success: true,
    }));
  }, []);

  return {
    ...state,
    execute,
    reset,
    setError,
    setData,
  };
}
