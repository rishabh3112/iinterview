import {Table, Column, Model, CreatedAt, UpdatedAt, AllowNull, Unique, ForeignKey} from 'sequelize-typescript'
import {DataType} from 'sequelize-typescript';
import Topic from "./topic";
import Question from "./question";

@Table
export default class PartOf extends Model<PartOf> {

  @ForeignKey(() => Topic)
  @AllowNull(false)
  @Column
  topicId: number;

  @ForeignKey(() => Question)
  @AllowNull(false)
  @Column
  questionId: number;

}