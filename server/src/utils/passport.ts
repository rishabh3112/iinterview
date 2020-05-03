import passport from "passport";
import * as passportJWT from "passport-jwt";
import { getToken, getUser } from "./helpers";

const ExtractJwt = passportJWT.ExtractJwt;
const JwtStrategy = passportJWT.Strategy;
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromExtractors([getToken]),
  secretOrKey: process.env.JWT_KEY,
};

const strategy = new JwtStrategy(jwtOptions, async (jwtPayload, next) => {
  const user = await getUser({ id: jwtPayload.id });
  if (user) {
    next(null, user);
  } else {
    next(null, false);
  }
});

passport.use(strategy);

export default passport;
