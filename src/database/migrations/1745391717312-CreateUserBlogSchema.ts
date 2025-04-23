import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserBlogSchema1745391717312 implements MigrationInterface {
    name = 'CreateUserBlogSchema1745391717312'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('Admin', 'Editor')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "firstName" character varying(50) NOT NULL, "lastName" character varying(50) NOT NULL, "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "phone" character varying(20), "role" "public"."user_role_enum" NOT NULL DEFAULT 'Editor', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "blogs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(255) NOT NULL, "slug" character varying(255) NOT NULL, "content" text NOT NULL, "tags" text array, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "createdById" uuid NOT NULL, "editedById" uuid, CONSTRAINT "UQ_b9e1eb8aea30ea2192cd8f0a316" UNIQUE ("title"), CONSTRAINT "UQ_7b18faaddd461656ff66f32e2d7" UNIQUE ("slug"), CONSTRAINT "PK_e113335f11c926da929a625f118" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7b18faaddd461656ff66f32e2d" ON "blogs" ("slug") `);
        await queryRunner.query(`ALTER TABLE "blogs" ADD CONSTRAINT "FK_912dfd2dfbe7cd3480c18a6e053" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD CONSTRAINT "FK_897947f564d0cdca8de1a5b6f9a" FOREIGN KEY ("editedById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blogs" DROP CONSTRAINT "FK_897947f564d0cdca8de1a5b6f9a"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP CONSTRAINT "FK_912dfd2dfbe7cd3480c18a6e053"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7b18faaddd461656ff66f32e2d"`);
        await queryRunner.query(`DROP TABLE "blogs"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
    }

}
