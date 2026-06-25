import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { Project } from './project.model';
import { User } from './user.model';
import { MessageReaction } from './messageReaction.model';

interface MessageAttributes {
  id?: string;
  project_id: string;
  user_id: string;
  message: string;
  reply_to?: string | null;
  is_edited: boolean;
  created_at?: Date;
  updated_at?: Date;
}

@Table({
  tableName: 'messages',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['project_id', 'created_at'] },
    { fields: ['user_id'] },
  ],
})
export class Message extends Model<MessageAttributes> implements MessageAttributes {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Project)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'project_id',
  })
  declare project_id: string;

  @BelongsTo(() => Project)
  declare project: Project;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'user_id',
  })
  declare user_id: string;

  @BelongsTo(() => User)
  declare user: User;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare message: string;


  @BelongsTo(() => Message, 'reply_to')
  declare replyToMessage: Message;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_edited',
  })
  declare is_edited: boolean;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    field: 'created_at',
  })
  declare created_at: Date;

  @UpdatedAt
  @Column({
    type: DataType.DATE,
    field: 'updated_at',
  })
  declare updated_at: Date;

  @HasMany(() => MessageReaction)
  declare reactions: MessageReaction[];
}
