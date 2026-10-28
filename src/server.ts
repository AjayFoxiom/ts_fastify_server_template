import { buildApp } from "./app.js";
import { env } from "./config/env.js";

const startServer = async () => {
  const app = await buildApp();

  // Graceful shutdown handling
  const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
  for (const signal of signals) {
    process.on(signal, async () => {
      app.log.info(`Received ${signal}, closing server gracefully...`);
      try {
        await app.close();
        app.log.info("Server closed successfully.");
        process.exit(0);
      } catch (err) {
        app.log.error({ err }, "Error during server close");
        process.exit(1);
      }
    });
  }

  try {
    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    const displayHost = env.HOST === "0.0.0.0" ? "localhost" : env.HOST;
    app.log.info(`🚀 Server running on http://${displayHost}:${env.PORT}`);
    app.log.info(`📖 Swagger documentation: http://${displayHost}:${env.PORT}/docs`);
    app.log.info(`🩺 Health check: http://${displayHost}:${env.PORT}/api/health`);
  } catch (error) {
    app.log.fatal({ err: error }, "Failed to start server");
    process.exit(1);
  }
};

startServer();
