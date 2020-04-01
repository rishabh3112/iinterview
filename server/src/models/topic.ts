import {Table, Column, Model, CreatedAt, UpdatedAt, AllowNull, Unique} from 'sequelize-typescript'
import {DataType} from 'sequelize-typescript';

@Table
export default class Topic extends Model<Topic> {

  @Column
  name: string;

  @Column(DataType.TEXT)
  description: string;
  
}