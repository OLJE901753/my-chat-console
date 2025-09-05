import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { droneApi, missionApi } from '@/services/api/droneApi';
import { useDroneStore } from '@/stores/droneStore';
import { Mission } from '@/stores/droneStore';

// Query keys
export const droneQueryKeys = {
  all: ['drone'] as const,
  status: () => [...droneQueryKeys.all, 'status'] as const,
  commandHistory: (limit: number) => [...droneQueryKeys.all, 'commandHistory', limit] as const,
  photos: (limit: number) => [...droneQueryKeys.all, 'photos', limit] as const,
  recordings: (limit: number) => [...droneQueryKeys.all, 'recordings', limit] as const,
  missions: () => [...droneQueryKeys.all, 'missions'] as const,
};

// Drone status query
export const useDroneStatus = () => {
  const updateStatus = useDroneStore((state) => state.updateStatus);
  
  return useQuery({
    queryKey: droneQueryKeys.status(),
    queryFn: droneApi.getStatus,
    refetchInterval: 1000, // Refetch every second for real-time updates
    onSuccess: (data) => {
      updateStatus(data);
    },
    onError: (error) => {
      console.error('Failed to fetch drone status:', error);
    },
  });
};

// Command history query
export const useCommandHistory = (limit: number = 50) => {
  return useQuery({
    queryKey: droneQueryKeys.commandHistory(limit),
    queryFn: () => droneApi.getCommandHistory(limit),
    staleTime: 30000, // 30 seconds
  });
};

// Photos query
export const usePhotos = (limit: number = 20) => {
  return useQuery({
    queryKey: droneQueryKeys.photos(limit),
    queryFn: () => droneApi.getPhotos(limit),
    staleTime: 60000, // 1 minute
  });
};

// Recordings query
export const useRecordings = (limit: number = 20) => {
  return useQuery({
    queryKey: droneQueryKeys.recordings(limit),
    queryFn: () => droneApi.getRecordings(limit),
    staleTime: 60000, // 1 minute
  });
};

// Missions query
export const useMissions = () => {
  const setMissions = useDroneStore((state) => state.setMissions);
  
  return useQuery({
    queryKey: droneQueryKeys.missions(),
    queryFn: missionApi.getMissions,
    staleTime: 30000, // 30 seconds
    onSuccess: (data) => {
      setMissions(data);
    },
  });
};

// Drone command mutations
export const useDroneCommand = () => {
  const queryClient = useQueryClient();
  const setLoading = useDroneStore((state) => state.setLoading);
  const setError = useDroneStore((state) => state.setError);
  
  return useMutation({
    mutationFn: droneApi.executeCommand,
    onMutate: () => {
      setLoading(true);
      setError(null);
    },
    onSuccess: () => {
      // Invalidate and refetch drone status
      queryClient.invalidateQueries({ queryKey: droneQueryKeys.status() });
      queryClient.invalidateQueries({ queryKey: droneQueryKeys.commandHistory(50) });
    },
    onError: (error) => {
      setError(error.message);
    },
    onSettled: () => {
      setLoading(false);
    },
  });
};

// Connect/Disconnect mutations
export const useDroneConnection = () => {
  const queryClient = useQueryClient();
  const setConnected = useDroneStore((state) => state.setConnected);
  const setLoading = useDroneStore((state) => state.setLoading);
  const setError = useDroneStore((state) => state.setError);
  
  const connectMutation = useMutation({
    mutationFn: droneApi.connect,
    onMutate: () => {
      setLoading(true);
      setError(null);
    },
    onSuccess: () => {
      setConnected(true);
      queryClient.invalidateQueries({ queryKey: droneQueryKeys.status() });
    },
    onError: (error) => {
      setError(error.message);
    },
    onSettled: () => {
      setLoading(false);
    },
  });
  
  const disconnectMutation = useMutation({
    mutationFn: droneApi.disconnect,
    onMutate: () => {
      setLoading(true);
      setError(null);
    },
    onSuccess: () => {
      setConnected(false);
      queryClient.invalidateQueries({ queryKey: droneQueryKeys.status() });
    },
    onError: (error) => {
      setError(error.message);
    },
    onSettled: () => {
      setLoading(false);
    },
  });
  
  return {
    connect: connectMutation.mutate,
    disconnect: disconnectMutation.mutate,
    isConnecting: connectMutation.isPending,
    isDisconnecting: disconnectMutation.isPending,
  };
};

// Mission mutations
export const useMissionMutations = () => {
  const queryClient = useQueryClient();
  const setLoading = useDroneStore((state) => state.setLoading);
  const setError = useDroneStore((state) => state.setError);
  const setActiveMission = useDroneStore((state) => state.setActiveMission);
  
  const createMission = useMutation({
    mutationFn: missionApi.createMission,
    onMutate: () => {
      setLoading(true);
      setError(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: droneQueryKeys.missions() });
    },
    onError: (error) => {
      setError(error.message);
    },
    onSettled: () => {
      setLoading(false);
    },
  });
  
  const updateMission = useMutation({
    mutationFn: ({ missionId, updates }: { missionId: string; updates: Partial<Mission> }) =>
      missionApi.updateMission(missionId, updates),
    onMutate: () => {
      setLoading(true);
      setError(null);
    },
    onSuccess: (updatedMission) => {
      queryClient.invalidateQueries({ queryKey: droneQueryKeys.missions() });
      if (updatedMission.status === 'active') {
        setActiveMission(updatedMission);
      }
    },
    onError: (error) => {
      setError(error.message);
    },
    onSettled: () => {
      setLoading(false);
    },
  });
  
  const deleteMission = useMutation({
    mutationFn: missionApi.deleteMission,
    onMutate: () => {
      setLoading(true);
      setError(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: droneQueryKeys.missions() });
    },
    onError: (error) => {
      setError(error.message);
    },
    onSettled: () => {
      setLoading(false);
    },
  });
  
  const startMission = useMutation({
    mutationFn: missionApi.startMission,
    onMutate: () => {
      setLoading(true);
      setError(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: droneQueryKeys.missions() });
      queryClient.invalidateQueries({ queryKey: droneQueryKeys.status() });
    },
    onError: (error) => {
      setError(error.message);
    },
    onSettled: () => {
      setLoading(false);
    },
  });
  
  const pauseMission = useMutation({
    mutationFn: missionApi.pauseMission,
    onMutate: () => {
      setLoading(true);
      setError(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: droneQueryKeys.missions() });
    },
    onError: (error) => {
      setError(error.message);
    },
    onSettled: () => {
      setLoading(false);
    },
  });
  
  const stopMission = useMutation({
    mutationFn: missionApi.stopMission,
    onMutate: () => {
      setLoading(true);
      setError(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: droneQueryKeys.missions() });
      setActiveMission(null);
    },
    onError: (error) => {
      setError(error.message);
    },
    onSettled: () => {
      setLoading(false);
    },
  });
  
  return {
    createMission: createMission.mutate,
    updateMission: (missionId: string, updates: Partial<Mission>) => 
      updateMission.mutate({ missionId, updates }),
    deleteMission: deleteMission.mutate,
    startMission: startMission.mutate,
    pauseMission: pauseMission.mutate,
    stopMission: stopMission.mutate,
    isCreating: createMission.isPending,
    isUpdating: updateMission.isPending,
    isDeleting: deleteMission.isPending,
    isStarting: startMission.isPending,
    isPausing: pauseMission.isPending,
    isStopping: stopMission.isPending,
  };
};
