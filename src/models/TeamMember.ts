export interface ITeamMember {
  id: number;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Member" | "Viewer";
  status: "Active" | "Pending";
  avatar?: string | null;
  phone?: string | null;
  location?: string | null;
  position?: string | null;
  bio?: string | null;
  company?: string | null; // DB'de yoksa kaldırabilirsin
  joinedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITeamMemberDbRow {
  id: number;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Member" | "Viewer";
  status: "Active" | "Pending";
  avatar?: string;
  phone?: string;
  location?: string;
  position?: string;
  bio?: string;
  company?: string;
  joined_at?: string | Date;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export function mapTeamMember(row: ITeamMemberDbRow): ITeamMember {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    avatar: row.avatar ?? null,
    phone: row.phone ?? null,
    location: row.location ?? null,
    position: row.position ?? null,
    bio: row.bio ?? null,
    company: row.company ?? null,
    joinedAt: row.joined_at ? new Date(row.joined_at) : new Date(),
    createdAt: row.created_at ? new Date(row.created_at) : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
  };
}
