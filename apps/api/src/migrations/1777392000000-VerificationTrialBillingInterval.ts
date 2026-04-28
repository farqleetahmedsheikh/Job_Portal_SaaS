import { MigrationInterface, QueryRunner } from 'typeorm';

export class VerificationTrialBillingInterval1777392000000 implements MigrationInterface {
  name = 'VerificationTrialBillingInterval1777392000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."companies_verification_status_enum" ADD VALUE IF NOT EXISTS 'expired'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."subscriptions_verification_status_enum" ADD VALUE IF NOT EXISTS 'expired'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."verification_docs_status_enum" ADD VALUE IF NOT EXISTS 'expired'`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."subscriptions_billing_interval_enum" AS ENUM ('monthly', 'yearly')`,
    );

    await queryRunner.query(
      `ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "category" character varying(40)`,
    );

    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "verification_started_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "verification_expires_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "verification_rejection_reason" text`,
    );

    await queryRunner.query(
      `ALTER TABLE "verification_docs" ADD COLUMN IF NOT EXISTS "rejection_reason" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "verification_docs" ADD COLUMN IF NOT EXISTS "reviewed_by_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "verification_docs" ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMP WITH TIME ZONE`,
    );

    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "billing_interval" "public"."subscriptions_billing_interval_enum" NOT NULL DEFAULT 'monthly'`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "trial_start_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "trial_end_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "trial_used_at" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "trial_used_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "trial_end_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "trial_start_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "billing_interval"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."subscriptions_billing_interval_enum"`,
    );

    await queryRunner.query(
      `ALTER TABLE "verification_docs" DROP COLUMN IF EXISTS "expires_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "verification_docs" DROP COLUMN IF EXISTS "reviewed_by_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "verification_docs" DROP COLUMN IF EXISTS "rejection_reason"`,
    );

    await queryRunner.query(
      `ALTER TABLE "companies" DROP COLUMN IF EXISTS "verification_rejection_reason"`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" DROP COLUMN IF EXISTS "verification_expires_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" DROP COLUMN IF EXISTS "verification_started_at"`,
    );

    await queryRunner.query(
      `ALTER TABLE "notifications" DROP COLUMN IF EXISTS "category"`,
    );
  }
}
