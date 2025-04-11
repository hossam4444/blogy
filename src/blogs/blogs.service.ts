import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Raw } from 'typeorm';
import { Blog } from './blogs.entity';
import { CreateBlogDto } from './dtos/create-blog.dto';

@Injectable()
export class BlogsService {
  constructor(
    @InjectRepository(Blog)
    private readonly blogRepository: Repository<Blog>,
  ) { }

  async findAll(options: {
    page?: number;
    limit?: number;
    search?: string;
    tags?: string;
    sortBy?: string;
    order?: 'ASC' | 'DESC';
  }): Promise<{ blogs: Blog[]; total: number; pages: number }> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        tags,
        sortBy = 'createdAt',
        order = 'DESC'
      } = options;

      const tagsArray = tags?.split(',').map(tag => tag.trim()).filter(Boolean);
      const queryBuilder = this.blogRepository
        .createQueryBuilder('blog')
        .leftJoinAndSelect('blog.createdBy', 'createdBy')
        .leftJoinAndSelect('blog.editedBy', 'editedBy')
        .select([
          'blog',
          'createdBy.id',
          'createdBy.firstName',
          'createdBy.lastName',
          'editedBy.id',
          'editedBy.firstName',
          'editedBy.lastName'
        ]);

      let whereConditions = '1=1';
      const parameters: any = {};

      if (search?.trim()) {
        whereConditions += ' AND (blog.title ILIKE :search OR blog.content ILIKE :search)';
        parameters.search = `%${search.trim()}%`;
      }

      if (Array.isArray(tagsArray) && tagsArray.length > 0) {
        whereConditions += ' AND blog.tags && ARRAY[:...tags]';
        parameters.tags = tagsArray;
      }

      queryBuilder.where(whereConditions, parameters);

      const allowedSortFields = ['createdAt', 'title', 'updatedAt'];
      const validSortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
      const validOrder = order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      queryBuilder.orderBy(`blog.${validSortField}`, validOrder);

      // Add pagination
      const skip = (page - 1) * limit;
      queryBuilder
        .skip(skip)
        .take(limit);

      // Execute query and get total count
      const [blogs, total] = await queryBuilder.getManyAndCount();
      const pages = Math.ceil(total / limit);

      return {
        blogs,
        total,
        pages
      };
    } catch (error) {
      console.error('Error in findAll:', error);
      throw error;
    }
  }

  async findOne(id: string): Promise<Blog> {
    const blog = await this.blogRepository.findOne({ where: { id } });
    if (!blog) {
      throw new NotFoundException(`Blog with ID ${id} not found`);
    }
    return blog;
  }

  async findBySlug(slug: string): Promise<Blog> {
    const blog = await this.blogRepository.findOne({ where: { slug } });
    if (!blog) {
      throw new NotFoundException(`Blog with slug "${slug}" not found`);
    }
    return blog;
  }

  async create(data: CreateBlogDto & { userId: string }): Promise<Blog> {

    const existingBlog = await this.blogRepository.findOne({
      where: {
        slug: data.title.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
      }
    });
    if (existingBlog) {
      throw new ConflictException(`Blog with title "${data.title}" already exists`);
    }

    const blog = this.blogRepository.create({
      ...data,
      createdBy: { id: data.userId }
    });
    return this.blogRepository.save(blog);
  }

  async update(id: string, updateData: Partial<Blog>): Promise<Blog> {
    const blog = await this.findOne(id);
    Object.assign(blog, updateData);
    return await this.blogRepository.save(blog);
  }

  async remove(id: string): Promise<void> {
    const result = await this.blogRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Blog with ID ${id} not found`);
    }

  }
}
