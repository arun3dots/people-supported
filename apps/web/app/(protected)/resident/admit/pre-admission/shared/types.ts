export interface PartFormProps<T> {
  value: T;
  onChange: (patch: Partial<T>) => void;
  errors?: Record<string, string>;
}
