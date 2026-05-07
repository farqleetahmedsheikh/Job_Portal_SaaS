import { MigrationInterface, QueryRunner } from 'typeorm';

export class LaunchRegionPrivacySupport1778083200000 implements MigrationInterface {
  name = 'LaunchRegionPrivacySupport1778083200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'jobs_salary_currency_enum') THEN
          ALTER TYPE "jobs_salary_currency_enum" ADD VALUE IF NOT EXISTS 'INR';
          ALTER TYPE "jobs_salary_currency_enum" ADD VALUE IF NOT EXISTS 'BDT';
        END IF;
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'complaints_type_enum') THEN
          ALTER TYPE "complaints_type_enum" ADD VALUE IF NOT EXISTS 'general';
        END IF;
      END $$;
    `);

    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "country" character varying(2) NOT NULL DEFAULT 'PK'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "timezone" character varying(64) NOT NULL DEFAULT 'Asia/Karachi'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "marketing_consent" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "terms_accepted_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "privacy_accepted_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deletion_requested_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "data_export_requested_at" TIMESTAMP WITH TIME ZONE`,
    );

    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "country" character varying(2) NOT NULL DEFAULT 'PK'`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "city" character varying(120)`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "timezone" character varying(64) NOT NULL DEFAULT 'Asia/Karachi'`,
    );

    await queryRunner.query(
      `ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "country" character varying(2) NOT NULL DEFAULT 'PK'`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "city" character varying(120)`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "currency" character varying(3) NOT NULL DEFAULT 'PKR'`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "timezone" character varying(64) NOT NULL DEFAULT 'Asia/Karachi'`,
    );
    await queryRunner.query(
      `UPDATE "jobs" SET "currency" = COALESCE("currency", "salary_currency"::text, 'PKR')`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ALTER COLUMN "salary_currency" SET DEFAULT 'PKR'`,
    );

    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "currency" character varying(3) NOT NULL DEFAULT 'PKR'`,
    );

    await queryRunner.query(
      `ALTER TABLE "complaints" ADD COLUMN IF NOT EXISTS "subject" character varying(180)`,
    );
    await queryRunner.query(
      `ALTER TABLE "complaints" ADD COLUMN IF NOT EXISTS "related_job_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "complaints" ADD COLUMN IF NOT EXISTS "related_company_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "complaints" ADD COLUMN IF NOT EXISTS "related_user_id" uuid`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_role" ON "users" ("role")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_country" ON "users" ("country")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_companies_country" ON "companies" ("country")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_jobs_country" ON "jobs" ("country")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_jobs_city" ON "jobs" ("city")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_jobs_currency" ON "jobs" ("currency")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_jobs_status_created" ON "jobs" ("status", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_complaints_related_job" ON "complaints" ("related_job_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_complaints_related_company" ON "complaints" ("related_company_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_complaints_related_user" ON "complaints" ("related_user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_complaints_status_created" ON "complaints" ("status", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_complaints_assignee_status" ON "complaints" ("assigned_to", "status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_complaints_assignee_status"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_complaints_status_created"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_complaints_related_user"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_complaints_related_company"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_complaints_related_job"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_jobs_status_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_jobs_currency"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_jobs_city"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_jobs_country"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_companies_country"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_country"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_role"`);

    await queryRunner.query(
      `ALTER TABLE "jobs" ALTER COLUMN "salary_currency" SET DEFAULT 'USD'`,
    );
    await queryRunner.query(
      `ALTER TABLE "complaints" DROP COLUMN IF EXISTS "related_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "complaints" DROP COLUMN IF EXISTS "related_company_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "complaints" DROP COLUMN IF EXISTS "related_job_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "complaints" DROP COLUMN IF EXISTS "subject"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "currency"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" DROP COLUMN IF EXISTS "timezone"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" DROP COLUMN IF EXISTS "currency"`,
    );
    await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN IF EXISTS "city"`);
    await queryRunner.query(
      `ALTER TABLE "jobs" DROP COLUMN IF EXISTS "country"`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" DROP COLUMN IF EXISTS "timezone"`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" DROP COLUMN IF EXISTS "city"`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" DROP COLUMN IF EXISTS "country"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "data_export_requested_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "deletion_requested_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "privacy_accepted_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "terms_accepted_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "marketing_consent"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "timezone"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "country"`,
    );
  }
}
