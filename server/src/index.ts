import express from "express"
import * as bodyParser from "body-parser"
import cookieParser from "cookie-parser"
import cors from "cors"
import * as dotenv from "dotenv"
import log from "loglevel"
import bcrypt from "bcrypt"
import * as path from "path"
import User from "./models/user"
import Question from "./models/question"
import PartOf from "./models/partof"
import sql from "./utils/sequelize"
import passport from './utils/passport'
import { getUser, generateToken } from './utils/helpers'

dotenv.config(); // Load environment variables
log.enableAll()

// Server constants
const port = process.env.PORT || 8080;
const app = express();
const saltRounds = 11

// Express Middleware
app.use(express.static(path.resolve(__dirname, "../client/dist/")))
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
    res.send( "Serve client" );
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

app.post(
    "/admin/question/add",
    passport.authenticate('jwt', {session: false}),
    async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        if ((req.user as User).name != "admin") {
            res.status(401).json("Unauthorised");
            return;
        }
        
        const { name, description, rating, topic } = req.body;
        try {
            const question = await Question.create({name, description, rating});
            const relation = await PartOf.create({topicId: topic, questionId: question.id});
            res.json("Question created");
        } catch (err) {
            res.status(401).json({msg: 'Error is encountered while creating question'});
        }
    }
)

app.post(
    "/admin/topic/add",
    passport.authenticate('jwt', {session: false}),
    async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        if ((req.user as User).name != "admin") {
            res.status(401).json("Unauthorised");
            return;
        }

        const { name, description } = req.body;
        try {
            const question = await Question.create({name, description});
            res.json("Topic Created");
        } catch (err) {
            res.status(401).json({msg: 'Error is encountered while creating topic'});
        }
    }
)

app.post(
    "/admin/question/update/:id",
    passport.authenticate('jwt', {session: false}),
    async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        if ((req.user as User).name != "admin") {
            res.status(401).json("Unauthorised");
            return;
        }

        const { name, description, rating, topic } = req.body;
        try {
            const question = await Question.findOne({
                where: { id: req.params.id }
            });

            if (!question) {
                res.status(401).json({msg: 'Question not found.'});
            }
            question.name = name;
            question.description = description;
            question.rating = rating;
            await question.save()

            res.json("Question updated.");
        } catch (err) {
            res.status(401).json({msg: 'Error is encountered while update question'});
        }
    }
)

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