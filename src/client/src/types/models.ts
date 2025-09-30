// src/types/models.ts

export type User = {
    id: string
    name: string
    role: 'staff' | 'admin' | 'registrar'
    email: string
}