import { MigrationInterface, QueryRunner } from 'typeorm';

export class MessagingHiringContext1777996800000 implements MigrationInterface {
  name = 'MessagingHiringContext1777996800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "conversations"
        ADD COLUMN IF NOT EXISTS "company_id" uuid,
        ADD COLUMN IF NOT EXISTS "application_id" uuid,
        ADD COLUMN IF NOT EXISTS "employer_id" uuid,
        ADD COLUMN IF NOT EXISTS "applicant_id" uuid,
        ADD COLUMN IF NOT EXISTS "last_message_at" TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS "archived_by_employer" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "archived_by_applicant" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      ALTER TABLE "messages"
        ADD COLUMN IF NOT EXISTS "type" character varying(40) NOT NULL DEFAULT 'user',
        ADD COLUMN IF NOT EXISTS "metadata" jsonb
    `);

    await queryRunner.query(`
      ALTER TABLE "messages"
        ALTER COLUMN "sender_id" DROP NOT NULL
    `);

    await queryRunner.query(`
      UPDATE "conversations" c
      SET "last_message_at" = last_msg."created_at"
      FROM (
        SELECT DISTINCT ON ("conversation_id") "conversation_id", "created_at"
        FROM "messages"
        WHERE "is_deleted" = false
        ORDER BY "conversation_id", "created_at" DESC
      ) last_msg
      WHERE last_msg."conversation_id" = c."id"
        AND c."last_message_at" IS NULL
    `);

    await queryRunner.query(`
      UPDATE "conversations" c
      SET
        "company_id" = j."company_id",
        "employer_id" = co."owner_id"
      FROM "jobs" j
      JOIN "companies" co ON co."id" = j."company_id"
      WHERE c."job_id" = j."id"
        AND c."company_id" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_conversations_company_id"
        ON "conversations" ("company_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_conversations_application_id"
        ON "conversations" ("application_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_conversations_applicant_id"
        ON "conversations" ("applicant_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_conversations_last_message_at"
        ON "conversations" ("last_message_at")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_messages_type"
        ON "messages" ("type")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_messages_type"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_conversations_last_message_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_conversations_applicant_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_conversations_application_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_conversations_company_id"`,
    );

    await queryRunner.query(`
      ALTER TABLE "messages"
        DROP COLUMN IF EXISTS "metadata",
        DROP COLUMN IF EXISTS "type"
    `);

    await queryRunner.query(`
      ALTER TABLE "conversations"
        DROP COLUMN IF EXISTS "archived_by_applicant",
        DROP COLUMN IF EXISTS "archived_by_employer",
        DROP COLUMN IF EXISTS "last_message_at",
        DROP COLUMN IF EXISTS "applicant_id",
        DROP COLUMN IF EXISTS "employer_id",
        DROP COLUMN IF EXISTS "application_id",
        DROP COLUMN IF EXISTS "company_id"
    `);
  }
}
