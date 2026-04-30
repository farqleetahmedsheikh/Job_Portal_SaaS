import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutomationPipeline1777824000000 implements MigrationInterface {
  name = 'AutomationPipeline1777824000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'automation_logs_status_enum') THEN
          CREATE TYPE "automation_logs_status_enum" AS ENUM ('success', 'failed', 'skipped');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'interview_reminder_logs_reminder_type_enum') THEN
          CREATE TYPE "interview_reminder_logs_reminder_type_enum" AS ENUM ('twenty_four_hours', 'one_hour');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'interview_reminder_logs_status_enum') THEN
          CREATE TYPE "interview_reminder_logs_status_enum" AS ENUM ('success', 'failed', 'skipped');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "automation_settings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "auto_application_confirmation" boolean NOT NULL DEFAULT true,
        "auto_shortlist_message" boolean NOT NULL DEFAULT true,
        "auto_rejection_message" boolean NOT NULL DEFAULT true,
        "auto_interview_reminders" boolean NOT NULL DEFAULT true,
        "auto_follow_up_after_no_response" boolean NOT NULL DEFAULT false,
        "follow_up_delay_days" smallint NOT NULL DEFAULT 3,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_automation_settings_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_automation_settings_company_id" UNIQUE ("company_id"),
        CONSTRAINT "FK_automation_settings_company_id" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "automation_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "application_id" uuid,
        "candidate_id" uuid,
        "job_id" uuid,
        "interview_id" uuid,
        "trigger" character varying(80) NOT NULL,
        "action" character varying(100) NOT NULL,
        "status" "automation_logs_status_enum" NOT NULL,
        "message" text NOT NULL,
        "error" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_automation_logs_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_automation_logs_company_id" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "interview_reminder_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "interview_id" uuid NOT NULL,
        "reminder_type" "interview_reminder_logs_reminder_type_enum" NOT NULL,
        "status" "interview_reminder_logs_status_enum" NOT NULL,
        "error" text,
        "sent_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_interview_reminder_logs_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_interview_reminder_logs_interview_type" UNIQUE ("interview_id", "reminder_type"),
        CONSTRAINT "FK_interview_reminder_logs_interview_id" FOREIGN KEY ("interview_id") REFERENCES "interviews"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pipeline_rules" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "trigger" character varying(80) NOT NULL,
        "condition_type" character varying(80) NOT NULL,
        "condition_value" character varying(160),
        "action_type" character varying(100) NOT NULL,
        "action_payload" jsonb,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pipeline_rules_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_pipeline_rules_company_id" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_automation_logs_company_created" ON "automation_logs" ("company_id", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_automation_logs_application_trigger_action" ON "automation_logs" ("application_id", "trigger", "action")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_automation_logs_interview_trigger_action" ON "automation_logs" ("interview_id", "trigger", "action")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_pipeline_rules_company_active" ON "pipeline_rules" ("company_id", "is_active")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_pipeline_rules_company_active"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_automation_logs_interview_trigger_action"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_automation_logs_application_trigger_action"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_automation_logs_company_created"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "pipeline_rules"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "interview_reminder_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "automation_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "automation_settings"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "interview_reminder_logs_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "interview_reminder_logs_reminder_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "automation_logs_status_enum"`,
    );
  }
}
