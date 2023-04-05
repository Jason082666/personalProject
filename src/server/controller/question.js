import { generateQuestionByPlayer } from "../middleware/question.js";
import {
  updateNewPopById,
  insertQuestionIntoES,
  addPopIntoMongo,
  searchQuestionText,
} from "../models/question.js";
import { model } from "../../util/openaimodel.js";
import errors from "../models/errorhandler.js";

export const insertQuestionByPlayerIntoES = async (req, res, next) => {
  const { question } = req;
  const result = await insertQuestionIntoES(question);
  res.json({ data: result });
};

// insertQuestionByPlayerIntoES().then(console.log);

// TODO: 當使用者點即由系統提供的題目時觸發，之後再轉成(res,req)的形式，或者可以交給queque做
export const updateNewPoptoMongoAndES = async (req, res, next) => {
  if (!req.body.id || !req.body.num)
    return next(
      new errors.CustomError("Lacking question id or question num", 400)
    );
  const { id, num } = req.body;
  await addPopIntoMongo(id, num);
  const result = await updateNewPopById(id, num);
  res.json({ data: { result: result.result } });
};

export const searchRelatedQuizz = async (req, res, next) => {
  if (!req.query.q || !req.query.type)
    return next(
      new errors.CustomError("Lacking question keywords or question type", 400)
    );
  if (!model[req.query.type])
    return next(new errors.CustomError("Wrong question type", 400));
  const { q, type } = req.query;
  const result = await searchQuestionText(q, model[type]);
  const resultarray = result.map((e) => {
    return e._source;
  });
  res.json({ data: resultarray });
};
