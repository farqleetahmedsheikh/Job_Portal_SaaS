import { MigrationInterface, QueryRunner } from 'typeorm';

export class TemplateMonetizationTables1777478400000 implements MigrationInterface {
  name = 'TemplateMonetizationTables1777478400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_templates_type_enum') THEN
          CREATE TYPE "contract_templates_type_enum" AS ENUM ('contract', 'offer_letter');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'email_templates_type_enum') THEN
          CREATE TYPE "email_templates_type_enum" AS ENUM (
            'interview_scheduled',
            'interview_rescheduled',
            'interview_cancelled',
            'rejection',
            'offer',
            'application_status'
          );
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "contract_templates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "created_by" uuid NOT NULL,
        "title" character varying NOT NULL,
        "type" "contract_templates_type_enum" NOT NULL,
        "body" text NOT NULL,
        "is_default" boolean NOT NULL DEFAULT false,
        "is_advanced" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_contract_templates_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "email_templates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "created_by" uuid NOT NULL,
        "type" "email_templates_type_enum" NOT NULL,
        "subject" character varying NOT NULL,
        "body" text NOT NULL,
        "is_default" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_email_templates_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_contract_templates_company_type" ON "contract_templates" ("company_id", "type")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_email_templates_company_type" ON "email_templates" ("company_id", "type")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_email_templates_company_type"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_contract_templates_company_type"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "email_templates"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contract_templates"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "email_templates_type_enum"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "contract_templates_type_enum"`,
    );
  }
}
