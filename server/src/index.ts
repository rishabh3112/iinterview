import express from "express"
import {Sequelize} from 'sequelize-typescript';
import User from "./models/user"
import * as dotenv from "dotenv"

dotenv.config(); // Load environment variables

const port = process.env.PORT || 8080;
const app = express();
const sql =  new Sequelize(process.env.DB_HOST, {
    dialect: 'postgres',
    password: process.env.DB_PASS,
    models: [__dirname + '/models'],
});

(async () => {
    try {
        await sql.sync({force: true});

        app.get( "/", async ( req: express.Request, res: express.Response ) => {
            const users = await User.findAll();
            res.send( JSON.stringify(users, null, 3) );
        } );

        app.listen( port, () => {
            process.stdout.write( `server started at http://localhost:${ port }` );
        } );
    } catch (err) {
        process.stdout.write(err);
    }
})();