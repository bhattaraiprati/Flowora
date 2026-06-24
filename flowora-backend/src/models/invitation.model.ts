import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
  Index,
} from 'sequelize-typescript';
import { Organization } from './organization.model';
import { Project } from './project.model';
import { User } from './user.model';
import { InvitationStatus, InvitationScope } from '../common/enums';

interface InvitationAttributes {
  id?: string;
  email: string;
  token: string;
  role: string;
  scope: InvitationScope;
  status: InvitationStatus;
  organization_id: string;
  project_id?: string | null;
  invited_by: string;
  accepted_by?: string | null;
  created_at?: Date;
  accepted_at?: Date | null;
  expires_at: Date;
}

@Table({
  tableName: 'invitations',
  timestamps: true,
  underscored: true,
  indexes: [
    { unique: true, fields: ['token'] },
    { fields: ['email'] },
    { fields: ['organization_id'] },
    { fields: ['project_id'] },
  ],
})
export class Invitation extends Model<InvitationAttributes> implements InvitationAttributes {
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
  declare email: string;

  @Index({ unique: true })
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    unique: true,
  })
  declare token: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  declare role: string;

  @Column({
    type: DataType.ENUM(...Object.values(InvitationScope)),
    allowNull: false,
  })
  declare scope: InvitationScope;

  @Column({
    type: DataType.ENUM(...Object.values(InvitationStatus)),
    allowNull: false,
    defaultValue: InvitationStatus.PENDING,
  })
  declare status: InvitationStatus;

  @ForeignKey(() => Organization)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'organization_id',
  })
  declare organization_id: string;

  @BelongsTo(() => Organization)
  declare organization: Organization;

  @ForeignKey(() => Project)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'project_id',
  })
  declare project_id: string | null;

  @BelongsTo(() => Project)
  declare project: Project;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'invited_by',
  })
  declare invited_by: string;

  @BelongsTo(() => User, 'invited_by')
  declare inviter: User;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'accepted_by',
  })
  declare accepted_by: string | null;

  @BelongsTo(() => User, 'accepted_by')
  declare acceptedBy: User;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    field: 'created_at',
  })
  declare created_at: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'accepted_at',
  })
  declare accepted_at: Date | null;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'expires_at',
  })
  declare expires_at: Date;

  @UpdatedAt
  @Column({
    type: DataType.DATE,
    field: 'updated_at',
  })
  declare updated_at: Date;
}