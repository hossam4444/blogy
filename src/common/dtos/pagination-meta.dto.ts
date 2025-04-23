import { ApiProperty } from '@nestjs/swagger';
import { PaginationMeta } from '../interfaces/pagination-meta.interface';

export class PaginationMetaDto implements PaginationMeta {
  @ApiProperty({ description: 'Current page number', example: 1 })
  currentPage: number;

  @ApiProperty({ description: 'Number of items returned on the current page', example: 10 })
  itemCount: number;

  @ApiProperty({ description: 'Number of items requested per page', example: 10 })
  itemsPerPage: number;

  @ApiProperty({ description: 'Total number of items available', example: 48 })
  totalItems: number;

  @ApiProperty({ description: 'Total number of pages available', example: 5 })
  totalPages: number;

  @ApiProperty({ description: 'Indicates if there is a next page', example: true })
  hasNextPage: boolean;

  @ApiProperty({ description: 'Indicates if there is a previous page', example: false })
  hasPrevPage: boolean;
}
