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
import { getUser, generateToken, getTopic, getNextQuestion } from './utils/helpers'
import Topic from "./models/topic"
import * as nunjucks from "nunjucks"

dotenv.config(); // Load environment variables
log.enableAll()

// Server constants
const port = process.env.PORT || 8080;
const app = express();
const saltRounds = 11


// Express Middleware
app.use(express.static(path.join(__dirname, "../public")))
app.use(passport.initialize())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors({
    origin: [`http://localhost:${port}`],
    credentials: true
}))
app.use(cookieParser())

// Setup view engine using nunchucks
nunjucks.configure(path.join(__dirname, "../views"), {
    autoescape: true,
    express: app
})
app.set('view engine', 'html');

// Routes
app.get( "/", async ( req: express.Request, res: express.Response, next: express.NextFunction ) => {
    passport.authenticate('jwt', (err, user, info) => {
        return res.render("index.html", {title: process.env.TITLE, user});
    })(req, res, next);
});


app.post(
    "/admin/question/add",
    passport.authenticate('jwt', {session: false}),
    async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        if ((req.user as User).username !== "admin") {
            res.status(401).json("Unauthorised");
            return;
        }

        const { name, description, rating, topic } = req.body;
        const topicExist = await getTopic({id: topic});
        if (!topicExist) {
            return res.status(401).json("Topic doesn't exist");
        }
        try {
            const question = await Question.create({name, description, rating});
            const relation = await PartOf.create({topicId: topic, questionId: question.id});
            res.redirect("/admin");
        } catch (err) {
            res.status(401).json({msg: 'Error is encountered while creating question'});
        }
    }
)

app.post(
    "/admin/topic/add",
    passport.authenticate('jwt', {session: false}),
    async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        if ((req.user as User).username !== "admin") {
            res.status(401).json("Unauthorised");
            return;
        }

        const { name, description } = req.body;
        try {
            const question = await Topic.create({name, description});
            res.redirect("/admin")
        } catch (err) {
            res.status(401).json({msg: 'Error is encountered while creating topic'});
        }
    }
)

app.post(
    "/admin/topic/update/:id(\\d+)",
    passport.authenticate('jwt', {session: false}),
    async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        if ((req.user as User).username !== "admin") {
            res.status(401).json("Unauthorised");
            return;
        }

        const { name, description } = req.body;
        try {
            const topic = await Topic.findOne({
                where: { id: req.params.id }
            });

            if (!topic) {
                res.status(401).json({msg: 'Topic not found.'});
            }
            topic.name = name;
            topic.description = description;
            await topic.save()

            res.redirect("/admin");
        } catch (err) {
            res.status(401).json({msg: 'Error is encountered while update topic'});
        }
    }
)

app.get(
    "/admin/topic/remove/:id(\\d+)",
    passport.authenticate('jwt', {session: false}),
    async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        if ((req.user as User).username !== "admin") {
            res.status(401).json("Unauthorised");
            return;
        }
        try {
            const topic = await Topic.findOne({
                where: { id: req.params.id }
            });

            if (!topic) {
                res.status(401).json({msg: 'Topic not found.'});
            }

            topic.destroy();
            res.redirect("/admin");
        } catch (err) {
            res.status(401).json({msg: 'Error is encountered while deleting topic'});
        }
    }
)


app.post(
    "/admin/question/update/:id(\\d+)",
    passport.authenticate('jwt', {session: false}),
    async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        if ((req.user as User).username !== "admin") {
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

            res.redirect("/admin");
        } catch (err) {
            res.status(401).json({msg: 'Error is encountered while update question'});
        }
    }
)

app.get(
    "/admin/question/remove/:id(\\d+)",
    passport.authenticate('jwt', {session: false}),
    async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        if ((req.user as User).username !== "admin") {
            res.status(401).json("Unauthorised");
            return;
        }
        try {
            const question = await Question.findOne({
                where: { id: req.params.id }
            });

            if (!question) {
                res.status(401).json({msg: 'Question not found.'});
            }

            question.destroy();
            res.redirect("/admin");
        } catch (err) {
            res.status(401).json({msg: 'Error is encountered while deleting question'});
        }
    }
)

app.get(
    "/admin/topic/:id(\\d+)",
    passport.authenticate('jwt', {session: false}),
    async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        if ((req.user as User).username !== "admin") {
            res.status(401).json("Unauthorised");
            return;
        }
        const topic = await Topic.findOne({
            where: {
                id: req.params.id
            }
        })
        return res.render('topic.html', {
            title: "topic",
            topic,
            user: req.user
        })
    }
)

app.get(
    "/admin",
    passport.authenticate('jwt', {session: false}),
    async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        if ((req.user as User).username !== "admin") {
            res.status(401).json("Unauthorised");
            return;
        }
        const allQuestions = await Question.findAll();
        const allTopics = await Topic.findAll();
        return res.render('admin.html', {
            title: "admin",
            questions: allQuestions,
            topics: allTopics,
            user: req.user
        })
    }
)

app.get(
    "/admin/question/:id(\\d+)",
    passport.authenticate('jwt', {session: false}),
    async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        if ((req.user as User).username !== "admin") {
            res.status(401).json("Unauthorised");
            return;
        }
        const question = await Question.findOne({
            where: {
                id: req.params.id
            }
        })
        const allTopics = await Topic.findAll();
        return res.render('question.html', {
            title: "question",
            question,
            topics: allTopics
        })
    }
)

app.get(
    "/question/:id(\\d+)",
    passport.authenticate('jwt', {session: false}),
    async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const question = await Question.findOne({
            where: {
                id: req.params.id
            }
        })
        return res.render('ques.html', {
            title: "question",
            user: req.user,
            question,
        })
    }
)

/*
 *   Authentication routes
 */
app.post('/login', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { username, password } = req.body;
    if (username && password) {
        const user = await getUser({username});
        if (!user) {
            return res.status(401).redirect('/auth?e=' + encodeURIComponent('Incorrect username or password'));
        }
        if (await bcrypt.compare(password, user.password)) {
            const token = await generateToken({id: user.id});
            res.cookie('token', token, {
                expires: new Date(Date.now() + 8 * 3600000),
                secure: false,
                httpOnly: false,
            });
            res.status(200).redirect('/dashboard');
        } else {
            return res.status(401).redirect('/auth?e=' + encodeURIComponent('Incorrect username or password'));
        }
    }
});

app.post( "/register", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { name, password, username } = req.body;
    const userExist = await getUser({username});
    if (userExist) {
        return res.status(401).redirect('/auth?e=' + encodeURIComponent('Username already taken'));
    }
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const user = await User.create({name, password: hashedPassword, username});
    return res.redirect("/auth");
});

app.get('/logout', passport.authenticate("jwt", {session: false}), async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.clearCookie('token');
    req.logOut();
    res.redirect('/');
})

app.get('/auth', (req: express.Request, res: express.Response) => {
    if (req.query.e) {
        res.render("auth.html", { title: "auth", message: req.query.e.replace(/<[^>]*>?/gm, '') });
        return;
    }
    res.render("auth.html", { title: "auth"});
})

app.get('/dashboard', passport.authenticate('jwt', {session: false}), async (req: express.Request, res: express.Response) =>  {
    const allQuestions = await Question.findAll();
    const allTopics = await Topic.findAll();
    const user = await getUser({id: (req.user as User).id});
    const nextQuestion = await getNextQuestion(user);
    res.render("dashboard.html", {
        title: "dashboard",
        user: req.user,
        questions: allQuestions,
        recommendedQuestion: nextQuestion,
        topics: allTopics
    });
});


(async () => {
    try {
        await sql.sync();
        // const hashedPassword = await bcrypt.hash(process.env.ADMINPASS, saltRounds);
        // await User.create({name: "admin", password: hashedPassword, username: "admin"});
        app.listen( port, () => {
            log.info( `Server started at http://localhost:${ port }\n` );
        });
    } catch (err) {
        log.info(err);
    }
})();