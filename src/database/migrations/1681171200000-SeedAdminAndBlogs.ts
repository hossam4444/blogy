import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';

config();

export class SeedAdminAndBlogs1681171200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
    const adminResult = await queryRunner.query(`
      INSERT INTO "user" ("firstName", "lastName", "email", "password", "phone", "role")
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [
      process.env.ADMIN_FIRST_NAME || 'Admin',
      process.env.ADMIN_LAST_NAME || 'User',
      process.env.ADMIN_EMAIL || 'admin@blog.com',
      hashedPassword,
      process.env.ADMIN_PHONE || '+1234567890',
      'Admin'
    ]);

    const adminId = adminResult[0].id;

    const blogs = [
      {
        title: 'Getting Started with NestJS',
        content: 'NestJS is a progressive Node.js framework for building efficient, reliable and scalable server-side applications...',
        tags: ['nestjs', 'nodejs', 'backend'],
      },
      {
        title: 'TypeORM Migrations Guide',
        content: 'Migrations are a way to incrementally update your database schema to keep it in sync with your application data model...',
        tags: ['typeorm', 'database', 'migrations'],
      },
      {
        title: 'Authentication Best Practices',
        content: 'Implementing secure authentication in your application is crucial. Here are some best practices to follow...',
        tags: ['security', 'authentication', 'jwt'],
      }
    ];

    for (const blog of blogs) {
      const slug = blog.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      await queryRunner.query(`
        INSERT INTO "blogs" ("title", "slug", "content", "tags", "createdById")
        VALUES ($1, $2, $3, $4, $5)
      `, [blog.title, slug, blog.content, blog.tags, adminId]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "blogs"`);
    await queryRunner.query(`DELETE FROM "user" WHERE email = $1`, [process.env.ADMIN_EMAIL || 'admin@blog.com']);
  }
}