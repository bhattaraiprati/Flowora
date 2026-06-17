import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { OrgMemberRole, OrgMemberStatus } from '../common/enums';
import { Organization } from './organization.model';
import { User } from './user.model';

interface OrganizationMemberAttributes {
  id?: string;
  org_id: string;
  user_id: string;
  role: OrgMemberRole;
  status: OrgMemberStatus;
  joined_at?: Date;
}

@Table({
  tableName: 'organization_members',   // Best practice: snake_case plural
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class OrganizationMember extends Model<OrganizationMemberAttributes> implements OrganizationMemberAttributes {
  
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => Organization)
  @Column(DataType.UUID)
  declare org_id: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare user_id: string;

  @Default(OrgMemberRole.MEMBER)
  @Column({ type: DataType.ENUM(...Object.values(OrgMemberRole)), allowNull: false })
  declare role: OrgMemberRole;

  @Default(OrgMemberStatus.ACTIVE)
  @Column({ type: DataType.ENUM(...Object.values(OrgMemberStatus)), allowNull: false })
  declare status: OrgMemberStatus;

  @CreatedAt
  declare created_at: Date;

  @UpdatedAt
  declare updated_at: Date;

  // Associations
  @BelongsTo(() => Organization)
  declare organization: Organization;

  @BelongsTo(() => User)
  declare user: User;
}