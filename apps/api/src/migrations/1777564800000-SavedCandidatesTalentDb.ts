import { MigrationInterface, QueryRunner } from 'typeorm';

export class SavedCandidatesTalentDb1777564800000 implements MigrationInterface {
  name = 'SavedCandidatesTalentDb1777564800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "saved_candidates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "candidate_id" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_saved_candidates" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_saved_candidates_company_candidate" UNIQUE ("company_id", "candidate_id"),
        CONSTRAINT "FK_saved_candidates_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_saved_candidates_candidate" FOREIGN KEY ("candidate_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_saved_candidates_candidate" ON "saved_candidates" ("candidate_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_applicant_profiles_location" ON "applicant_profiles" ("location")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_applicant_profiles_created_at" ON "applicant_profiles" ("created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_applicant_profiles_skills_gin" ON "applicant_profiles" USING GIN ("skills")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_applicant_profiles_skills_gin"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_applicant_profiles_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_applicant_profiles_location"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_saved_candidates_candidate"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "saved_candidates"`);
  }
}
