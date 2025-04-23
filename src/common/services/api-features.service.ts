import { Injectable } from '@nestjs/common';
import {
  SelectQueryBuilder,
  Brackets,
  ObjectLiteral,
} from 'typeorm';
import { PaginationMeta } from '../interfaces/pagination-meta.interface';

export interface QueryStringParams {
  page?: string | number;
  limit?: string | number;
  sort?: string;
  fields?: string;
  q?: string;
  [key: string]: any;
}

@Injectable()
export class ApiFeaturesService<T extends ObjectLiteral> {
  public queryBuilder: SelectQueryBuilder<T>;
  public queryString: QueryStringParams;
  public paginationMeta: PaginationMeta | null = null;
  private entityAlias: string;

  constructor() {
  }

  /**
   * Initializes the service with a QueryBuilder and query string.
   * Must be called before other methods.
   * @param queryBuilder The TypeORM SelectQueryBuilder instance.
   * @param queryString The query string (or DTO parsed from it) from the request.
   */
  init(
    queryBuilder: SelectQueryBuilder<T>,
    queryString: QueryStringParams,
  ): this {
    if (!queryBuilder) {
      throw new Error("ApiFeaturesService requires a QueryBuilder instance.");
    }
    this.queryBuilder = queryBuilder;
    this.queryString = queryString || {};
    this.entityAlias = this.queryBuilder.alias;
    if (!this.entityAlias) {
      console.warn("ApiFeaturesService: Could not determine QueryBuilder alias. Filtering/sorting might require explicit alias specification if defaults fail.");
      this.entityAlias = this.queryBuilder.expressionMap.mainAlias?.name ?? 'entity';
    }
    return this;
  }

  /**
  * Filters the query based on the query string.
  * Handles basic equality (field=value) and operator-based filtering (field=[operator]value)
  * Supported operators in brackets: >, <, <=, >=, =, !=, between
  */
  filter(): this {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'q'];
    excludedFields.forEach((field) => delete queryObj[field]);


    const valueOperatorRegex = /^\[(<=|>=|!=|between|<|>|=)\](.*)$/;

    for (const key in queryObj) {
      if (Object.prototype.hasOwnProperty.call(queryObj, key)) {
        const rawValue = queryObj[key];

        if (rawValue === undefined) continue;
        if (rawValue === null && typeof rawValue === 'object') continue;

        const field = key;
        let operator: string | null = null;
        let opValue: any = rawValue;

        if (typeof rawValue === 'string') {
          const valueMatch = rawValue.match(valueOperatorRegex);
          if (valueMatch) {
            operator = valueMatch[1].toLowerCase();
            opValue = valueMatch[2];
          }
        }

        if (operator) {
          const paramName = `${field}_${operator.replace(/[^a-zA-Z0-9_]/g, '')}_${Math.random().toString(36).substring(7)}`;

          switch (operator) {
            case '>':
            case 'gt':
              this.queryBuilder.andWhere(`${this.entityAlias}.${field} > :${paramName}`, { [paramName]: opValue }); break;
            case '>=':
            case 'gte':
              this.queryBuilder.andWhere(`${this.entityAlias}.${field} >= :${paramName}`, { [paramName]: opValue }); break;
            case '<':
            case 'lt':
              this.queryBuilder.andWhere(`${this.entityAlias}.${field} < :${paramName}`, { [paramName]: opValue }); break;
            case '<=':
            case 'lte':
              this.queryBuilder.andWhere(`${this.entityAlias}.${field} <= :${paramName}`, { [paramName]: opValue }); break;
            case '=':
            case 'eq':
              if (opValue === null || String(opValue).toLowerCase() === 'null') this.queryBuilder.andWhere(`${this.entityAlias}.${field} IS NULL`);
              else this.queryBuilder.andWhere(`${this.entityAlias}.${field} = :${paramName}`, { [paramName]: opValue });
              break;
            case '!=':
            case 'ne':
              if (opValue === null || String(opValue).toLowerCase() === 'null') this.queryBuilder.andWhere(`${this.entityAlias}.${field} IS NOT NULL`);
              else this.queryBuilder.andWhere(`${this.entityAlias}.${field} != :${paramName}`, { [paramName]: opValue });
              break;
            case 'between':
              let min, max;
              if (typeof opValue === 'string') {
                const parts = opValue.split(',').map(p => p.trim());
                if (parts.length === 2) {
                  [min, max] = parts;
                }
              }
              if (min !== undefined && max !== undefined && String(min).trim() !== '' && String(max).trim() !== '') {
                this.queryBuilder.andWhere(`${this.entityAlias}.${field} BETWEEN :${paramName}_min AND :${paramName}_max`, {
                  [`${paramName}_min`]: min,
                  [`${paramName}_max`]: max,
                });
              } else {
                console.warn(`ApiFeaturesService: Invalid value for 'between' operator on field ${field}. Expected two comma-separated values after '[between]'. Value received: ${opValue}`);
              }
              break;
            default:
              console.warn(`ApiFeaturesService: Encountered unexpected operator: ${operator} for field ${field}`);
              break;
          }
        } else {
          if (typeof opValue === 'string' && opValue.includes(',')) {
            this.queryBuilder.andWhere(`${this.entityAlias}.${field} IN (:...${field})`, {
              [field]: opValue.split(',').map(item => item.trim()).filter(item => item !== ''),
            });
          } else {
            if (opValue === null) {
              this.queryBuilder.andWhere(`${this.entityAlias}.${field} IS NULL`);
            } else {
              if (typeof opValue === 'object') {
                console.warn(`ApiFeaturesService: Skipping filter for key '${field}' due to unexpected object value without operator prefix.`);
              } else {
                const paramName = `${field}_eq_${Math.random().toString(36).substring(7)}`;
                this.queryBuilder.andWhere(`${this.entityAlias}.${field} = :${paramName}`, { [paramName]: opValue });
              }
            }
          }
        }
      }
    }
    return this;
  }

  /**
   * Adds search criteria to the query against specified fields.
   * Uses ILIKE for case-insensitive search (PostgreSQL/SQLite).
   * @param searchableFields - An array of field names (e.g., ['title', 'description'])
   */
  search(searchableFields: string[]): this {
    const searchTerm = this.queryString.q;

    if (typeof searchTerm === 'string' && searchTerm.trim() && searchableFields && searchableFields.length > 0) {
      const trimmedSearchTerm = searchTerm.trim();
      this.queryBuilder.andWhere(
        new Brackets((qb) => {
          searchableFields.forEach((field, index) => {
            if (typeof field === 'string' && field.trim()) {
              const validField = field.trim();
              const paramName = `searchTerm_${validField.replace(/[^a-zA-Z0-9_]/g, '')}_${index}`;
              const query = `${this.entityAlias}.${validField} ILIKE :${paramName}`;
              const params = { [paramName]: `%${trimmedSearchTerm}%` };

              if (index === 0) {
                qb.where(query, params);
              } else {
                qb.orWhere(query, params);
              }
            } else {
              console.warn(`ApiFeaturesService: Invalid searchable field skipped: ${field}`);
            }
          });
        }),
      );
    }
    return this;
  }

  /**
   * Sorts the query results.
   * Example: ?sort=name,-age (sort by name ASC, then age DESC)
   * Defaults to sorting by `createdAt` DESC if available and no sort is specified.
   */
  sort(): this {
    if (this.queryString.sort && typeof this.queryString.sort === 'string') {
      const sortByFields = this.queryString.sort.split(',');
      this.queryBuilder.orderBy();

      sortByFields.forEach((sortField) => {
        const trimmedField = sortField.trim();
        if (!trimmedField) return;

        const order = trimmedField.startsWith('-') ? 'DESC' : 'ASC';
        const fieldName = (trimmedField.startsWith('-')
          ? trimmedField.substring(1)
          : trimmedField
        ).trim();

        if (!fieldName) return;

        this.queryBuilder.addOrderBy(`${this.entityAlias}.${fieldName}`, order, 'NULLS LAST');
      });
    } else {
      const existingOrderBys = this.queryBuilder.expressionMap.orderBys;
      if (!existingOrderBys || Object.keys(existingOrderBys).length === 0) {
        const mainAlias = this.queryBuilder.expressionMap.mainAlias;
        if (mainAlias?.hasMetadata) {
          const entityMetadata = mainAlias.metadata;
          const createdAtColumn = entityMetadata.columns.find(col => col.propertyName === "createdAt" || col.databaseName === "createdAt");

          if (createdAtColumn) {
            this.queryBuilder.orderBy(`${this.entityAlias}.${createdAtColumn.propertyName}`, 'DESC', 'NULLS LAST');
          } else {
            const pk = entityMetadata.primaryColumns[0]?.propertyName;
            if (pk) {
              this.queryBuilder.orderBy(`${this.entityAlias}.${pk}`, 'ASC');
            }
          }
        } else {
          console.warn("ApiFeaturesService: Could not access entity metadata for default sorting. Attempting default sort by 'createdAt'.");
          try {
            this.queryBuilder.orderBy(`${this.entityAlias}.createdAt`, 'DESC', 'NULLS LAST');
          } catch (e) {
            console.warn("ApiFeaturesService: Default sort by 'createdAt' failed (column might not exist). No default sort applied.");
          }
        }
      }
    }
    return this;
  }

  /**
   * Limits the fields returned in the query results.
   * Example: ?fields=title,company
   * Always includes the primary key(s).
   */
  limitFields(): this {
    const orderByFields = Object.keys(this.queryBuilder.expressionMap.orderBys).map(key => {
      const match = key.match(/[^.]+\.(.+)$/);
      return match ? match[1] : key;
    }).filter(Boolean);

    let requestedFields: string[] = [];
    let hasExplicitFields = false;

    if (this.queryString.fields && typeof this.queryString.fields === 'string') {
      hasExplicitFields = true;
      requestedFields = this.queryString.fields
        .split(',')
        .map((field) => field.trim())
        .filter(field => field);
    }

    if (hasExplicitFields || orderByFields.length > 0) {
      let finalSelection: string[] = [];

      if (requestedFields.length > 0) {
        finalSelection = requestedFields;
      } else {
        const mainAlias = this.queryBuilder.expressionMap.mainAlias;
        if (mainAlias?.hasMetadata) {
          finalSelection = mainAlias.metadata.columns.map(col => col.propertyName);
        } else {
          console.warn("ApiFeaturesService: Cannot determine all columns for default selection when sorting is applied without explicit 'fields'. Sorting might fail if sort columns aren't implicitly selected.");
        }
      }


      const mainAlias = this.queryBuilder.expressionMap.mainAlias;
      const primaryKeyFields: string[] = [];
      if (mainAlias?.hasMetadata) {
        mainAlias.metadata.primaryColumns?.forEach(pkCol => {
          primaryKeyFields.push(pkCol.propertyName);
        });
      } else {
        console.warn("ApiFeaturesService: Could not access entity metadata in limitFields to ensure primary key selection. Assuming 'id'.");
        primaryKeyFields.push('id');
      }
      primaryKeyFields.forEach(pkField => {
        if (!finalSelection.includes(pkField)) {
          finalSelection.push(pkField);
        }
      });


      orderByFields.forEach(sortField => {
        if (!finalSelection.includes(sortField)) {
          finalSelection.push(sortField);
        }
      });


      const aliasedFinalSelection = finalSelection
        .map(field => `${this.entityAlias}.${field}`);


      if (aliasedFinalSelection.length > 0) {
        this.queryBuilder.select(aliasedFinalSelection);
      } else {
        console.warn("ApiFeaturesService: limitFields resulted in an empty selection array after processing. Selecting all columns as fallback.");
      }
    }

    return this;
  }

  /**
   * Paginates the query results. Handles page/limit as string or number.
   */
  async paginate(): Promise<this> {
    const pageInput = this.queryString.page;
    let page: number;
    if (typeof pageInput === 'string') {
      page = Math.max(1, parseInt(pageInput, 10) || 1);
    } else if (typeof pageInput === 'number' && !isNaN(pageInput)) {
      page = Math.max(1, Math.floor(pageInput));
    } else {
      page = 1;
    }

    const limitInput = this.queryString.limit;
    let limit: number;
    const defaultLimit = 10;
    const maxLimit = 100;
    if (typeof limitInput === 'string') {
      limit = Math.max(1, parseInt(limitInput, 10) || defaultLimit);
    } else if (typeof limitInput === 'number' && !isNaN(limitInput)) {
      limit = Math.max(1, Math.floor(limitInput));
    } else {
      limit = defaultLimit;
    }
    limit = Math.min(limit, maxLimit);

    const skip = (page - 1) * limit;

    const countQueryBuilder = this.queryBuilder.clone();
    countQueryBuilder.select([]);
    countQueryBuilder.orderBy();
    countQueryBuilder.skip(undefined).take(undefined).limit(undefined);
    const totalItems = await countQueryBuilder.getCount();

    this.queryBuilder.skip(skip).take(limit);

    const totalPages = totalItems > 0 ? Math.ceil(totalItems / limit) : 1;

    let calculatedItemCount: number;
    if (totalItems === 0) {
      calculatedItemCount = 0;
    } else if (page < totalPages) {
      calculatedItemCount = limit;
    } else {
      const skippedItems = (page - 1) * limit;
      calculatedItemCount = totalItems - skippedItems;
    }
    calculatedItemCount = Math.max(0, calculatedItemCount);


    this.paginationMeta = {
      itemCount: calculatedItemCount,
      totalItems,
      itemsPerPage: limit,
      totalPages: totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };

    return this;
  }

  /**
   * Executes the query and returns the results.
   * Shorthand for `this.queryBuilder.getMany()`.
   */
  async getMany(): Promise<T[]> {
    try {
      return await this.queryBuilder.getMany();
    } catch (error) {
      console.error("Error executing getMany:", this.queryBuilder.getSql());
      throw error;
    }
  }

  /**
  * Executes the query and returns the results along with the total count
  * respecting the WHERE clauses but ignoring skip/take.
  * Alternative to calling `paginate()` then `getMany()`.
  * Useful if you don't need the detailed pagination meta object.
  */
  async getManyAndCount(): Promise<[T[], number]> {
    try {
      return await this.queryBuilder.getManyAndCount();
    } catch (error) {
      console.error("Error executing getManyAndCount:", this.queryBuilder.getSql());
      throw error;
    }
  }
}