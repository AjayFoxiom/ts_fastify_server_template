import "dotenv/config";
import { buildApp } from "./app.js";

const startServer = async () => {
  const app = await buildApp();

  // Propagate unhandled promise rejections to the logger before crashing.
  process.on("unhandledRejection", (reason) => {
    app.log.fatal({ reason }, "Unhandled promise rejection — shutting down");
    process.exit(1);
  });

  // Graceful shutdown with force-exit safety net
  const shutdown = async (signal: string) => {
    app.log.info(`Received ${signal}, closing server gracefully…`);
    // Give in-flight requests 10 s to drain; then hard-exit to avoid hanging pods.
    const forceExit = setTimeout(() => {
      app.log.error("Graceful shutdown timed out — forcing exit");
      process.exit(1);
    }, 10_000);
    forceExit.unref();

    try {
      await app.close();
      app.log.info("Server closed successfully.");
      process.exit(0);
    } catch (err) {
      app.log.error({ err }, "Error during server close");
      process.exit(1);
    }
  };

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => void shutdown(signal));
  }

  try {
    const { PORT, HOST } = app.config;
    await app.listen({ port: PORT, host: HOST });

    const displayHost = HOST === "0.0.0.0" ? "localhost" : HOST;
    app.log.info(`🚀 Server running on http://${displayHost}:${PORT}`);
    app.log.info(`📖 Swagger documentation: http://${displayHost}:${PORT}/docs`);
    app.log.info(`🩺 Health check: http://${displayHost}:${PORT}/api/health`);
  } catch (error) {
    app.log.fatal({ err: error }, "Failed to start server");
    process.exit(1);
  }
};

startServer();
