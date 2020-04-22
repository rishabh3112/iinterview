import {Table, Column, Model, CreatedAt, UpdatedAt, AllowNull, Unique} from 'sequelize-typescript'
import {DataType} from 'sequelize-typescript';

@Table
export default class Question extends Model<Question> {

  @AllowNull(false)
  @Column
  name: string;

  @Column(DataType.TEXT)
  description: string;

  @AllowNull(false)
  @Column
  rating: number;

  @CreatedAt
  creationDate: Date;

  @UpdatedAt
  updatedOn: Date;

}