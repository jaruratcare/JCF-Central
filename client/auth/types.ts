export type Department = 
  | 'ceo-office'
  | 'pr'
  | 'carcinoma'
  | 'hr'
  | 'psy-connect'
  | 'tech'
  | 'medical-partnership'
  | 'cgmp';

export type Role = 
  | 'ceo'
  | 'founder_office_member'
  | 'hr_pod_lead'
  | 'department_pod_lead'
  | 'member';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  department: Department;
  role: Role;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
