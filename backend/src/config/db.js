const oracledb = require("oracledb");

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

let pool;

async function initOraclePool() {
  if (pool) {
    return pool;
  }

  pool = await oracledb.createPool({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECT_STRING,
    poolMin: Number(process.env.ORACLE_POOL_MIN || 1),
    poolMax: Number(process.env.ORACLE_POOL_MAX || 10),
    poolIncrement: Number(process.env.ORACLE_POOL_INCREMENT || 1),
  });

  return pool;
}

async function getConnection() {
  if (!pool) {
    await initOraclePool();
  }

  return pool.getConnection();
}

async function closeOraclePool() {
  if (pool) {
    await pool.close(10);
    pool = null;
  }
}

module.exports = {
  getConnection,
  initOraclePool,
  closeOraclePool,
};
