const dotenv = require("dotenv");
const app = require("./app");
const { initOraclePool, closeOraclePool } = require("./config/db");

dotenv.config();

const port = Number(process.env.PORT || 3000);

async function start() {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET nao configurado. Defina essa variavel no arquivo .env.");
    }

    await initOraclePool();

    const server = app.listen(port, () => {
      console.log(`Servidor backend em execucao na porta ${port}`);
    });

    const gracefulShutdown = async (signal) => {
      console.log(`Recebido sinal ${signal}. Encerrando aplicacao...`);
      server.close(async () => {
        await closeOraclePool();
        process.exit(0);
      });
    };

    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  } catch (error) {
    console.error("Falha ao iniciar a aplicacao:", error);
    process.exit(1);
  }
}

start();
