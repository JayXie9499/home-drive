export interface User {
  id: string;
  username: string;
  display_name: string;
  password_hash: string;
}

export interface Item {
  id: string;
  owner_id: string;
  parent_id?: string;
  name: string;
  size: number;
  mime?: string;
  is_folder: boolean;
}
