

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


interface statas{
    project: string;
    taskDue: string;
    members: string;
    completedTask: string;
}
interface recentActivity {
    message: string
    board: string;
    time: string
}
interface recentBoard{
    boardName: string;
    industry: string;
    status: string;
    time: string
}
export interface dashboardDetails{
    statas:statas;
    recentActivity: recentActivity[];
    recentBoard: recentBoard[];
}