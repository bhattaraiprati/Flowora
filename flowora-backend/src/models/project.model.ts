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
  BelongsToMany,
} from 'sequelize-typescript';
import { Organization } from './organization.model';
import { User } from './user.model';
import { ProjectMember } from './projectMember.model';
import { ProjectStatus } from '../common/enums';
import { Message } from './message.model';

export enum ProjectVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  WORKSPACE = 'WORKSPACE',
}

interface ProjectAttributes {
  id?: string;
  title: string;
  description: string | null;
  visibility: ProjectVisibility;
  status: ProjectStatus;
  org_id: string;
  created_by: string;
  color?: string;
  is_favorite?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

@Table({
  tableName: 'projects',
  timestamps: true,
  underscored: true,
})
export class Project extends Model<ProjectAttributes> implements ProjectAttributes {
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
    type: DataType.ENUM(...Object.values(ProjectVisibility)),
    allowNull: false,
    defaultValue: ProjectVisibility.WORKSPACE,
  })
  declare visibility: ProjectVisibility;

  @Column({
    type: DataType.ENUM(...Object.values(ProjectStatus)),
    allowNull: false,
    defaultValue: ProjectStatus.ACTIVE,
  })
  declare status: ProjectStatus;

  @ForeignKey(() => Organization)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'org_id',
  })
  declare org_id: string;

  @BelongsTo(() => Organization)
  declare organization: Organization;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'created_by',
  })
  declare created_by: string;

  @BelongsTo(() => User, 'created_by')
  declare creator: User;

  @Column({
    type: DataType.STRING(7),
    allowNull: true,
    defaultValue: '#6366f1',
  })
  declare color: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_favorite',
  })
  declare is_favorite: boolean;

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

  // Relations
  @HasMany(() => ProjectMember)
  declare members: ProjectMember[];

  @BelongsToMany(() => User, () => ProjectMember)
  declare users: User[];

   @HasMany(() => Message)
  declare messages: Message[];
}
