import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Blog } from './blogs.entity';
import { CreateBlogDto } from './dtos/create-blog.dto';
import { UpdateBlogDto } from './dtos/update-blog.dto';
import { QueryBlogDto } from './dtos/query-blog.dto';
import { ApiFeaturesService } from '../common/services/api-features.service';
import { PaginationMeta } from '../common/interfaces/pagination-meta.interface';
import { User } from '../users/user.entity';
import slugify from 'slugify';




@Injectable()
export class BlogsService {
  private readonly logger = new Logger(BlogsService.name);
  private readonly SINGLE_BLOG_TTL = 600; // 10 minutes TTL for single blog

  constructor(
    @InjectRepository(Blog)
    private readonly blogRepository: Repository<Blog>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

  private getFindAllCacheKey(queryDto: QueryBlogDto): string {
    const sortedQuery = Object.keys(queryDto)
      .sort()
      .reduce((acc, key) => {
        if (queryDto[key] !== undefined && queryDto[key] !== null) {
          acc[key] = queryDto[key];
        }
        return acc;
      }, {});
    const queryStr = JSON.stringify(sortedQuery);
    return `blogs_list_${queryStr}`;
  }

  private getBlogBySlugCacheKey(slug: string): string {
    return `blog_slug_${slug}`;
  }

  private getBlogByIdCacheKey(id: string): string {
    return `blog_id_${id}`;
  }

  /**
   * Clears list caches matching the 'blogs_list_*' pattern.
   * Uses `as any` to access the underlying store's `keys()` method, as it's not
   * exposed on the standard `Cache` interface. Includes runtime checks.
   * NOTE: Redis `KEYS` can be slow on large datasets. Consider `SCAN` or alternative
   * invalidation strategies for production.
   */
  private async clearListCaches(): Promise<void> {
    this.logger.log("Attempting to clear list caches (using pattern 'blogs_list_*')");

    const store = (this.cacheManager as any).store;

    // Runtime check
    if (!store || typeof store.keys !== 'function') {
      this.logger.warn(
        'Underlying cache store or its `keys` method is not available. Skipping pattern deletion.',
      );
      return;
    }

    try {
      const keys: string[] = await store.keys('blogs_list_*');

      if (keys && keys.length > 0) {
        this.logger.log(
          `Found ${keys.length} list cache keys matching 'blogs_list_*' to delete.`,
        );
        await Promise.all(keys.map((key) => this.cacheManager.del(key)));
        this.logger.log('Successfully cleared list caches based on pattern.');
      } else {
        this.logger.log("No list cache keys found matching 'blogs_list_*'.");
      }
    } catch (error) {
      this.logger.error(
        `Error trying to clear list caches using store.keys(): ${error.message}`,
        error.stack,
      );
    }
  }

  async findAll(
    queryDto: QueryBlogDto,
  ): Promise<{ data: Blog[]; meta: PaginationMeta | null }> {
    const cacheKey = this.getFindAllCacheKey(queryDto);

    try {
      const cachedResult = await this.cacheManager.get<{
        data: Blog[];
        meta: PaginationMeta | null;
      }>(cacheKey);
      if (cachedResult) {
        this.logger.log(`Cache HIT for findAll: ${cacheKey}`);
        return cachedResult;
      }

      this.logger.log(`Cache MISS for findAll: ${cacheKey}`);

      const { tags, ...standardQueryParams } = queryDto;
      const queryBuilder = this.blogRepository
        .createQueryBuilder('blog')
        .leftJoinAndSelect('blog.createdBy', 'createdBy')
        .leftJoinAndSelect('blog.editedBy', 'editedBy')
        .select([
          'blog',
          'createdBy.id', 'createdBy.firstName', 'createdBy.lastName',
          'editedBy.id', 'editedBy.firstName', 'editedBy.lastName',
        ]);

      const apiFeatures = new ApiFeaturesService<Blog>().init(
        queryBuilder, standardQueryParams
      );

      apiFeatures.filter().search(['title', 'content']).sort().limitFields();

      if (tags && typeof tags === 'string') {
        const tagsArray = tags.split(',').map((tag) => tag.trim()).filter(Boolean);
        if (tagsArray.length > 0) {
          apiFeatures.queryBuilder.andWhere('blog.tags && ARRAY[:...tags]', { tags: tagsArray });
        }
      }

      await apiFeatures.paginate();
      const blogs = await apiFeatures.getMany();
      const result = { data: blogs, meta: apiFeatures.paginationMeta };

      await this.cacheManager.set(cacheKey, result); // Use default TTL or specify one
      this.logger.log(`Stored findAll result in cache: ${cacheKey}`);
      return result;

    } catch (error) {
      this.logger.error(`Error in findAll: ${error.message}`, error.stack);
      if (error.query) {
        this.logger.error(`Failed SQL Query: ${error.query}`);
        this.logger.error(`Failed SQL Parameters: ${JSON.stringify(error.parameters)}`);
      }
      throw error;
    }
  }

  async findOne(id: string): Promise<Blog> {
    const cacheKey = this.getBlogByIdCacheKey(id);
    try {
      const cachedBlog = await this.cacheManager.get<Blog>(cacheKey);
      if (cachedBlog) {
        this.logger.log(`Cache HIT for findOne (ID): ${cacheKey}`);
        return cachedBlog;
      }
      this.logger.log(`Cache MISS for findOne (ID): ${cacheKey}`);

      const blog = await this.blogRepository.findOne({
        where: { id }, relations: ['createdBy', 'editedBy']
      });
      if (!blog) {
        throw new NotFoundException(`Blog with ID ${id} not found`);
      }

      await this.cacheManager.set(cacheKey, blog, this.SINGLE_BLOG_TTL);
      this.logger.log(`Stored findOne (ID) result in cache: ${cacheKey}`);
      return blog;

    } catch (error) {
      this.logger.error(`Error in findOne(${id}): ${error.message}`, error.stack);
      throw error;
    }
  }

  async findBySlug(slug: string): Promise<Blog> {
    const cacheKey = this.getBlogBySlugCacheKey(slug);
    try {
      const cachedBlog = await this.cacheManager.get<Blog>(cacheKey);
      if (cachedBlog) {
        this.logger.log(`Cache HIT for findBySlug: ${cacheKey}`);
        return cachedBlog;
      }
      this.logger.log(`Cache MISS for findBySlug: ${cacheKey}`);

      const blog = await this.blogRepository.findOne({
        where: { slug }, relations: ['createdBy', 'editedBy']
      });
      if (!blog) {
        throw new NotFoundException(`Blog with slug "${slug}" not found`);
      }

      await this.cacheManager.set(cacheKey, blog, this.SINGLE_BLOG_TTL);
      this.logger.log(`Stored findBySlug result in cache: ${cacheKey}`);
      return blog;

    } catch (error) {
      this.logger.error(`Error in findBySlug(${slug}): ${error.message}`, error.stack);
      throw error;
    }
  }

  async create(data: CreateBlogDto & { userId: string }): Promise<Blog> {
    const existingBlogByTitle = await this.blogRepository.findOne({
      where: { title: data.title }, select: ['id']
    });
    if (existingBlogByTitle) {
      throw new ConflictException(`Blog with title "${data.title}" already exists`);
    }

    const blogEntity = this.blogRepository.create({
      ...data, createdBy: { id: data.userId }
    });

    try {
      const savedBlog = await this.blogRepository.save(blogEntity);

      await this.clearListCaches();
      this.logger.log(`Blog created (ID: ${savedBlog.id}), cleared list caches.`);

      return savedBlog;

    } catch (error) {
      this.logger.error(`Error creating blog: ${error.message}`, error.stack);
      if (error.code === '23505') {
        throw new ConflictException(`Blog title or slug conflicts with an existing entry.`);
      }
      throw error;
    }
  }

  async update(
    id: string,
    updateData: UpdateBlogDto & { editedBy: User },
  ): Promise<Blog> {
    const blogToUpdate = await this.blogRepository.preload({
      id: id,
      ...updateData,
    });

    if (!blogToUpdate) {
      throw new NotFoundException(`Blog with ID ${id} not found for update`);
    }

    blogToUpdate.editedBy = updateData.editedBy;

    let oldSlug: string | undefined = blogToUpdate.slug;

    if (updateData.title && updateData.title !== blogToUpdate.title) {
      blogToUpdate.slug = slugify(updateData.title);
      this.logger.log(`Regenerated slug for blog ID ${id} to "${blogToUpdate.slug}" due to title change.`);
    } else {
      oldSlug = undefined;
    }

    try {
      const updatedBlog = await this.blogRepository.save(blogToUpdate);

      const idCacheKey = this.getBlogByIdCacheKey(id);
      const newSlugCacheKey = this.getBlogBySlugCacheKey(updatedBlog.slug);

      await this.cacheManager.del(idCacheKey);
      await this.cacheManager.del(newSlugCacheKey);

      if (oldSlug && oldSlug !== updatedBlog.slug) {
        const oldSlugCacheKey = this.getBlogBySlugCacheKey(oldSlug);
        await this.cacheManager.del(oldSlugCacheKey);
        this.logger.log(`Invalidated old slug cache key: ${oldSlugCacheKey}`);
      }

      await this.clearListCaches();

      this.logger.log(`Blog updated (ID: ${id}), invalidated specific caches and cleared lists.`);

      return updatedBlog;

    } catch (error) {
      this.logger.error(`Error updating blog ID ${id}: ${error.message}`, error.stack);
      if (error.code === '23505') {
        throw new ConflictException('Blog title or regenerated slug conflicts with an existing entry.');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const blog = await this.blogRepository.findOne({ where: { id }, select: ['id', 'slug'] });

    if (!blog) {
      throw new NotFoundException(`Blog with ID ${id} not found for deletion`);
    }

    const result = await this.blogRepository.delete(id);

    if (result.affected === 0) {
      this.logger.warn(`Delete operation reported 0 affected rows for ID: ${id}, though it was found.`);
      throw new NotFoundException(`Blog with ID ${id} found but could not be deleted`);
    }

    const idCacheKey = this.getBlogByIdCacheKey(id);
    const slugCacheKey = this.getBlogBySlugCacheKey(blog.slug);

    await this.cacheManager.del(idCacheKey);
    await this.cacheManager.del(slugCacheKey);
    await this.clearListCaches();

    this.logger.log(`Blog deleted (ID: ${id}), invalidated caches (${idCacheKey}, ${slugCacheKey}) and cleared lists.`);
  }
}