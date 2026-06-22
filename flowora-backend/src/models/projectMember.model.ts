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
import { ProjectMemberRole } from '../common/enums';

interface ProjectMemberAttributes {
  id?: string;
  project_id: string;
  user_id: string;
  role: ProjectMemberRole;
  created_at?: Date;
  updated_at?: Date;
}

@Table({
  tableName: 'project_members',
  timestamps: true,
  underscored: true,
})
export class ProjectMember extends Model<ProjectMemberAttributes> implements ProjectMemberAttributes {
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
    type: DataType.ENUM(...Object.values(ProjectMemberRole)),
    allowNull: false,
    defaultValue: ProjectMemberRole.MEMBER,
  })
  declare role: ProjectMemberRole;

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
