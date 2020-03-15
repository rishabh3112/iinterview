import express from "express"
import * as bodyParser from "body-parser"
import passport from "passport"
import cookieParser from "cookie-parser"
import cors from "cors"
import * as passportJWT from "passport-jwt"
import {Sequelize} from "sequelize-typescript"
import * as dotenv from "dotenv"
import * as jwt from "jsonwebtoken"
import { WhereOptions } from "sequelize/types"
import log from "loglevel"
import User from "./models/user"
import bcrypt from "bcrypt"

dotenv.config(); // Load environment variables
log.enableAll()

// Server constants
const port = process.env.PORT || 8080;
const app = express();
const sql =  new Sequelize(process.env.DB_HOST, {
    dialect: 'postgres',
    password: process.env.DB_PASS,
    models: [__dirname + '/models'],
    logging: false
});
const saltRounds = 9

// Helpers
const generateToken = (res: express.Response, obj: any) => {
    const expiration = 1000;
    const token = jwt.sign({ id: obj.id }, process.env.JWT_KEY, {
        expiresIn: '1d',
    });
    res.cookie('token', token, {
        expires: new Date(Date.now() + expiration),
        secure: false,
        httpOnly: false,
    });
    return token;
};

const getToken = (req: express.Request) => {
    const token: string = req.cookies.token || '';
    return token;
};

const getUser = async (obj: WhereOptions) => {
    return await User.findOne({
      where: obj,
    });
};

// Passport and JWT setup
const ExtractJwt = passportJWT.ExtractJwt;
const JwtStrategy = passportJWT.Strategy;
const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromExtractors([
        getToken
    ]),
    secretOrKey: process.env.JWT_KEY
};

const strategy = new JwtStrategy(jwtOptions, async (jwtPayload, next) =>  {
    const user = await getUser({ id: jwtPayload.id });
    if (user) {
        next(null, user);
    } else {
        next(null, false);
    }
});

passport.use(strategy);

// Express Middleware
app.use(passport.initialize())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors({
    origin: [`http://localhost:${port}`],
    credentials: true
}))
app.use(cookieParser())


// Routes
app.get( "/", async ( req: express.Request, res: express.Response ) => {
    const users = await User.findAll();
    res.send( JSON.stringify(users, null, 3) );
} );

app.post( "/register", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { name, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const user = await User.create({name, password: hashedPassword});
    res.json({
        msg: `User ${user.name} created`,
        user
    })
});

app.post('/login', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { name, password } = req.body;
    if (name && password) {
        const user = await getUser({name});
        if (!user) {
            res.status(401).json({ message: 'No such user found' });
        }
        if (await bcrypt.compare(password, user.password)) {
            const token = await generateToken(res, {id: user.id});
            res.json({ msg: 'Login sucessful', token });
        } else {
            res.status(401).json({ msg: 'Password is incorrect' });
        }
    }
});

app.get('/protected', passport.authenticate('jwt', {session: false}), (req: express.Request, res: express.Response) =>  {
    res.json(`Welcome! ${(req.user as User).name}, your password ${(req.user as User).password} is now selled`);
});


(async () => {
    try {
        await sql.sync({force: true});
        app.listen( port, () => {
            log.info( `Server started at http://localhost:${ port }\n` );
        });
    } catch (err) {
        log.info(err);
    }
})();