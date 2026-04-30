import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdminPanelSystem1777737600000 implements MigrationInterface {
  name = 'AdminPanelSystem1777737600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'users_role_enum') THEN
          ALTER TYPE "users_role_enum" ADD VALUE IF NOT EXISTS 'super_admin';
          ALTER TYPE "users_role_enum" ADD VALUE IF NOT EXISTS 'supervisor';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'complaints_type_enum') THEN
          CREATE TYPE "complaints_type_enum" AS ENUM ('billing', 'employer', 'candidate', 'bug');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'complaints_status_enum') THEN
          CREATE TYPE "complaints_status_enum" AS ENUM ('open', 'in_progress', 'resolved');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'system_logs_level_enum') THEN
          CREATE TYPE "system_logs_level_enum" AS ENUM ('info', 'warning', 'error');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "complaints" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "type" "complaints_type_enum" NOT NULL,
        "message" text NOT NULL,
        "status" "complaints_status_enum" NOT NULL DEFAULT 'open',
        "assigned_to" uuid,
        "admin_note" text,
        "response" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_complaints_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "system_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "level" "system_logs_level_enum" NOT NULL,
        "message" text NOT NULL,
        "route" character varying(240),
        "method" character varying(12),
        "stack_trace" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_system_logs_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admin_activities" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "admin_id" uuid NOT NULL,
        "action" character varying(120) NOT NULL,
        "target_type" character varying(80),
        "target_id" character varying(120),
        "meta" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_admin_activities_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_complaints_status_created" ON "complaints" ("status", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_complaints_assigned_status" ON "complaints" ("assigned_to", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_system_logs_level_created" ON "system_logs" ("level", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_system_logs_route_created" ON "system_logs" ("route", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_admin_activities_admin_created" ON "admin_activities" ("admin_id", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_admin_activities_target" ON "admin_activities" ("target_type", "target_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_admin_activities_target"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_admin_activities_admin_created"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_system_logs_route_created"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_system_logs_level_created"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_complaints_assigned_status"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_complaints_status_created"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_activities"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "system_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "complaints"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "system_logs_level_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "complaints_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "complaints_type_enum"`);
  }
}
