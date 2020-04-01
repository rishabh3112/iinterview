import * as jwt from "jsonwebtoken"
import { Response, Request } from "express"
import { WhereOptions } from "sequelize/types"
import User from "../models/user"

export const generateToken = (res: Response, obj: any) => {
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

export const getToken = (req: Request) => {
    const token: string = req.cookies.token || '';
    return token;
};

export const getUser = async (obj: WhereOptions) => {
    return await User.findOne({
      where: obj,
    });
};