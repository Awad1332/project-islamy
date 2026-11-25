import { ArgumentMetadata, Body, PipeTransform, Query } from '@nestjs/common';
import { ApiBody, ApiQuery } from '@nestjs/swagger';
import { ZodTypeAny } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { AppError } from './errors';

export class ZodPipe<T extends ZodTypeAny> implements PipeTransform {
  constructor(private readonly schema: T) {}
  transform(value: unknown, _meta: ArgumentMetadata): unknown {
    const parsed = (this.schema as ZodTypeAny).safeParse(value ?? {});
    if (!parsed.success) {
      throw new AppError(422, 'VALIDATION_FAILED', 'Validation failed', parsed.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      })));
    }
    return parsed.data;
  }
}

function jsonSchema(schema: ZodTypeAny): Record<string, any> {
  const s = (zodToJsonSchema as (s: unknown, o: unknown) => unknown)(schema, { target: 'openApi3', $refStrategy: 'none' }) as Record<string, any>;
  delete s.$schema;
  return s;
}

/** Validated body + OpenAPI request schema in one decorator. */
export function ZBody(schema: ZodTypeAny): ParameterDecorator {
  return (target, key, index) => {
    if (key) {
      const descriptor = Object.getOwnPropertyDescriptor(target, key)!;
      ApiBody({ schema: jsonSchema(schema) })(target, key, descriptor);
    }
    Body(new ZodPipe(schema))(target, key, index);
  };
}

/** Validated query string + OpenAPI params. */
export function ZQuery(schema: ZodTypeAny): ParameterDecorator {
  return (target, key, index) => {
    if (key) {
      const descriptor = Object.getOwnPropertyDescriptor(target, key)!;
      const js = jsonSchema(schema);
      for (const [name, prop] of Object.entries<any>(js.properties ?? {})) {
        ApiQuery({ name, required: false, schema: prop })(target, key, descriptor);
      }
    }
    Query(new ZodPipe(schema))(target, key, index);
  };
}

export function paged<T>(items: T[], total: number, page: number, pageSize: number) {
  return { items, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}
