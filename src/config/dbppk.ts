import dotenv from "dotenv";
dotenv.config();
import { Sequelize, Dialect } from "sequelize";

const dbDialect = (process.env.DBPPK_DIALECT || process.env.DB_DIALECT || "mysql") as Dialect;

const sequelizePpk = new Sequelize(
  (process.env.DBPPK_NAME || "") as string,
  (process.env.DBPPK_USER || "root") as string,
  (process.env.DBPPK_PASS || "") as string,
  {
    host: process.env.DBPPK_HOST || "127.0.0.1",
    dialect: dbDialect,
    port: Number(process.env.PORTPPK || process.env.DBPPK_PORT) || 3306,
    logging: false,
  }
);

export default sequelizePpk;
