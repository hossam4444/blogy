import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';
import slugify from 'slugify';
config();

export class SeedUsersAndBlogs1745273712671 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {

    const userCheck = await queryRunner.query(`SELECT COUNT(*) FROM "user" WHERE "email" = $1`, [
      process.env.ADMIN_EMAIL || 'admin@blog.com'
    ]);
    const userCount = parseInt(userCheck[0].count, 10);

    if (userCount > 0) {
      console.log('Admin user already exists. Skipping seeding.');
      return;
    }
    console.log('Seeding database: No existing admin user found.');
    const adminPass = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', parseInt(process.env.HASH_ROUNDS || '10'));
    const adminResult = await queryRunner.query(`
      INSERT INTO "user" ("firstName", "lastName", "email", "password", "phone", "role")
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [
      process.env.ADMIN_FIRST_NAME || 'Admin',
      process.env.ADMIN_LAST_NAME || 'User',
      process.env.ADMIN_EMAIL || 'admin@blog.com',
      adminPass,
      process.env.ADMIN_PHONE || '+1234567890',
      'Admin'
    ]);
    const adminId = adminResult[0].id;

    // Original Blogs for Admin
    const originalBlogs = [
      {
        title: 'Getting Started with NestJS',
        content: 'NestJS is a progressive Node.js framework...',
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
      },
    ];
    for (const blog of originalBlogs) {
      // insert blog
      const slug = slugify(blog.title);
      await queryRunner.query(`
        INSERT INTO "blogs" ("title", "slug", "content", "tags", "createdById")
        VALUES ($1, $2, $3, $4, $5)
      `, [blog.title, slug, blog.content, blog.tags, adminId]);
    }

    // Create Editors
    const editorCount = 8;
    const editorIds: any[] = [];
    for (let i = 1; i <= editorCount; i++) {
      const editorResult = await queryRunner.query(`
        INSERT INTO "user" ("firstName", "lastName", "email", "password", "phone", "role")
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [
        `Editor${i}`,
        'User',
        `editor${i}@blog.com`,
        await bcrypt.hash(`Editor@${i}`, parseInt(process.env.HASH_ROUNDS || '10')),
        `+123456789${i}`,
        'Editor'
      ]);
      editorIds.push(editorResult[0].id);
    }

    // Generate Test Blogs
    const allUserIds = [adminId, ...editorIds];
    const tagsPool = ['nestjs', 'react', 'docker', 'security', 'testing', 'graphql', 'typescript', 'javascript', 'nodejs', 'express', 'system-design', 'microservices', 'devops', 'cloud', 'aws', 'azure', 'gcp'];
    let blogCounter = 1;

    for (const userId of allUserIds) {
      for (let j = 0; j < 5; j++) { // 5 blogs per user
        const title = `Test Blog ${blogCounter}`;
        const content = `Test content for blog ${blogCounter}. Lorem ipsum...`;
        const tags = this.getRandomTags(tagsPool, 2);
        const slug = `${slugify(title)}-${Math.floor(Math.random() * 1000)}`;

        await queryRunner.query(`
          INSERT INTO "blogs" ("title", "slug", "content", "tags", "createdById")
          VALUES ($1, $2, $3, $4, $5)
        `, [title, slug, content, tags, userId]);

        blogCounter++;
      }
    }
  }

  private getRandomTags(tagsPool: string[], count: number): string[] {
    return [...tagsPool]
      .sort(() => Math.random() - 0.5)
      .slice(0, count);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "blogs"`);
    await queryRunner.query(`DELETE FROM "user" WHERE email LIKE $1`, ['%@blog.com']);
  }
}