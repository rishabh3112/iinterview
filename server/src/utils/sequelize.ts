import { Sequelize } from "sequelize-typescript"
import { resolve } from "path"
import * as dotenv from "dotenv"
dotenv.config(); // Load environment variables

export default new Sequelize(process.env.DB_HOST, {
    dialect: 'postgres',
    password: process.env.DB_PASS,
    models: [resolve(__dirname, '../models')],
    logging: false
});