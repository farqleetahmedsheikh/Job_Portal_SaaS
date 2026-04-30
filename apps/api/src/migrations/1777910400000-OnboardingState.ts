import { MigrationInterface, QueryRunner } from 'typeorm';

export class OnboardingState1777910400000 implements MigrationInterface {
  name = 'OnboardingState1777910400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "has_completed_onboarding" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "onboarding_completed_at" TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS "onboarding_role" character varying(30)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN IF EXISTS "onboarding_role",
        DROP COLUMN IF EXISTS "onboarding_completed_at",
        DROP COLUMN IF EXISTS "has_completed_onboarding"
    `);
  }
}
