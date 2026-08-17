import { Transform, TransformFnParams } from 'class-transformer';

export const TrimAndLower = () =>
  Transform(({ value }: TransformFnParams) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  );
