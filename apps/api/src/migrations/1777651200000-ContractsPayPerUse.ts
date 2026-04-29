import { MigrationInterface, QueryRunner } from 'typeorm';

export class ContractsPayPerUse1777651200000 implements MigrationInterface {
  name = 'ContractsPayPerUse1777651200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_usages_payment_status_enum') THEN
          CREATE TYPE "contract_usages_payment_status_enum" AS ENUM ('pending', 'paid', 'failed');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "contract_templates"
      ADD COLUMN IF NOT EXISTS "is_premium" boolean NOT NULL DEFAULT false
    `);
    await queryRunner.query(`
      ALTER TABLE "contract_templates"
      ALTER COLUMN "company_id" DROP NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "contract_templates"
      ALTER COLUMN "created_by" DROP NOT NULL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "contract_usages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "candidate_id" uuid NOT NULL,
        "application_id" uuid,
        "template_id" character varying,
        "sent_by_id" uuid NOT NULL,
        "title" character varying(160) NOT NULL,
        "content" text NOT NULL,
        "payment_status" "contract_usages_payment_status_enum" NOT NULL,
        "amount" integer NOT NULL DEFAULT 500,
        "used_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_contract_usages_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_contract_usages_company_candidate_used" ON "contract_usages" ("company_id", "candidate_id", "used_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_contract_usages_company_candidate_used"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "contract_usages"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "contract_usages_payment_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract_templates" DROP COLUMN IF EXISTS "is_premium"`,
    );
  }
}
