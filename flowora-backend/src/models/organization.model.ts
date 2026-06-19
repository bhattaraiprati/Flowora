import {
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  Default,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  Unique,
  UpdatedAt,
} from 'sequelize-typescript';
import { OrganizationStatus } from '../common/enums';
import { User } from './user.model';
import { OrganizationMember } from './organizationMember.model';

@Table({
  tableName: 'organizations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [{ unique: true, fields: ['slug'] }],
})
export class Organization extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string;

  @Unique
  @Column({ type: DataType.STRING, allowNull: false })
  declare slug: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare industry: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare size: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare website: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description: string;

  @Default(OrganizationStatus.PENDING_APPROVAL)
  @Column({
    type: DataType.ENUM(...Object.values(OrganizationStatus)),
    allowNull: false,
  })
  declare status: OrganizationStatus;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare rejection_reason: string | null;

  @Column({ type: DataType.UUID, allowNull: true })
  declare approved_by: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare approved_at: Date | null;

  @CreatedAt
  declare created_at: Date;

  @UpdatedAt
  declare updated_at: Date;

  // ASSOCIATIONS 

  @HasMany(() => OrganizationMember)
  declare members: OrganizationMember[];

  @BelongsToMany(() => User, () => OrganizationMember)
  declare users: User[];
}