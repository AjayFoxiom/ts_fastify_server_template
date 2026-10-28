export interface EcosystemAppConfig {
  name: string;
  script: string;
  instances?: number | "max";
  exec_mode?: "cluster" | "fork";
  autorestart?: boolean;
  watch?: boolean | string[];
  max_memory_restart?: string;
  env?: Record<string, string>;
  env_production?: Record<string, string>;
}

export interface EcosystemConfig {
  apps: EcosystemAppConfig[];
}

const config: EcosystemConfig = {
  apps: [
    {
      name: "fastify-ts-server",
      script: "./dist/server.js",
      instances: "max",
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};

export default config;
