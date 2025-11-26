export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: string | number;
  name: string;
  email: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
