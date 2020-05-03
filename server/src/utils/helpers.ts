import * as jwt from "jsonwebtoken";
import { Response, Request } from "express";
import { WhereOptions } from "sequelize/types";
import User from "../models/user";
import Question from "../models/question";
import Topic from "../models/topic";
import Attempt from "../models/attempt";
const recommend = require("collaborative-filter");

export const generateToken = (obj: any) => {
  const token = jwt.sign({ id: obj.id }, process.env.JWT_KEY, {
    expiresIn: "1d",
  });
  return token;
};

export const getToken = (req: Request) => {
  const token: string = req.cookies.token || "";
  return token;
};

export const getUser = async (obj: WhereOptions) => {
  return await User.findOne({
    where: obj,
  });
};

export const getQuestion = async (obj: WhereOptions) => {
  return Question.findOne({
    where: obj,
  });
};

export const getTopic = async (obj: WhereOptions) => {
  return Topic.findOne({
    where: obj,
  });
};

export const getNextQuestion = async (user: User) => {
  const allQuestions = await Question.findAll();
  const allUsers = await User.findAll();

  if (allQuestions.length === 0) {
    return undefined;
  }

  const collaboration = new Array(allUsers.length);
  for (let i = 0; i < collaboration.length; i++) {
    collaboration[i] = new Array(allQuestions.length);
  }

  let userIndex = -1;
  for (let u = 0; u < allUsers.length; u++) {
    if (allUsers[u].id === user.id) {
      process.stdout.write(user.id);
      userIndex = u;
    }
    for (let q = 0; q < allQuestions.length; q++) {
      collaboration[u][q] = 0;
      const attempt = await Attempt.findOne({
        where: {
          userId: allUsers[u].id,
          questionId: allQuestions[q].id,
        },
      });
      if (!attempt || !attempt.status) {
        continue;
      }
      collaboration[u][q] = 1;
    }
  }

  if (userIndex === -1) {
    throw Error("Invalid user supplied");
  }

  const results = recommend.cFilter(collaboration, 0);
  if (results[0] === -1) {
    return allQuestions[0];
  }
  return allQuestions[results[0]];
};
