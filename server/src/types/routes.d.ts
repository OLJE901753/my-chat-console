declare module './routes/telemetry' {
  import { Router } from 'express';
  const router: Router;
  export default router;
}

declare module './routes/pythonAI' {
  import { Router } from 'express';
  const router: Router;
  export default router;
}

declare module './routes/netatmo' {
  import { Router } from 'express';
  const router: Router;
  export default router;
}

declare module './routes/sse' {
  import { Router } from 'express';
  export const router: Router;
}

declare module './routes/enhancedAiAgents' {
  import { Router } from 'express';
  class EnhancedAIAgentRoutes {
    setupRoutes(): Router;
  }
  export default EnhancedAIAgentRoutes;
}

declare module './routes/supabase' {
  import { Router } from 'express';
  const router: Router;
  export default router;
}

declare module './services/supabaseService' {
  class SupabaseService {
    checkHealth(): Promise<boolean>;
  }
  export default SupabaseService;
}

declare module './services/sseService' {
  class SSEService {
    getStats(): any;
  }
  export default SSEService;
}
