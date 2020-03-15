import {Table, Column, Model, CreatedAt, UpdatedAt} from 'sequelize-typescript';

@Table
export default class User extends Model<User> {

  @Column
  name: string;

  @CreatedAt
  creationDate: Date;

  @UpdatedAt
  updatedOn: Date;

}