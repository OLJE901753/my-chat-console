declare module '../utils/logger' {
  interface Logger {
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, meta?: any): void;
    debug(message: string, meta?: any): void;
    droneCommand(command: string, params: any, result: any): void;
    droneOperation(operation: string, details: any): void;
    safetyEvent(eventType: string, severity: string, description: string, position?: any): void;
    missionUpdate(missionId: string, status: string, details: any): void;
    telemetryUpdate(telemetryData: any): void;
  }

  const logger: Logger;
  export default logger;
}
