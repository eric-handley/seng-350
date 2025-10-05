import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1732573200000 implements MigrationInterface {
    name = 'InitialSchema1732573200000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ensure pgcrypto is available for gen_random_uuid()
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
        // Create enum types
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('Staff', 'Registrar', 'Admin')`);
        await queryRunner.query(`CREATE TYPE "public"."room_type_enum" AS ENUM('Classroom', 'Lecture theatre', 'Multi-access classroom', 'Flury Hall', 'Unknown', 'David Lam Auditorium')`);
        await queryRunner.query(`CREATE TYPE "public"."booking_status_enum" AS ENUM('Active', 'Cancelled')`);

        // Create users table
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "email" character varying NOT NULL,
                "password_hash" character varying NOT NULL,
                "first_name" character varying NOT NULL,
                "last_name" character varying NOT NULL,
                "role" "public"."user_role_enum" NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);

        // Create buildings table
        await queryRunner.query(`
            CREATE TABLE "buildings" (
                "short_name" character varying NOT NULL,
                "name" character varying NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_buildings_name" UNIQUE ("name"),
                CONSTRAINT "PK_buildings_short_name" PRIMARY KEY ("short_name")
            )
        `);

        // Create rooms table
        await queryRunner.query(`
            CREATE TABLE "rooms" (
                "room_id" character varying NOT NULL,
                "building_short_name" character varying NOT NULL,
                "room_number" character varying NOT NULL,
                "capacity" integer NOT NULL,
                "room_type" "public"."room_type_enum" NOT NULL,
                "url" character varying NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_rooms_room_id" PRIMARY KEY ("room_id")
            )
        `);

        // Create equipment table
        await queryRunner.query(`
            CREATE TABLE "equipment" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "name" character varying NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_equipment_name" UNIQUE ("name"),
                CONSTRAINT "PK_equipment_id" PRIMARY KEY ("id")
            )
        `);

        // Create room_equipment table
        await queryRunner.query(`
            CREATE TABLE "room_equipment" (
                "room_id" character varying NOT NULL,
                "equipment_id" uuid NOT NULL,
                "quantity" integer,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_room_equipment" PRIMARY KEY ("room_id", "equipment_id")
            )
        `);

        // Create booking_series table
        await queryRunner.query(`
            CREATE TABLE "booking_series" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "user_id" uuid NOT NULL,
                "room_id" character varying NOT NULL,
                "start_time" TIMESTAMP WITH TIME ZONE NOT NULL,
                "end_time" TIMESTAMP WITH TIME ZONE NOT NULL,
                "series_end_date" DATE NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_booking_series_id" PRIMARY KEY ("id"),
                CONSTRAINT "CHK_booking_series_time" CHECK ("start_time" < "end_time"),
                CONSTRAINT "CHK_booking_series_end_date" CHECK ("series_end_date" >= DATE("start_time"))
            )
        `);

        // Create bookings table
        await queryRunner.query(`
            CREATE TABLE "bookings" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "user_id" uuid NOT NULL,
                "room_id" character varying NOT NULL,
                "start_time" TIMESTAMP WITH TIME ZONE NOT NULL,
                "end_time" TIMESTAMP WITH TIME ZONE NOT NULL,
                "status" "public"."booking_status_enum" NOT NULL,
                "booking_series_id" uuid,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_bookings_id" PRIMARY KEY ("id"),
                CONSTRAINT "CHK_bookings_time" CHECK ("start_time" < "end_time")
            )
        `);

        // Enable btree_gist extension for exclusion constraints
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS btree_gist`);

        // Add exclusion constraint to prevent overlapping active bookings
        await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD CONSTRAINT "no_overlapping_bookings"
            EXCLUDE USING gist (
                room_id WITH =,
                tstzrange(start_time, end_time) WITH &&
            )
            WHERE (status = 'Active')
        `);

        // Create audit_logs table
        await queryRunner.query(`
            CREATE TABLE "audit_logs" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "user_id" uuid,
                "action" character varying NOT NULL,
                "route" character varying NOT NULL,
                "query" jsonb,
                "body" jsonb,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_audit_logs_id" PRIMARY KEY ("id")
            )
        `);

        // Create foreign key constraints
        await queryRunner.query(`ALTER TABLE "rooms" ADD CONSTRAINT "FK_rooms_building_short_name" FOREIGN KEY ("building_short_name") REFERENCES "buildings"("short_name") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "room_equipment" ADD CONSTRAINT "FK_room_equipment_room_id" FOREIGN KEY ("room_id") REFERENCES "rooms"("room_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "room_equipment" ADD CONSTRAINT "FK_room_equipment_equipment_id" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "booking_series" ADD CONSTRAINT "FK_booking_series_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "booking_series" ADD CONSTRAINT "FK_booking_series_room_id" FOREIGN KEY ("room_id") REFERENCES "rooms"("room_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "FK_bookings_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "FK_bookings_room_id" FOREIGN KEY ("room_id") REFERENCES "rooms"("room_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "FK_bookings_booking_series_id" FOREIGN KEY ("booking_series_id") REFERENCES "booking_series"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "FK_bookings_booking_series_id"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "FK_bookings_room_id"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "FK_bookings_user_id"`);
        await queryRunner.query(`ALTER TABLE "booking_series" DROP CONSTRAINT "FK_booking_series_room_id"`);
        await queryRunner.query(`ALTER TABLE "booking_series" DROP CONSTRAINT "FK_booking_series_user_id"`);
        await queryRunner.query(`ALTER TABLE "room_equipment" DROP CONSTRAINT "FK_room_equipment_equipment_id"`);
        await queryRunner.query(`ALTER TABLE "room_equipment" DROP CONSTRAINT "FK_room_equipment_room_id"`);
        await queryRunner.query(`ALTER TABLE "rooms" DROP CONSTRAINT "FK_rooms_building_short_name"`);

        // Drop exclusion constraint and extension
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "no_overlapping_bookings"`);
        await queryRunner.query(`DROP EXTENSION IF EXISTS btree_gist`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP TABLE "bookings"`);
        await queryRunner.query(`DROP TABLE "booking_series"`);
        await queryRunner.query(`DROP TABLE "room_equipment"`);
        await queryRunner.query(`DROP TABLE "equipment"`);
        await queryRunner.query(`DROP TABLE "rooms"`);
        await queryRunner.query(`DROP TABLE "buildings"`);
        await queryRunner.query(`DROP TABLE "users"`);

        // Drop enum types
        await queryRunner.query(`DROP TYPE "public"."booking_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."room_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
        await queryRunner.query(`DROP EXTENSION IF EXISTS "pgcrypto"`);
    }
}
