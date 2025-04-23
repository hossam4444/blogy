import { Injectable, HttpStatus } from '@nestjs/common';
import { PaginationMeta } from '../interfaces/pagination-meta.interface';

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  error: boolean;
  data: T | T[] | null;
  pagination?: PaginationMeta | null;
}

@Injectable()
export class ResponseBuilderService<T> {
  private statusCode: HttpStatus = HttpStatus.OK;
  private message: string = 'Success';
  private responseData: T | T[] | null = null;
  private paginationInfo: PaginationMeta | null = null;
  private isError: boolean = false;

  status(status: HttpStatus): this {
    this.statusCode = status;
    return this;
  }

  data(data: T | T[] | null): this {
    this.responseData = data;
    return this;
  }

  error(isError: boolean = true, message?: string, statusCode?: HttpStatus): this {
    this.isError = isError;
    if (message) this.message = message;
    if (statusCode) this.statusCode = statusCode;
    if (isError && !message) this.message = 'An error occurred';
    if (isError && !statusCode && this.statusCode < 400) this.statusCode = HttpStatus.BAD_REQUEST; // Default error status
    return this;
  }

  messageText(message: string): this {
    this.message = message;
    return this;
  }

  pagination(pagination: PaginationMeta | null): this {
    this.paginationInfo = pagination;
    return this;
  }

  build(): ApiResponse<T> {
    const response: ApiResponse<T> = {
      statusCode: this.statusCode,
      message: this.message,
      error: this.isError,
      ...(this.paginationInfo && { pagination: this.paginationInfo }),
      data: this.responseData,
    };
    return response;
  }

  // temp static methods i will remove later
  static success<DataType>(data: DataType | DataType[] | null, message: string = 'Success', pagination?: PaginationMeta): ApiResponse<DataType> {
    const builder = new ResponseBuilderService<DataType>();
    builder.data(data).messageText(message);
    if (pagination) {
      builder.pagination(pagination);
    }
    return builder.build();
  }

  static Rerror<DataType = null>(message: string, statusCode: HttpStatus = HttpStatus.BAD_REQUEST, data: DataType | null = null): ApiResponse<DataType> {
    const builder = new ResponseBuilderService<DataType>();
    builder.error(true, message, statusCode).data(data);
    return builder.build();
  }
}