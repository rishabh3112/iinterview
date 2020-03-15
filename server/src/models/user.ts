import {Table, Column, Model, CreatedAt, UpdatedAt, AllowNull} from 'sequelize-typescript'
import {DataType} from 'sequelize-typescript';

@Table
export default class User extends Model<User> {

  @Column
  name: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  password: string;

  @CreatedAt
  creationDate: Date;

  @UpdatedAt
  updatedOn: Date;

}