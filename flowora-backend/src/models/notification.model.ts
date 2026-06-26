import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { User } from './user.model';
import { Task } from './task.model';
import { Project } from './project.model';
import { NotificationType, ReferenceType } from '../common/enums';

interface NotificationAttributes {
  id?: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  reference_type?: ReferenceType | null;
  reference_id: string | null;
  is_read: boolean;
  read_at?: Date | null;
  metadata?: Record<string, any>;
  created_at?: Date;
  updated_at?: Date;
}

@Table({
  tableName: 'notifications',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['is_read'] },
    { fields: ['created_at'] },
    { fields: ['type'] },
    { fields: ['reference_type', 'reference_id'] },
  ],
})
export class Notification extends Model<NotificationAttributes> implements NotificationAttributes {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

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
    type: DataType.ENUM(...Object.values(NotificationType)),
    allowNull: false,
  })
  declare type: NotificationType;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare title: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare message: string;

  @Column({
    type: DataType.ENUM(...Object.values(ReferenceType)),
    allowNull: true,
    field: 'reference_type',
  })
  declare reference_type: ReferenceType | null;

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'reference_id',
  })
  declare reference_id: string | null;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_read',
  })
  declare is_read: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'read_at',
  })
  declare read_at: Date | null;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  declare metadata: Record<string, any>;

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
}