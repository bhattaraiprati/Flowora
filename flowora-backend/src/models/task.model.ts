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
import { Project } from './project.model';
import { User } from './user.model';
import { TaskStatus, TaskPriority } from '../common/enums';

interface TaskAttributes {
  id?: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  project_id: string;
  created_by: string;
  assigned_to?: string | null;
  due_date?: Date | null;
  start_date?: Date | null;
  estimated_hours?: number | null;
  tags?: string[];
  created_at?: Date;
  updated_at?: Date;
}

@Table({
  tableName: 'tasks',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['project_id'] },
    { fields: ['status'] },
    { fields: ['assigned_to'] },
    { fields: ['due_date'] },
  ],
})
export class Task extends Model<TaskAttributes> implements TaskAttributes {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare title: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(TaskStatus)),
    allowNull: false,
    defaultValue: TaskStatus.TODO,
  })
  declare status: TaskStatus;

  @Column({
    type: DataType.ENUM(...Object.values(TaskPriority)),
    allowNull: false,
    defaultValue: TaskPriority.MEDIUM,
  })
  declare priority: TaskPriority;

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
    field: 'created_by',
  })
  declare created_by: string;

  @BelongsTo(() => User, 'created_by')
  declare creator: User;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'assigned_to',
  })
  declare assigned_to: string | null;

  @BelongsTo(() => User, 'assigned_to')
  declare assignee: User;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'due_date',
  })
  declare due_date: Date | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'start_date',
  })
  declare start_date: Date | null;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: true,
    field: 'estimated_hours',
  })
  declare estimated_hours: number | null;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: true,
    defaultValue: [],
  })
  declare tags: string[];

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
