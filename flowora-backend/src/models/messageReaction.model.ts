import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Message } from './message.model';
import { User } from './user.model';

interface MessageReactionAttributes {
  id?: string;
  message_id: string;
  user_id: string;
  emoji: string;
}

@Table({
  tableName: 'message_reactions',
  timestamps: false,
  underscored: true,
  indexes: [
    { unique: true, fields: ['message_id', 'user_id', 'emoji'] },
  ],
})
export class MessageReaction extends Model<MessageReactionAttributes> implements MessageReactionAttributes {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Message)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'message_id',
  })
  declare message_id: string;

  @BelongsTo(() => Message)
  declare message: Message;

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
    type: DataType.STRING(10),
    allowNull: false,
  })
  declare emoji: string;
}
