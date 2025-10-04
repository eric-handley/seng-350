```mermaid
erDiagram
    Users {
        uuid id PK
        string email UK
        string password_hash
        string first_name
        string last_name
        enum role
        timestamp created_at
        timestamp updated_at
    }

    Buildings {
        string short_name PK
        string name UK
        timestamp created_at
        timestamp updated_at
    }

    Rooms {
        string room_id PK "building_short_name + room_number"
        string building_short_name FK
        string room_number
        integer capacity
        enum room_type
        string url
        timestamp created_at
        timestamp updated_at
    }

    Equipment {
        uuid id PK
        string name UK
        timestamp created_at
        timestamp updated_at
    }

    RoomEquipment {
        string room_id FK
        uuid equipment_id FK
        integer quantity "nullable"
        timestamp created_at
        timestamp updated_at
    }

    Bookings {
        uuid id PK
        uuid user_id FK
        string room_id FK
        timestamptz start_time "stored as UTC"
        timestamptz end_time "stored as UTC"
        enum status
        uuid booking_series_id FK "nullable"
        timestamp created_at
        timestamp updated_at
    }

    BookingSeries {
        uuid id PK
        uuid user_id FK
        string room_id FK
        timestamptz start_time "stored as UTC"
        timestamptz end_time "stored as UTC"
        date series_end_date
        timestamp created_at
        timestamp updated_at
    }

    AuditLogs {
        uuid id PK
        uuid user_id FK
        string action
        enum entity_type
        string entity_id
        timestamp created_at
        timestamp updated_at
    }

    Users ||--o{ Bookings : "creates"
    Users ||--o{ BookingSeries : "creates"
    Users ||--o{ AuditLogs : "performs"
    Buildings ||--o{ Rooms : "contains"
    Rooms ||--o{ Bookings : "is booked"
    Rooms ||--o{ BookingSeries : "series for"
    Rooms ||--o{ RoomEquipment : "has"
    Equipment ||--o{ RoomEquipment : "in rooms"
    BookingSeries ||--o{ Bookings : "generates"
```

**Constraints**
- `start_time < end_time` (Bookings, BookingSeries)
- `series_end_date >= DATE(start_time)` (BookingSeries)

**Enum Values**
- `role`: Staff, Registrar, Admin
- `status`: Active, Cancelled  
- `room_type`: Classroom, Lecture theatre, Multi-access classroom, Flury Hall, Unknown, David Lam Auditorium
- `entity_type`: User, Building, Room, Equipment, RoomEquipment, Booking, BookingSeries

**Identifier Notes**
- Buildings are keyed by `short_name` (for example `ECS`), replacing the previous UUID-based identifier.
- Rooms are keyed by `room_id`, built from `building_short_name` + `room_number` (for example `ECS-116`). Bookings, equipment, and API requests now reference this combined value.
