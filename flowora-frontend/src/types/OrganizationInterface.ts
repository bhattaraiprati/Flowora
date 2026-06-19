export class RegisterOrganization {
    name!: string;
    email!: string;
    password!: string;
    organizatioName!: string;
    slug!: string;
    industry!: string;
    teamSize!: string;
    website!: string;
    description!: string;
}


export interface AdminForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
}

export interface OrgForm {
  orgName: string;
  orgSlug: string;
  industry: string;
  size: string;
  website: string;
  description: string;
}