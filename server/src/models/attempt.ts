import {Table, Column, Model, CreatedAt, UpdatedAt, AllowNull, Unique, ForeignKey} from 'sequelize-typescript'
import {DataType} from 'sequelize-typescript';
import User from "./user";
import Question from "./question";


@Table
export default class Attempts extends Model<Attempts> {

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column
  userId: number;

  @ForeignKey(() => Question)
  @AllowNull(false)
  @Column
  questionId: number;

  @AllowNull(false)
  @Column
  status: boolean;

  @Column(DataType.TEXT)
  solution : string;

  @CreatedAt
  creationDate: Date;

  @UpdatedAt
  updatedOn: Date;

}