```mermaid
classDiagram
direction LR

class Monolith {
  +HTTP_REST
  +AuthN_AuthZ_RBAC
  +Health_and_Metrics
  +Audit_Logging
}

class WebUI {
  +Sign_in_out
  +Availability_search
  +One_click_book_cancel
  +My_bookings_history
  +Registrar_console
  +Admin_health_audit
}

class AuthRBAC {
  +Sessions_JWT
  +Role_checks
}

class AvailabilityModule {
  +Search_filters
  +Pagination
}

class BookingModule {
  +Create_booking
  +Cancel_booking
  +Rollback_Undo
  +Series_weekly_term
  +Conflict_resolution
}

class RegistrarModule {
  +Classroom_timeslot_maintenance
  +Manual_release_blocks
  +Integrity_management
}

class AdminModule {
  +System_config
  +Health_page
  +Audit_records
}

class AnalyticsModule {
  +Daily_bookings
  +Top_N_rooms
}

class CSVIngestModule {
  +Load_classrooms_csv
  +Validate_expand_schema
}

class AcceptanceTests {
  +API_flow_tests
  +Concurrency_tests
  +Docker_run_tests
}

class Postgres
class Redis
class SMTP
class DockerCompose

%% Containment / dependencies
Monolith *-- WebUI
Monolith *-- AuthRBAC
Monolith *-- AvailabilityModule
Monolith *-- BookingModule
Monolith *-- RegistrarModule
Monolith *-- AdminModule
Monolith *-- AnalyticsModule
Monolith *-- CSVIngestModule
Monolith *-- AcceptanceTests

AvailabilityModule ..> Postgres : reads availability
AvailabilityModule ..> Redis : cache lookup/fill
BookingModule ..> Postgres : tx + row locks
BookingModule ..> Redis : invalidate availability cache
RegistrarModule ..> Postgres : manage rooms/timeslots
AdminModule ..> Postgres : audits/health state
AnalyticsModule ..> Postgres : stats/queries
AuthRBAC ..> Postgres : users/roles

Monolith ..> SMTP : send confirmations (optional)
DockerCompose ..> Monolith
DockerCompose ..> Postgres
DockerCompose ..> Redis
DockerCompose ..> SMTP

note for BookingModule "Concurrency correctness:
- SERIALIZABLE tx or SELECT ... FOR UPDATE
- UNIQUE(room_id,start,end) guard
- On conflict -> return clear failure (409)"

note for CSVIngestModule "Seeds classrooms from CSV at startup or admin action"

note for AcceptanceTests "Run under docker compose up; expose Swagger + health"
