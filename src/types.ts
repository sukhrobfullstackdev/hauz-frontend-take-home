export type Role = 'property_owner' | 'realtor'

export interface Profile {
  personalAccountId: string
  firstName: string
  lastName: string
  role: Role
  contactEmail: string | null
  bio: string | null
  createdAt: string
  updatedAt: string
}

export interface AuthState {
  user: { id: string; email: string }
  profile: Profile | null
}