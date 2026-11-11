
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model CqcAuditLog
 * 
 */
export type CqcAuditLog = $Result.DefaultSelection<Prisma.$CqcAuditLogPayload>
/**
 * Model AuditIntegrityBlock
 * 
 */
export type AuditIntegrityBlock = $Result.DefaultSelection<Prisma.$AuditIntegrityBlockPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more CqcAuditLogs
 * const cqcAuditLogs = await prisma.cqcAuditLog.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more CqcAuditLogs
   * const cqcAuditLogs = await prisma.cqcAuditLog.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.cqcAuditLog`: Exposes CRUD operations for the **CqcAuditLog** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CqcAuditLogs
    * const cqcAuditLogs = await prisma.cqcAuditLog.findMany()
    * ```
    */
  get cqcAuditLog(): Prisma.CqcAuditLogDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.auditIntegrityBlock`: Exposes CRUD operations for the **AuditIntegrityBlock** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more AuditIntegrityBlocks
    * const auditIntegrityBlocks = await prisma.auditIntegrityBlock.findMany()
    * ```
    */
  get auditIntegrityBlock(): Prisma.AuditIntegrityBlockDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.19.3
   * Query Engine version: c2990dca591cba766e3b7ef5d9e8a84796e47ab7
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    CqcAuditLog: 'CqcAuditLog',
    AuditIntegrityBlock: 'AuditIntegrityBlock'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "cqcAuditLog" | "auditIntegrityBlock"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      CqcAuditLog: {
        payload: Prisma.$CqcAuditLogPayload<ExtArgs>
        fields: Prisma.CqcAuditLogFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CqcAuditLogFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CqcAuditLogPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CqcAuditLogFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CqcAuditLogPayload>
          }
          findFirst: {
            args: Prisma.CqcAuditLogFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CqcAuditLogPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CqcAuditLogFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CqcAuditLogPayload>
          }
          findMany: {
            args: Prisma.CqcAuditLogFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CqcAuditLogPayload>[]
          }
          create: {
            args: Prisma.CqcAuditLogCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CqcAuditLogPayload>
          }
          createMany: {
            args: Prisma.CqcAuditLogCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CqcAuditLogCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CqcAuditLogPayload>[]
          }
          delete: {
            args: Prisma.CqcAuditLogDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CqcAuditLogPayload>
          }
          update: {
            args: Prisma.CqcAuditLogUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CqcAuditLogPayload>
          }
          deleteMany: {
            args: Prisma.CqcAuditLogDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CqcAuditLogUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CqcAuditLogUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CqcAuditLogPayload>[]
          }
          upsert: {
            args: Prisma.CqcAuditLogUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CqcAuditLogPayload>
          }
          aggregate: {
            args: Prisma.CqcAuditLogAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCqcAuditLog>
          }
          groupBy: {
            args: Prisma.CqcAuditLogGroupByArgs<ExtArgs>
            result: $Utils.Optional<CqcAuditLogGroupByOutputType>[]
          }
          count: {
            args: Prisma.CqcAuditLogCountArgs<ExtArgs>
            result: $Utils.Optional<CqcAuditLogCountAggregateOutputType> | number
          }
        }
      }
      AuditIntegrityBlock: {
        payload: Prisma.$AuditIntegrityBlockPayload<ExtArgs>
        fields: Prisma.AuditIntegrityBlockFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AuditIntegrityBlockFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditIntegrityBlockPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AuditIntegrityBlockFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditIntegrityBlockPayload>
          }
          findFirst: {
            args: Prisma.AuditIntegrityBlockFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditIntegrityBlockPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AuditIntegrityBlockFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditIntegrityBlockPayload>
          }
          findMany: {
            args: Prisma.AuditIntegrityBlockFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditIntegrityBlockPayload>[]
          }
          create: {
            args: Prisma.AuditIntegrityBlockCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditIntegrityBlockPayload>
          }
          createMany: {
            args: Prisma.AuditIntegrityBlockCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AuditIntegrityBlockCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditIntegrityBlockPayload>[]
          }
          delete: {
            args: Prisma.AuditIntegrityBlockDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditIntegrityBlockPayload>
          }
          update: {
            args: Prisma.AuditIntegrityBlockUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditIntegrityBlockPayload>
          }
          deleteMany: {
            args: Prisma.AuditIntegrityBlockDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AuditIntegrityBlockUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AuditIntegrityBlockUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditIntegrityBlockPayload>[]
          }
          upsert: {
            args: Prisma.AuditIntegrityBlockUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditIntegrityBlockPayload>
          }
          aggregate: {
            args: Prisma.AuditIntegrityBlockAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAuditIntegrityBlock>
          }
          groupBy: {
            args: Prisma.AuditIntegrityBlockGroupByArgs<ExtArgs>
            result: $Utils.Optional<AuditIntegrityBlockGroupByOutputType>[]
          }
          count: {
            args: Prisma.AuditIntegrityBlockCountArgs<ExtArgs>
            result: $Utils.Optional<AuditIntegrityBlockCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    cqcAuditLog?: CqcAuditLogOmit
    auditIntegrityBlock?: AuditIntegrityBlockOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */



  /**
   * Models
   */

  /**
   * Model CqcAuditLog
   */

  export type AggregateCqcAuditLog = {
    _count: CqcAuditLogCountAggregateOutputType | null
    _avg: CqcAuditLogAvgAggregateOutputType | null
    _sum: CqcAuditLogSumAggregateOutputType | null
    _min: CqcAuditLogMinAggregateOutputType | null
    _max: CqcAuditLogMaxAggregateOutputType | null
  }

  export type CqcAuditLogAvgAggregateOutputType = {
    latitude: number | null
    longitude: number | null
  }

  export type CqcAuditLogSumAggregateOutputType = {
    latitude: number | null
    longitude: number | null
  }

  export type CqcAuditLogMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    userId: string | null
    userEmail: string | null
    userFullName: string | null
    userRoleName: string | null
    categoryType: string | null
    actionType: string | null
    entityType: string | null
    entityId: string | null
    entityLabel: string | null
    ipAddress: string | null
    userAgent: string | null
    latitude: number | null
    longitude: number | null
    locationName: string | null
    recordHash: string | null
    previousHash: string | null
    timestamp: Date | null
  }

  export type CqcAuditLogMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    userId: string | null
    userEmail: string | null
    userFullName: string | null
    userRoleName: string | null
    categoryType: string | null
    actionType: string | null
    entityType: string | null
    entityId: string | null
    entityLabel: string | null
    ipAddress: string | null
    userAgent: string | null
    latitude: number | null
    longitude: number | null
    locationName: string | null
    recordHash: string | null
    previousHash: string | null
    timestamp: Date | null
  }

  export type CqcAuditLogCountAggregateOutputType = {
    id: number
    tenantId: number
    userId: number
    userEmail: number
    userFullName: number
    userRoleName: number
    categoryType: number
    actionType: number
    entityType: number
    entityId: number
    entityLabel: number
    oldValue: number
    newValue: number
    metadata: number
    ipAddress: number
    userAgent: number
    latitude: number
    longitude: number
    locationName: number
    recordHash: number
    previousHash: number
    timestamp: number
    _all: number
  }


  export type CqcAuditLogAvgAggregateInputType = {
    latitude?: true
    longitude?: true
  }

  export type CqcAuditLogSumAggregateInputType = {
    latitude?: true
    longitude?: true
  }

  export type CqcAuditLogMinAggregateInputType = {
    id?: true
    tenantId?: true
    userId?: true
    userEmail?: true
    userFullName?: true
    userRoleName?: true
    categoryType?: true
    actionType?: true
    entityType?: true
    entityId?: true
    entityLabel?: true
    ipAddress?: true
    userAgent?: true
    latitude?: true
    longitude?: true
    locationName?: true
    recordHash?: true
    previousHash?: true
    timestamp?: true
  }

  export type CqcAuditLogMaxAggregateInputType = {
    id?: true
    tenantId?: true
    userId?: true
    userEmail?: true
    userFullName?: true
    userRoleName?: true
    categoryType?: true
    actionType?: true
    entityType?: true
    entityId?: true
    entityLabel?: true
    ipAddress?: true
    userAgent?: true
    latitude?: true
    longitude?: true
    locationName?: true
    recordHash?: true
    previousHash?: true
    timestamp?: true
  }

  export type CqcAuditLogCountAggregateInputType = {
    id?: true
    tenantId?: true
    userId?: true
    userEmail?: true
    userFullName?: true
    userRoleName?: true
    categoryType?: true
    actionType?: true
    entityType?: true
    entityId?: true
    entityLabel?: true
    oldValue?: true
    newValue?: true
    metadata?: true
    ipAddress?: true
    userAgent?: true
    latitude?: true
    longitude?: true
    locationName?: true
    recordHash?: true
    previousHash?: true
    timestamp?: true
    _all?: true
  }

  export type CqcAuditLogAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CqcAuditLog to aggregate.
     */
    where?: CqcAuditLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CqcAuditLogs to fetch.
     */
    orderBy?: CqcAuditLogOrderByWithRelationInput | CqcAuditLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CqcAuditLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CqcAuditLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CqcAuditLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned CqcAuditLogs
    **/
    _count?: true | CqcAuditLogCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: CqcAuditLogAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: CqcAuditLogSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CqcAuditLogMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CqcAuditLogMaxAggregateInputType
  }

  export type GetCqcAuditLogAggregateType<T extends CqcAuditLogAggregateArgs> = {
        [P in keyof T & keyof AggregateCqcAuditLog]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCqcAuditLog[P]>
      : GetScalarType<T[P], AggregateCqcAuditLog[P]>
  }




  export type CqcAuditLogGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CqcAuditLogWhereInput
    orderBy?: CqcAuditLogOrderByWithAggregationInput | CqcAuditLogOrderByWithAggregationInput[]
    by: CqcAuditLogScalarFieldEnum[] | CqcAuditLogScalarFieldEnum
    having?: CqcAuditLogScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CqcAuditLogCountAggregateInputType | true
    _avg?: CqcAuditLogAvgAggregateInputType
    _sum?: CqcAuditLogSumAggregateInputType
    _min?: CqcAuditLogMinAggregateInputType
    _max?: CqcAuditLogMaxAggregateInputType
  }

  export type CqcAuditLogGroupByOutputType = {
    id: string
    tenantId: string | null
    userId: string | null
    userEmail: string | null
    userFullName: string | null
    userRoleName: string | null
    categoryType: string
    actionType: string
    entityType: string | null
    entityId: string | null
    entityLabel: string | null
    oldValue: JsonValue | null
    newValue: JsonValue | null
    metadata: JsonValue | null
    ipAddress: string | null
    userAgent: string | null
    latitude: number | null
    longitude: number | null
    locationName: string | null
    recordHash: string
    previousHash: string | null
    timestamp: Date
    _count: CqcAuditLogCountAggregateOutputType | null
    _avg: CqcAuditLogAvgAggregateOutputType | null
    _sum: CqcAuditLogSumAggregateOutputType | null
    _min: CqcAuditLogMinAggregateOutputType | null
    _max: CqcAuditLogMaxAggregateOutputType | null
  }

  type GetCqcAuditLogGroupByPayload<T extends CqcAuditLogGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CqcAuditLogGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CqcAuditLogGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CqcAuditLogGroupByOutputType[P]>
            : GetScalarType<T[P], CqcAuditLogGroupByOutputType[P]>
        }
      >
    >


  export type CqcAuditLogSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    userId?: boolean
    userEmail?: boolean
    userFullName?: boolean
    userRoleName?: boolean
    categoryType?: boolean
    actionType?: boolean
    entityType?: boolean
    entityId?: boolean
    entityLabel?: boolean
    oldValue?: boolean
    newValue?: boolean
    metadata?: boolean
    ipAddress?: boolean
    userAgent?: boolean
    latitude?: boolean
    longitude?: boolean
    locationName?: boolean
    recordHash?: boolean
    previousHash?: boolean
    timestamp?: boolean
  }, ExtArgs["result"]["cqcAuditLog"]>

  export type CqcAuditLogSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    userId?: boolean
    userEmail?: boolean
    userFullName?: boolean
    userRoleName?: boolean
    categoryType?: boolean
    actionType?: boolean
    entityType?: boolean
    entityId?: boolean
    entityLabel?: boolean
    oldValue?: boolean
    newValue?: boolean
    metadata?: boolean
    ipAddress?: boolean
    userAgent?: boolean
    latitude?: boolean
    longitude?: boolean
    locationName?: boolean
    recordHash?: boolean
    previousHash?: boolean
    timestamp?: boolean
  }, ExtArgs["result"]["cqcAuditLog"]>

  export type CqcAuditLogSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    userId?: boolean
    userEmail?: boolean
    userFullName?: boolean
    userRoleName?: boolean
    categoryType?: boolean
    actionType?: boolean
    entityType?: boolean
    entityId?: boolean
    entityLabel?: boolean
    oldValue?: boolean
    newValue?: boolean
    metadata?: boolean
    ipAddress?: boolean
    userAgent?: boolean
    latitude?: boolean
    longitude?: boolean
    locationName?: boolean
    recordHash?: boolean
    previousHash?: boolean
    timestamp?: boolean
  }, ExtArgs["result"]["cqcAuditLog"]>

  export type CqcAuditLogSelectScalar = {
    id?: boolean
    tenantId?: boolean
    userId?: boolean
    userEmail?: boolean
    userFullName?: boolean
    userRoleName?: boolean
    categoryType?: boolean
    actionType?: boolean
    entityType?: boolean
    entityId?: boolean
    entityLabel?: boolean
    oldValue?: boolean
    newValue?: boolean
    metadata?: boolean
    ipAddress?: boolean
    userAgent?: boolean
    latitude?: boolean
    longitude?: boolean
    locationName?: boolean
    recordHash?: boolean
    previousHash?: boolean
    timestamp?: boolean
  }

  export type CqcAuditLogOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "userId" | "userEmail" | "userFullName" | "userRoleName" | "categoryType" | "actionType" | "entityType" | "entityId" | "entityLabel" | "oldValue" | "newValue" | "metadata" | "ipAddress" | "userAgent" | "latitude" | "longitude" | "locationName" | "recordHash" | "previousHash" | "timestamp", ExtArgs["result"]["cqcAuditLog"]>

  export type $CqcAuditLogPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CqcAuditLog"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string | null
      userId: string | null
      userEmail: string | null
      userFullName: string | null
      userRoleName: string | null
      categoryType: string
      actionType: string
      entityType: string | null
      entityId: string | null
      entityLabel: string | null
      oldValue: Prisma.JsonValue | null
      newValue: Prisma.JsonValue | null
      metadata: Prisma.JsonValue | null
      ipAddress: string | null
      userAgent: string | null
      latitude: number | null
      longitude: number | null
      locationName: string | null
      recordHash: string
      previousHash: string | null
      timestamp: Date
    }, ExtArgs["result"]["cqcAuditLog"]>
    composites: {}
  }

  type CqcAuditLogGetPayload<S extends boolean | null | undefined | CqcAuditLogDefaultArgs> = $Result.GetResult<Prisma.$CqcAuditLogPayload, S>

  type CqcAuditLogCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CqcAuditLogFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CqcAuditLogCountAggregateInputType | true
    }

  export interface CqcAuditLogDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CqcAuditLog'], meta: { name: 'CqcAuditLog' } }
    /**
     * Find zero or one CqcAuditLog that matches the filter.
     * @param {CqcAuditLogFindUniqueArgs} args - Arguments to find a CqcAuditLog
     * @example
     * // Get one CqcAuditLog
     * const cqcAuditLog = await prisma.cqcAuditLog.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CqcAuditLogFindUniqueArgs>(args: SelectSubset<T, CqcAuditLogFindUniqueArgs<ExtArgs>>): Prisma__CqcAuditLogClient<$Result.GetResult<Prisma.$CqcAuditLogPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one CqcAuditLog that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CqcAuditLogFindUniqueOrThrowArgs} args - Arguments to find a CqcAuditLog
     * @example
     * // Get one CqcAuditLog
     * const cqcAuditLog = await prisma.cqcAuditLog.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CqcAuditLogFindUniqueOrThrowArgs>(args: SelectSubset<T, CqcAuditLogFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CqcAuditLogClient<$Result.GetResult<Prisma.$CqcAuditLogPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CqcAuditLog that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CqcAuditLogFindFirstArgs} args - Arguments to find a CqcAuditLog
     * @example
     * // Get one CqcAuditLog
     * const cqcAuditLog = await prisma.cqcAuditLog.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CqcAuditLogFindFirstArgs>(args?: SelectSubset<T, CqcAuditLogFindFirstArgs<ExtArgs>>): Prisma__CqcAuditLogClient<$Result.GetResult<Prisma.$CqcAuditLogPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CqcAuditLog that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CqcAuditLogFindFirstOrThrowArgs} args - Arguments to find a CqcAuditLog
     * @example
     * // Get one CqcAuditLog
     * const cqcAuditLog = await prisma.cqcAuditLog.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CqcAuditLogFindFirstOrThrowArgs>(args?: SelectSubset<T, CqcAuditLogFindFirstOrThrowArgs<ExtArgs>>): Prisma__CqcAuditLogClient<$Result.GetResult<Prisma.$CqcAuditLogPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more CqcAuditLogs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CqcAuditLogFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CqcAuditLogs
     * const cqcAuditLogs = await prisma.cqcAuditLog.findMany()
     * 
     * // Get first 10 CqcAuditLogs
     * const cqcAuditLogs = await prisma.cqcAuditLog.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const cqcAuditLogWithIdOnly = await prisma.cqcAuditLog.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CqcAuditLogFindManyArgs>(args?: SelectSubset<T, CqcAuditLogFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CqcAuditLogPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a CqcAuditLog.
     * @param {CqcAuditLogCreateArgs} args - Arguments to create a CqcAuditLog.
     * @example
     * // Create one CqcAuditLog
     * const CqcAuditLog = await prisma.cqcAuditLog.create({
     *   data: {
     *     // ... data to create a CqcAuditLog
     *   }
     * })
     * 
     */
    create<T extends CqcAuditLogCreateArgs>(args: SelectSubset<T, CqcAuditLogCreateArgs<ExtArgs>>): Prisma__CqcAuditLogClient<$Result.GetResult<Prisma.$CqcAuditLogPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many CqcAuditLogs.
     * @param {CqcAuditLogCreateManyArgs} args - Arguments to create many CqcAuditLogs.
     * @example
     * // Create many CqcAuditLogs
     * const cqcAuditLog = await prisma.cqcAuditLog.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CqcAuditLogCreateManyArgs>(args?: SelectSubset<T, CqcAuditLogCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many CqcAuditLogs and returns the data saved in the database.
     * @param {CqcAuditLogCreateManyAndReturnArgs} args - Arguments to create many CqcAuditLogs.
     * @example
     * // Create many CqcAuditLogs
     * const cqcAuditLog = await prisma.cqcAuditLog.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many CqcAuditLogs and only return the `id`
     * const cqcAuditLogWithIdOnly = await prisma.cqcAuditLog.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CqcAuditLogCreateManyAndReturnArgs>(args?: SelectSubset<T, CqcAuditLogCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CqcAuditLogPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a CqcAuditLog.
     * @param {CqcAuditLogDeleteArgs} args - Arguments to delete one CqcAuditLog.
     * @example
     * // Delete one CqcAuditLog
     * const CqcAuditLog = await prisma.cqcAuditLog.delete({
     *   where: {
     *     // ... filter to delete one CqcAuditLog
     *   }
     * })
     * 
     */
    delete<T extends CqcAuditLogDeleteArgs>(args: SelectSubset<T, CqcAuditLogDeleteArgs<ExtArgs>>): Prisma__CqcAuditLogClient<$Result.GetResult<Prisma.$CqcAuditLogPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one CqcAuditLog.
     * @param {CqcAuditLogUpdateArgs} args - Arguments to update one CqcAuditLog.
     * @example
     * // Update one CqcAuditLog
     * const cqcAuditLog = await prisma.cqcAuditLog.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CqcAuditLogUpdateArgs>(args: SelectSubset<T, CqcAuditLogUpdateArgs<ExtArgs>>): Prisma__CqcAuditLogClient<$Result.GetResult<Prisma.$CqcAuditLogPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more CqcAuditLogs.
     * @param {CqcAuditLogDeleteManyArgs} args - Arguments to filter CqcAuditLogs to delete.
     * @example
     * // Delete a few CqcAuditLogs
     * const { count } = await prisma.cqcAuditLog.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CqcAuditLogDeleteManyArgs>(args?: SelectSubset<T, CqcAuditLogDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CqcAuditLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CqcAuditLogUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CqcAuditLogs
     * const cqcAuditLog = await prisma.cqcAuditLog.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CqcAuditLogUpdateManyArgs>(args: SelectSubset<T, CqcAuditLogUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CqcAuditLogs and returns the data updated in the database.
     * @param {CqcAuditLogUpdateManyAndReturnArgs} args - Arguments to update many CqcAuditLogs.
     * @example
     * // Update many CqcAuditLogs
     * const cqcAuditLog = await prisma.cqcAuditLog.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more CqcAuditLogs and only return the `id`
     * const cqcAuditLogWithIdOnly = await prisma.cqcAuditLog.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CqcAuditLogUpdateManyAndReturnArgs>(args: SelectSubset<T, CqcAuditLogUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CqcAuditLogPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one CqcAuditLog.
     * @param {CqcAuditLogUpsertArgs} args - Arguments to update or create a CqcAuditLog.
     * @example
     * // Update or create a CqcAuditLog
     * const cqcAuditLog = await prisma.cqcAuditLog.upsert({
     *   create: {
     *     // ... data to create a CqcAuditLog
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CqcAuditLog we want to update
     *   }
     * })
     */
    upsert<T extends CqcAuditLogUpsertArgs>(args: SelectSubset<T, CqcAuditLogUpsertArgs<ExtArgs>>): Prisma__CqcAuditLogClient<$Result.GetResult<Prisma.$CqcAuditLogPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of CqcAuditLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CqcAuditLogCountArgs} args - Arguments to filter CqcAuditLogs to count.
     * @example
     * // Count the number of CqcAuditLogs
     * const count = await prisma.cqcAuditLog.count({
     *   where: {
     *     // ... the filter for the CqcAuditLogs we want to count
     *   }
     * })
    **/
    count<T extends CqcAuditLogCountArgs>(
      args?: Subset<T, CqcAuditLogCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CqcAuditLogCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CqcAuditLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CqcAuditLogAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CqcAuditLogAggregateArgs>(args: Subset<T, CqcAuditLogAggregateArgs>): Prisma.PrismaPromise<GetCqcAuditLogAggregateType<T>>

    /**
     * Group by CqcAuditLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CqcAuditLogGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CqcAuditLogGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CqcAuditLogGroupByArgs['orderBy'] }
        : { orderBy?: CqcAuditLogGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CqcAuditLogGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCqcAuditLogGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CqcAuditLog model
   */
  readonly fields: CqcAuditLogFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CqcAuditLog.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CqcAuditLogClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the CqcAuditLog model
   */
  interface CqcAuditLogFieldRefs {
    readonly id: FieldRef<"CqcAuditLog", 'String'>
    readonly tenantId: FieldRef<"CqcAuditLog", 'String'>
    readonly userId: FieldRef<"CqcAuditLog", 'String'>
    readonly userEmail: FieldRef<"CqcAuditLog", 'String'>
    readonly userFullName: FieldRef<"CqcAuditLog", 'String'>
    readonly userRoleName: FieldRef<"CqcAuditLog", 'String'>
    readonly categoryType: FieldRef<"CqcAuditLog", 'String'>
    readonly actionType: FieldRef<"CqcAuditLog", 'String'>
    readonly entityType: FieldRef<"CqcAuditLog", 'String'>
    readonly entityId: FieldRef<"CqcAuditLog", 'String'>
    readonly entityLabel: FieldRef<"CqcAuditLog", 'String'>
    readonly oldValue: FieldRef<"CqcAuditLog", 'Json'>
    readonly newValue: FieldRef<"CqcAuditLog", 'Json'>
    readonly metadata: FieldRef<"CqcAuditLog", 'Json'>
    readonly ipAddress: FieldRef<"CqcAuditLog", 'String'>
    readonly userAgent: FieldRef<"CqcAuditLog", 'String'>
    readonly latitude: FieldRef<"CqcAuditLog", 'Float'>
    readonly longitude: FieldRef<"CqcAuditLog", 'Float'>
    readonly locationName: FieldRef<"CqcAuditLog", 'String'>
    readonly recordHash: FieldRef<"CqcAuditLog", 'String'>
    readonly previousHash: FieldRef<"CqcAuditLog", 'String'>
    readonly timestamp: FieldRef<"CqcAuditLog", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * CqcAuditLog findUnique
   */
  export type CqcAuditLogFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CqcAuditLog
     */
    select?: CqcAuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CqcAuditLog
     */
    omit?: CqcAuditLogOmit<ExtArgs> | null
    /**
     * Filter, which CqcAuditLog to fetch.
     */
    where: CqcAuditLogWhereUniqueInput
  }

  /**
   * CqcAuditLog findUniqueOrThrow
   */
  export type CqcAuditLogFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CqcAuditLog
     */
    select?: CqcAuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CqcAuditLog
     */
    omit?: CqcAuditLogOmit<ExtArgs> | null
    /**
     * Filter, which CqcAuditLog to fetch.
     */
    where: CqcAuditLogWhereUniqueInput
  }

  /**
   * CqcAuditLog findFirst
   */
  export type CqcAuditLogFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CqcAuditLog
     */
    select?: CqcAuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CqcAuditLog
     */
    omit?: CqcAuditLogOmit<ExtArgs> | null
    /**
     * Filter, which CqcAuditLog to fetch.
     */
    where?: CqcAuditLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CqcAuditLogs to fetch.
     */
    orderBy?: CqcAuditLogOrderByWithRelationInput | CqcAuditLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CqcAuditLogs.
     */
    cursor?: CqcAuditLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CqcAuditLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CqcAuditLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CqcAuditLogs.
     */
    distinct?: CqcAuditLogScalarFieldEnum | CqcAuditLogScalarFieldEnum[]
  }

  /**
   * CqcAuditLog findFirstOrThrow
   */
  export type CqcAuditLogFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CqcAuditLog
     */
    select?: CqcAuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CqcAuditLog
     */
    omit?: CqcAuditLogOmit<ExtArgs> | null
    /**
     * Filter, which CqcAuditLog to fetch.
     */
    where?: CqcAuditLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CqcAuditLogs to fetch.
     */
    orderBy?: CqcAuditLogOrderByWithRelationInput | CqcAuditLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CqcAuditLogs.
     */
    cursor?: CqcAuditLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CqcAuditLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CqcAuditLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CqcAuditLogs.
     */
    distinct?: CqcAuditLogScalarFieldEnum | CqcAuditLogScalarFieldEnum[]
  }

  /**
   * CqcAuditLog findMany
   */
  export type CqcAuditLogFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CqcAuditLog
     */
    select?: CqcAuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CqcAuditLog
     */
    omit?: CqcAuditLogOmit<ExtArgs> | null
    /**
     * Filter, which CqcAuditLogs to fetch.
     */
    where?: CqcAuditLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CqcAuditLogs to fetch.
     */
    orderBy?: CqcAuditLogOrderByWithRelationInput | CqcAuditLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing CqcAuditLogs.
     */
    cursor?: CqcAuditLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CqcAuditLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CqcAuditLogs.
     */
    skip?: number
    distinct?: CqcAuditLogScalarFieldEnum | CqcAuditLogScalarFieldEnum[]
  }

  /**
   * CqcAuditLog create
   */
  export type CqcAuditLogCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CqcAuditLog
     */
    select?: CqcAuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CqcAuditLog
     */
    omit?: CqcAuditLogOmit<ExtArgs> | null
    /**
     * The data needed to create a CqcAuditLog.
     */
    data: XOR<CqcAuditLogCreateInput, CqcAuditLogUncheckedCreateInput>
  }

  /**
   * CqcAuditLog createMany
   */
  export type CqcAuditLogCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CqcAuditLogs.
     */
    data: CqcAuditLogCreateManyInput | CqcAuditLogCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CqcAuditLog createManyAndReturn
   */
  export type CqcAuditLogCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CqcAuditLog
     */
    select?: CqcAuditLogSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CqcAuditLog
     */
    omit?: CqcAuditLogOmit<ExtArgs> | null
    /**
     * The data used to create many CqcAuditLogs.
     */
    data: CqcAuditLogCreateManyInput | CqcAuditLogCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CqcAuditLog update
   */
  export type CqcAuditLogUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CqcAuditLog
     */
    select?: CqcAuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CqcAuditLog
     */
    omit?: CqcAuditLogOmit<ExtArgs> | null
    /**
     * The data needed to update a CqcAuditLog.
     */
    data: XOR<CqcAuditLogUpdateInput, CqcAuditLogUncheckedUpdateInput>
    /**
     * Choose, which CqcAuditLog to update.
     */
    where: CqcAuditLogWhereUniqueInput
  }

  /**
   * CqcAuditLog updateMany
   */
  export type CqcAuditLogUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CqcAuditLogs.
     */
    data: XOR<CqcAuditLogUpdateManyMutationInput, CqcAuditLogUncheckedUpdateManyInput>
    /**
     * Filter which CqcAuditLogs to update
     */
    where?: CqcAuditLogWhereInput
    /**
     * Limit how many CqcAuditLogs to update.
     */
    limit?: number
  }

  /**
   * CqcAuditLog updateManyAndReturn
   */
  export type CqcAuditLogUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CqcAuditLog
     */
    select?: CqcAuditLogSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CqcAuditLog
     */
    omit?: CqcAuditLogOmit<ExtArgs> | null
    /**
     * The data used to update CqcAuditLogs.
     */
    data: XOR<CqcAuditLogUpdateManyMutationInput, CqcAuditLogUncheckedUpdateManyInput>
    /**
     * Filter which CqcAuditLogs to update
     */
    where?: CqcAuditLogWhereInput
    /**
     * Limit how many CqcAuditLogs to update.
     */
    limit?: number
  }

  /**
   * CqcAuditLog upsert
   */
  export type CqcAuditLogUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CqcAuditLog
     */
    select?: CqcAuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CqcAuditLog
     */
    omit?: CqcAuditLogOmit<ExtArgs> | null
    /**
     * The filter to search for the CqcAuditLog to update in case it exists.
     */
    where: CqcAuditLogWhereUniqueInput
    /**
     * In case the CqcAuditLog found by the `where` argument doesn't exist, create a new CqcAuditLog with this data.
     */
    create: XOR<CqcAuditLogCreateInput, CqcAuditLogUncheckedCreateInput>
    /**
     * In case the CqcAuditLog was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CqcAuditLogUpdateInput, CqcAuditLogUncheckedUpdateInput>
  }

  /**
   * CqcAuditLog delete
   */
  export type CqcAuditLogDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CqcAuditLog
     */
    select?: CqcAuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CqcAuditLog
     */
    omit?: CqcAuditLogOmit<ExtArgs> | null
    /**
     * Filter which CqcAuditLog to delete.
     */
    where: CqcAuditLogWhereUniqueInput
  }

  /**
   * CqcAuditLog deleteMany
   */
  export type CqcAuditLogDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CqcAuditLogs to delete
     */
    where?: CqcAuditLogWhereInput
    /**
     * Limit how many CqcAuditLogs to delete.
     */
    limit?: number
  }

  /**
   * CqcAuditLog without action
   */
  export type CqcAuditLogDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CqcAuditLog
     */
    select?: CqcAuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CqcAuditLog
     */
    omit?: CqcAuditLogOmit<ExtArgs> | null
  }


  /**
   * Model AuditIntegrityBlock
   */

  export type AggregateAuditIntegrityBlock = {
    _count: AuditIntegrityBlockCountAggregateOutputType | null
    _avg: AuditIntegrityBlockAvgAggregateOutputType | null
    _sum: AuditIntegrityBlockSumAggregateOutputType | null
    _min: AuditIntegrityBlockMinAggregateOutputType | null
    _max: AuditIntegrityBlockMaxAggregateOutputType | null
  }

  export type AuditIntegrityBlockAvgAggregateOutputType = {
    blockNumber: number | null
    recordCount: number | null
  }

  export type AuditIntegrityBlockSumAggregateOutputType = {
    blockNumber: number | null
    recordCount: number | null
  }

  export type AuditIntegrityBlockMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    blockNumber: number | null
    startRecordId: string | null
    endRecordId: string | null
    recordCount: number | null
    cumulativeHash: string | null
    timestamp: Date | null
  }

  export type AuditIntegrityBlockMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    blockNumber: number | null
    startRecordId: string | null
    endRecordId: string | null
    recordCount: number | null
    cumulativeHash: string | null
    timestamp: Date | null
  }

  export type AuditIntegrityBlockCountAggregateOutputType = {
    id: number
    tenantId: number
    blockNumber: number
    startRecordId: number
    endRecordId: number
    recordCount: number
    cumulativeHash: number
    timestamp: number
    _all: number
  }


  export type AuditIntegrityBlockAvgAggregateInputType = {
    blockNumber?: true
    recordCount?: true
  }

  export type AuditIntegrityBlockSumAggregateInputType = {
    blockNumber?: true
    recordCount?: true
  }

  export type AuditIntegrityBlockMinAggregateInputType = {
    id?: true
    tenantId?: true
    blockNumber?: true
    startRecordId?: true
    endRecordId?: true
    recordCount?: true
    cumulativeHash?: true
    timestamp?: true
  }

  export type AuditIntegrityBlockMaxAggregateInputType = {
    id?: true
    tenantId?: true
    blockNumber?: true
    startRecordId?: true
    endRecordId?: true
    recordCount?: true
    cumulativeHash?: true
    timestamp?: true
  }

  export type AuditIntegrityBlockCountAggregateInputType = {
    id?: true
    tenantId?: true
    blockNumber?: true
    startRecordId?: true
    endRecordId?: true
    recordCount?: true
    cumulativeHash?: true
    timestamp?: true
    _all?: true
  }

  export type AuditIntegrityBlockAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AuditIntegrityBlock to aggregate.
     */
    where?: AuditIntegrityBlockWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AuditIntegrityBlocks to fetch.
     */
    orderBy?: AuditIntegrityBlockOrderByWithRelationInput | AuditIntegrityBlockOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AuditIntegrityBlockWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AuditIntegrityBlocks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AuditIntegrityBlocks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned AuditIntegrityBlocks
    **/
    _count?: true | AuditIntegrityBlockCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: AuditIntegrityBlockAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: AuditIntegrityBlockSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AuditIntegrityBlockMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AuditIntegrityBlockMaxAggregateInputType
  }

  export type GetAuditIntegrityBlockAggregateType<T extends AuditIntegrityBlockAggregateArgs> = {
        [P in keyof T & keyof AggregateAuditIntegrityBlock]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAuditIntegrityBlock[P]>
      : GetScalarType<T[P], AggregateAuditIntegrityBlock[P]>
  }




  export type AuditIntegrityBlockGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AuditIntegrityBlockWhereInput
    orderBy?: AuditIntegrityBlockOrderByWithAggregationInput | AuditIntegrityBlockOrderByWithAggregationInput[]
    by: AuditIntegrityBlockScalarFieldEnum[] | AuditIntegrityBlockScalarFieldEnum
    having?: AuditIntegrityBlockScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AuditIntegrityBlockCountAggregateInputType | true
    _avg?: AuditIntegrityBlockAvgAggregateInputType
    _sum?: AuditIntegrityBlockSumAggregateInputType
    _min?: AuditIntegrityBlockMinAggregateInputType
    _max?: AuditIntegrityBlockMaxAggregateInputType
  }

  export type AuditIntegrityBlockGroupByOutputType = {
    id: string
    tenantId: string | null
    blockNumber: number
    startRecordId: string
    endRecordId: string
    recordCount: number
    cumulativeHash: string
    timestamp: Date
    _count: AuditIntegrityBlockCountAggregateOutputType | null
    _avg: AuditIntegrityBlockAvgAggregateOutputType | null
    _sum: AuditIntegrityBlockSumAggregateOutputType | null
    _min: AuditIntegrityBlockMinAggregateOutputType | null
    _max: AuditIntegrityBlockMaxAggregateOutputType | null
  }

  type GetAuditIntegrityBlockGroupByPayload<T extends AuditIntegrityBlockGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AuditIntegrityBlockGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AuditIntegrityBlockGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AuditIntegrityBlockGroupByOutputType[P]>
            : GetScalarType<T[P], AuditIntegrityBlockGroupByOutputType[P]>
        }
      >
    >


  export type AuditIntegrityBlockSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    blockNumber?: boolean
    startRecordId?: boolean
    endRecordId?: boolean
    recordCount?: boolean
    cumulativeHash?: boolean
    timestamp?: boolean
  }, ExtArgs["result"]["auditIntegrityBlock"]>

  export type AuditIntegrityBlockSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    blockNumber?: boolean
    startRecordId?: boolean
    endRecordId?: boolean
    recordCount?: boolean
    cumulativeHash?: boolean
    timestamp?: boolean
  }, ExtArgs["result"]["auditIntegrityBlock"]>

  export type AuditIntegrityBlockSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    blockNumber?: boolean
    startRecordId?: boolean
    endRecordId?: boolean
    recordCount?: boolean
    cumulativeHash?: boolean
    timestamp?: boolean
  }, ExtArgs["result"]["auditIntegrityBlock"]>

  export type AuditIntegrityBlockSelectScalar = {
    id?: boolean
    tenantId?: boolean
    blockNumber?: boolean
    startRecordId?: boolean
    endRecordId?: boolean
    recordCount?: boolean
    cumulativeHash?: boolean
    timestamp?: boolean
  }

  export type AuditIntegrityBlockOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "blockNumber" | "startRecordId" | "endRecordId" | "recordCount" | "cumulativeHash" | "timestamp", ExtArgs["result"]["auditIntegrityBlock"]>

  export type $AuditIntegrityBlockPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "AuditIntegrityBlock"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string | null
      blockNumber: number
      startRecordId: string
      endRecordId: string
      recordCount: number
      cumulativeHash: string
      timestamp: Date
    }, ExtArgs["result"]["auditIntegrityBlock"]>
    composites: {}
  }

  type AuditIntegrityBlockGetPayload<S extends boolean | null | undefined | AuditIntegrityBlockDefaultArgs> = $Result.GetResult<Prisma.$AuditIntegrityBlockPayload, S>

  type AuditIntegrityBlockCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AuditIntegrityBlockFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AuditIntegrityBlockCountAggregateInputType | true
    }

  export interface AuditIntegrityBlockDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['AuditIntegrityBlock'], meta: { name: 'AuditIntegrityBlock' } }
    /**
     * Find zero or one AuditIntegrityBlock that matches the filter.
     * @param {AuditIntegrityBlockFindUniqueArgs} args - Arguments to find a AuditIntegrityBlock
     * @example
     * // Get one AuditIntegrityBlock
     * const auditIntegrityBlock = await prisma.auditIntegrityBlock.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AuditIntegrityBlockFindUniqueArgs>(args: SelectSubset<T, AuditIntegrityBlockFindUniqueArgs<ExtArgs>>): Prisma__AuditIntegrityBlockClient<$Result.GetResult<Prisma.$AuditIntegrityBlockPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one AuditIntegrityBlock that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AuditIntegrityBlockFindUniqueOrThrowArgs} args - Arguments to find a AuditIntegrityBlock
     * @example
     * // Get one AuditIntegrityBlock
     * const auditIntegrityBlock = await prisma.auditIntegrityBlock.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AuditIntegrityBlockFindUniqueOrThrowArgs>(args: SelectSubset<T, AuditIntegrityBlockFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AuditIntegrityBlockClient<$Result.GetResult<Prisma.$AuditIntegrityBlockPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AuditIntegrityBlock that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditIntegrityBlockFindFirstArgs} args - Arguments to find a AuditIntegrityBlock
     * @example
     * // Get one AuditIntegrityBlock
     * const auditIntegrityBlock = await prisma.auditIntegrityBlock.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AuditIntegrityBlockFindFirstArgs>(args?: SelectSubset<T, AuditIntegrityBlockFindFirstArgs<ExtArgs>>): Prisma__AuditIntegrityBlockClient<$Result.GetResult<Prisma.$AuditIntegrityBlockPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AuditIntegrityBlock that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditIntegrityBlockFindFirstOrThrowArgs} args - Arguments to find a AuditIntegrityBlock
     * @example
     * // Get one AuditIntegrityBlock
     * const auditIntegrityBlock = await prisma.auditIntegrityBlock.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AuditIntegrityBlockFindFirstOrThrowArgs>(args?: SelectSubset<T, AuditIntegrityBlockFindFirstOrThrowArgs<ExtArgs>>): Prisma__AuditIntegrityBlockClient<$Result.GetResult<Prisma.$AuditIntegrityBlockPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more AuditIntegrityBlocks that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditIntegrityBlockFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all AuditIntegrityBlocks
     * const auditIntegrityBlocks = await prisma.auditIntegrityBlock.findMany()
     * 
     * // Get first 10 AuditIntegrityBlocks
     * const auditIntegrityBlocks = await prisma.auditIntegrityBlock.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const auditIntegrityBlockWithIdOnly = await prisma.auditIntegrityBlock.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AuditIntegrityBlockFindManyArgs>(args?: SelectSubset<T, AuditIntegrityBlockFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AuditIntegrityBlockPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a AuditIntegrityBlock.
     * @param {AuditIntegrityBlockCreateArgs} args - Arguments to create a AuditIntegrityBlock.
     * @example
     * // Create one AuditIntegrityBlock
     * const AuditIntegrityBlock = await prisma.auditIntegrityBlock.create({
     *   data: {
     *     // ... data to create a AuditIntegrityBlock
     *   }
     * })
     * 
     */
    create<T extends AuditIntegrityBlockCreateArgs>(args: SelectSubset<T, AuditIntegrityBlockCreateArgs<ExtArgs>>): Prisma__AuditIntegrityBlockClient<$Result.GetResult<Prisma.$AuditIntegrityBlockPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many AuditIntegrityBlocks.
     * @param {AuditIntegrityBlockCreateManyArgs} args - Arguments to create many AuditIntegrityBlocks.
     * @example
     * // Create many AuditIntegrityBlocks
     * const auditIntegrityBlock = await prisma.auditIntegrityBlock.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AuditIntegrityBlockCreateManyArgs>(args?: SelectSubset<T, AuditIntegrityBlockCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many AuditIntegrityBlocks and returns the data saved in the database.
     * @param {AuditIntegrityBlockCreateManyAndReturnArgs} args - Arguments to create many AuditIntegrityBlocks.
     * @example
     * // Create many AuditIntegrityBlocks
     * const auditIntegrityBlock = await prisma.auditIntegrityBlock.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many AuditIntegrityBlocks and only return the `id`
     * const auditIntegrityBlockWithIdOnly = await prisma.auditIntegrityBlock.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AuditIntegrityBlockCreateManyAndReturnArgs>(args?: SelectSubset<T, AuditIntegrityBlockCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AuditIntegrityBlockPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a AuditIntegrityBlock.
     * @param {AuditIntegrityBlockDeleteArgs} args - Arguments to delete one AuditIntegrityBlock.
     * @example
     * // Delete one AuditIntegrityBlock
     * const AuditIntegrityBlock = await prisma.auditIntegrityBlock.delete({
     *   where: {
     *     // ... filter to delete one AuditIntegrityBlock
     *   }
     * })
     * 
     */
    delete<T extends AuditIntegrityBlockDeleteArgs>(args: SelectSubset<T, AuditIntegrityBlockDeleteArgs<ExtArgs>>): Prisma__AuditIntegrityBlockClient<$Result.GetResult<Prisma.$AuditIntegrityBlockPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one AuditIntegrityBlock.
     * @param {AuditIntegrityBlockUpdateArgs} args - Arguments to update one AuditIntegrityBlock.
     * @example
     * // Update one AuditIntegrityBlock
     * const auditIntegrityBlock = await prisma.auditIntegrityBlock.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AuditIntegrityBlockUpdateArgs>(args: SelectSubset<T, AuditIntegrityBlockUpdateArgs<ExtArgs>>): Prisma__AuditIntegrityBlockClient<$Result.GetResult<Prisma.$AuditIntegrityBlockPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more AuditIntegrityBlocks.
     * @param {AuditIntegrityBlockDeleteManyArgs} args - Arguments to filter AuditIntegrityBlocks to delete.
     * @example
     * // Delete a few AuditIntegrityBlocks
     * const { count } = await prisma.auditIntegrityBlock.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AuditIntegrityBlockDeleteManyArgs>(args?: SelectSubset<T, AuditIntegrityBlockDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AuditIntegrityBlocks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditIntegrityBlockUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many AuditIntegrityBlocks
     * const auditIntegrityBlock = await prisma.auditIntegrityBlock.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AuditIntegrityBlockUpdateManyArgs>(args: SelectSubset<T, AuditIntegrityBlockUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AuditIntegrityBlocks and returns the data updated in the database.
     * @param {AuditIntegrityBlockUpdateManyAndReturnArgs} args - Arguments to update many AuditIntegrityBlocks.
     * @example
     * // Update many AuditIntegrityBlocks
     * const auditIntegrityBlock = await prisma.auditIntegrityBlock.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more AuditIntegrityBlocks and only return the `id`
     * const auditIntegrityBlockWithIdOnly = await prisma.auditIntegrityBlock.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AuditIntegrityBlockUpdateManyAndReturnArgs>(args: SelectSubset<T, AuditIntegrityBlockUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AuditIntegrityBlockPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one AuditIntegrityBlock.
     * @param {AuditIntegrityBlockUpsertArgs} args - Arguments to update or create a AuditIntegrityBlock.
     * @example
     * // Update or create a AuditIntegrityBlock
     * const auditIntegrityBlock = await prisma.auditIntegrityBlock.upsert({
     *   create: {
     *     // ... data to create a AuditIntegrityBlock
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the AuditIntegrityBlock we want to update
     *   }
     * })
     */
    upsert<T extends AuditIntegrityBlockUpsertArgs>(args: SelectSubset<T, AuditIntegrityBlockUpsertArgs<ExtArgs>>): Prisma__AuditIntegrityBlockClient<$Result.GetResult<Prisma.$AuditIntegrityBlockPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of AuditIntegrityBlocks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditIntegrityBlockCountArgs} args - Arguments to filter AuditIntegrityBlocks to count.
     * @example
     * // Count the number of AuditIntegrityBlocks
     * const count = await prisma.auditIntegrityBlock.count({
     *   where: {
     *     // ... the filter for the AuditIntegrityBlocks we want to count
     *   }
     * })
    **/
    count<T extends AuditIntegrityBlockCountArgs>(
      args?: Subset<T, AuditIntegrityBlockCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AuditIntegrityBlockCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a AuditIntegrityBlock.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditIntegrityBlockAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AuditIntegrityBlockAggregateArgs>(args: Subset<T, AuditIntegrityBlockAggregateArgs>): Prisma.PrismaPromise<GetAuditIntegrityBlockAggregateType<T>>

    /**
     * Group by AuditIntegrityBlock.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditIntegrityBlockGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AuditIntegrityBlockGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AuditIntegrityBlockGroupByArgs['orderBy'] }
        : { orderBy?: AuditIntegrityBlockGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AuditIntegrityBlockGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAuditIntegrityBlockGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the AuditIntegrityBlock model
   */
  readonly fields: AuditIntegrityBlockFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for AuditIntegrityBlock.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AuditIntegrityBlockClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the AuditIntegrityBlock model
   */
  interface AuditIntegrityBlockFieldRefs {
    readonly id: FieldRef<"AuditIntegrityBlock", 'String'>
    readonly tenantId: FieldRef<"AuditIntegrityBlock", 'String'>
    readonly blockNumber: FieldRef<"AuditIntegrityBlock", 'Int'>
    readonly startRecordId: FieldRef<"AuditIntegrityBlock", 'String'>
    readonly endRecordId: FieldRef<"AuditIntegrityBlock", 'String'>
    readonly recordCount: FieldRef<"AuditIntegrityBlock", 'Int'>
    readonly cumulativeHash: FieldRef<"AuditIntegrityBlock", 'String'>
    readonly timestamp: FieldRef<"AuditIntegrityBlock", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * AuditIntegrityBlock findUnique
   */
  export type AuditIntegrityBlockFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditIntegrityBlock
     */
    select?: AuditIntegrityBlockSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditIntegrityBlock
     */
    omit?: AuditIntegrityBlockOmit<ExtArgs> | null
    /**
     * Filter, which AuditIntegrityBlock to fetch.
     */
    where: AuditIntegrityBlockWhereUniqueInput
  }

  /**
   * AuditIntegrityBlock findUniqueOrThrow
   */
  export type AuditIntegrityBlockFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditIntegrityBlock
     */
    select?: AuditIntegrityBlockSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditIntegrityBlock
     */
    omit?: AuditIntegrityBlockOmit<ExtArgs> | null
    /**
     * Filter, which AuditIntegrityBlock to fetch.
     */
    where: AuditIntegrityBlockWhereUniqueInput
  }

  /**
   * AuditIntegrityBlock findFirst
   */
  export type AuditIntegrityBlockFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditIntegrityBlock
     */
    select?: AuditIntegrityBlockSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditIntegrityBlock
     */
    omit?: AuditIntegrityBlockOmit<ExtArgs> | null
    /**
     * Filter, which AuditIntegrityBlock to fetch.
     */
    where?: AuditIntegrityBlockWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AuditIntegrityBlocks to fetch.
     */
    orderBy?: AuditIntegrityBlockOrderByWithRelationInput | AuditIntegrityBlockOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AuditIntegrityBlocks.
     */
    cursor?: AuditIntegrityBlockWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AuditIntegrityBlocks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AuditIntegrityBlocks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AuditIntegrityBlocks.
     */
    distinct?: AuditIntegrityBlockScalarFieldEnum | AuditIntegrityBlockScalarFieldEnum[]
  }

  /**
   * AuditIntegrityBlock findFirstOrThrow
   */
  export type AuditIntegrityBlockFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditIntegrityBlock
     */
    select?: AuditIntegrityBlockSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditIntegrityBlock
     */
    omit?: AuditIntegrityBlockOmit<ExtArgs> | null
    /**
     * Filter, which AuditIntegrityBlock to fetch.
     */
    where?: AuditIntegrityBlockWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AuditIntegrityBlocks to fetch.
     */
    orderBy?: AuditIntegrityBlockOrderByWithRelationInput | AuditIntegrityBlockOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AuditIntegrityBlocks.
     */
    cursor?: AuditIntegrityBlockWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AuditIntegrityBlocks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AuditIntegrityBlocks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AuditIntegrityBlocks.
     */
    distinct?: AuditIntegrityBlockScalarFieldEnum | AuditIntegrityBlockScalarFieldEnum[]
  }

  /**
   * AuditIntegrityBlock findMany
   */
  export type AuditIntegrityBlockFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditIntegrityBlock
     */
    select?: AuditIntegrityBlockSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditIntegrityBlock
     */
    omit?: AuditIntegrityBlockOmit<ExtArgs> | null
    /**
     * Filter, which AuditIntegrityBlocks to fetch.
     */
    where?: AuditIntegrityBlockWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AuditIntegrityBlocks to fetch.
     */
    orderBy?: AuditIntegrityBlockOrderByWithRelationInput | AuditIntegrityBlockOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing AuditIntegrityBlocks.
     */
    cursor?: AuditIntegrityBlockWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AuditIntegrityBlocks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AuditIntegrityBlocks.
     */
    skip?: number
    distinct?: AuditIntegrityBlockScalarFieldEnum | AuditIntegrityBlockScalarFieldEnum[]
  }

  /**
   * AuditIntegrityBlock create
   */
  export type AuditIntegrityBlockCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditIntegrityBlock
     */
    select?: AuditIntegrityBlockSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditIntegrityBlock
     */
    omit?: AuditIntegrityBlockOmit<ExtArgs> | null
    /**
     * The data needed to create a AuditIntegrityBlock.
     */
    data: XOR<AuditIntegrityBlockCreateInput, AuditIntegrityBlockUncheckedCreateInput>
  }

  /**
   * AuditIntegrityBlock createMany
   */
  export type AuditIntegrityBlockCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many AuditIntegrityBlocks.
     */
    data: AuditIntegrityBlockCreateManyInput | AuditIntegrityBlockCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * AuditIntegrityBlock createManyAndReturn
   */
  export type AuditIntegrityBlockCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditIntegrityBlock
     */
    select?: AuditIntegrityBlockSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AuditIntegrityBlock
     */
    omit?: AuditIntegrityBlockOmit<ExtArgs> | null
    /**
     * The data used to create many AuditIntegrityBlocks.
     */
    data: AuditIntegrityBlockCreateManyInput | AuditIntegrityBlockCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * AuditIntegrityBlock update
   */
  export type AuditIntegrityBlockUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditIntegrityBlock
     */
    select?: AuditIntegrityBlockSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditIntegrityBlock
     */
    omit?: AuditIntegrityBlockOmit<ExtArgs> | null
    /**
     * The data needed to update a AuditIntegrityBlock.
     */
    data: XOR<AuditIntegrityBlockUpdateInput, AuditIntegrityBlockUncheckedUpdateInput>
    /**
     * Choose, which AuditIntegrityBlock to update.
     */
    where: AuditIntegrityBlockWhereUniqueInput
  }

  /**
   * AuditIntegrityBlock updateMany
   */
  export type AuditIntegrityBlockUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update AuditIntegrityBlocks.
     */
    data: XOR<AuditIntegrityBlockUpdateManyMutationInput, AuditIntegrityBlockUncheckedUpdateManyInput>
    /**
     * Filter which AuditIntegrityBlocks to update
     */
    where?: AuditIntegrityBlockWhereInput
    /**
     * Limit how many AuditIntegrityBlocks to update.
     */
    limit?: number
  }

  /**
   * AuditIntegrityBlock updateManyAndReturn
   */
  export type AuditIntegrityBlockUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditIntegrityBlock
     */
    select?: AuditIntegrityBlockSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AuditIntegrityBlock
     */
    omit?: AuditIntegrityBlockOmit<ExtArgs> | null
    /**
     * The data used to update AuditIntegrityBlocks.
     */
    data: XOR<AuditIntegrityBlockUpdateManyMutationInput, AuditIntegrityBlockUncheckedUpdateManyInput>
    /**
     * Filter which AuditIntegrityBlocks to update
     */
    where?: AuditIntegrityBlockWhereInput
    /**
     * Limit how many AuditIntegrityBlocks to update.
     */
    limit?: number
  }

  /**
   * AuditIntegrityBlock upsert
   */
  export type AuditIntegrityBlockUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditIntegrityBlock
     */
    select?: AuditIntegrityBlockSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditIntegrityBlock
     */
    omit?: AuditIntegrityBlockOmit<ExtArgs> | null
    /**
     * The filter to search for the AuditIntegrityBlock to update in case it exists.
     */
    where: AuditIntegrityBlockWhereUniqueInput
    /**
     * In case the AuditIntegrityBlock found by the `where` argument doesn't exist, create a new AuditIntegrityBlock with this data.
     */
    create: XOR<AuditIntegrityBlockCreateInput, AuditIntegrityBlockUncheckedCreateInput>
    /**
     * In case the AuditIntegrityBlock was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AuditIntegrityBlockUpdateInput, AuditIntegrityBlockUncheckedUpdateInput>
  }

  /**
   * AuditIntegrityBlock delete
   */
  export type AuditIntegrityBlockDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditIntegrityBlock
     */
    select?: AuditIntegrityBlockSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditIntegrityBlock
     */
    omit?: AuditIntegrityBlockOmit<ExtArgs> | null
    /**
     * Filter which AuditIntegrityBlock to delete.
     */
    where: AuditIntegrityBlockWhereUniqueInput
  }

  /**
   * AuditIntegrityBlock deleteMany
   */
  export type AuditIntegrityBlockDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AuditIntegrityBlocks to delete
     */
    where?: AuditIntegrityBlockWhereInput
    /**
     * Limit how many AuditIntegrityBlocks to delete.
     */
    limit?: number
  }

  /**
   * AuditIntegrityBlock without action
   */
  export type AuditIntegrityBlockDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditIntegrityBlock
     */
    select?: AuditIntegrityBlockSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditIntegrityBlock
     */
    omit?: AuditIntegrityBlockOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const CqcAuditLogScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    userId: 'userId',
    userEmail: 'userEmail',
    userFullName: 'userFullName',
    userRoleName: 'userRoleName',
    categoryType: 'categoryType',
    actionType: 'actionType',
    entityType: 'entityType',
    entityId: 'entityId',
    entityLabel: 'entityLabel',
    oldValue: 'oldValue',
    newValue: 'newValue',
    metadata: 'metadata',
    ipAddress: 'ipAddress',
    userAgent: 'userAgent',
    latitude: 'latitude',
    longitude: 'longitude',
    locationName: 'locationName',
    recordHash: 'recordHash',
    previousHash: 'previousHash',
    timestamp: 'timestamp'
  };

  export type CqcAuditLogScalarFieldEnum = (typeof CqcAuditLogScalarFieldEnum)[keyof typeof CqcAuditLogScalarFieldEnum]


  export const AuditIntegrityBlockScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    blockNumber: 'blockNumber',
    startRecordId: 'startRecordId',
    endRecordId: 'endRecordId',
    recordCount: 'recordCount',
    cumulativeHash: 'cumulativeHash',
    timestamp: 'timestamp'
  };

  export type AuditIntegrityBlockScalarFieldEnum = (typeof AuditIntegrityBlockScalarFieldEnum)[keyof typeof AuditIntegrityBlockScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    
  /**
   * Deep Input Types
   */


  export type CqcAuditLogWhereInput = {
    AND?: CqcAuditLogWhereInput | CqcAuditLogWhereInput[]
    OR?: CqcAuditLogWhereInput[]
    NOT?: CqcAuditLogWhereInput | CqcAuditLogWhereInput[]
    id?: StringFilter<"CqcAuditLog"> | string
    tenantId?: StringNullableFilter<"CqcAuditLog"> | string | null
    userId?: StringNullableFilter<"CqcAuditLog"> | string | null
    userEmail?: StringNullableFilter<"CqcAuditLog"> | string | null
    userFullName?: StringNullableFilter<"CqcAuditLog"> | string | null
    userRoleName?: StringNullableFilter<"CqcAuditLog"> | string | null
    categoryType?: StringFilter<"CqcAuditLog"> | string
    actionType?: StringFilter<"CqcAuditLog"> | string
    entityType?: StringNullableFilter<"CqcAuditLog"> | string | null
    entityId?: StringNullableFilter<"CqcAuditLog"> | string | null
    entityLabel?: StringNullableFilter<"CqcAuditLog"> | string | null
    oldValue?: JsonNullableFilter<"CqcAuditLog">
    newValue?: JsonNullableFilter<"CqcAuditLog">
    metadata?: JsonNullableFilter<"CqcAuditLog">
    ipAddress?: StringNullableFilter<"CqcAuditLog"> | string | null
    userAgent?: StringNullableFilter<"CqcAuditLog"> | string | null
    latitude?: FloatNullableFilter<"CqcAuditLog"> | number | null
    longitude?: FloatNullableFilter<"CqcAuditLog"> | number | null
    locationName?: StringNullableFilter<"CqcAuditLog"> | string | null
    recordHash?: StringFilter<"CqcAuditLog"> | string
    previousHash?: StringNullableFilter<"CqcAuditLog"> | string | null
    timestamp?: DateTimeFilter<"CqcAuditLog"> | Date | string
  }

  export type CqcAuditLogOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrderInput | SortOrder
    userId?: SortOrderInput | SortOrder
    userEmail?: SortOrderInput | SortOrder
    userFullName?: SortOrderInput | SortOrder
    userRoleName?: SortOrderInput | SortOrder
    categoryType?: SortOrder
    actionType?: SortOrder
    entityType?: SortOrderInput | SortOrder
    entityId?: SortOrderInput | SortOrder
    entityLabel?: SortOrderInput | SortOrder
    oldValue?: SortOrderInput | SortOrder
    newValue?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    ipAddress?: SortOrderInput | SortOrder
    userAgent?: SortOrderInput | SortOrder
    latitude?: SortOrderInput | SortOrder
    longitude?: SortOrderInput | SortOrder
    locationName?: SortOrderInput | SortOrder
    recordHash?: SortOrder
    previousHash?: SortOrderInput | SortOrder
    timestamp?: SortOrder
  }

  export type CqcAuditLogWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: CqcAuditLogWhereInput | CqcAuditLogWhereInput[]
    OR?: CqcAuditLogWhereInput[]
    NOT?: CqcAuditLogWhereInput | CqcAuditLogWhereInput[]
    tenantId?: StringNullableFilter<"CqcAuditLog"> | string | null
    userId?: StringNullableFilter<"CqcAuditLog"> | string | null
    userEmail?: StringNullableFilter<"CqcAuditLog"> | string | null
    userFullName?: StringNullableFilter<"CqcAuditLog"> | string | null
    userRoleName?: StringNullableFilter<"CqcAuditLog"> | string | null
    categoryType?: StringFilter<"CqcAuditLog"> | string
    actionType?: StringFilter<"CqcAuditLog"> | string
    entityType?: StringNullableFilter<"CqcAuditLog"> | string | null
    entityId?: StringNullableFilter<"CqcAuditLog"> | string | null
    entityLabel?: StringNullableFilter<"CqcAuditLog"> | string | null
    oldValue?: JsonNullableFilter<"CqcAuditLog">
    newValue?: JsonNullableFilter<"CqcAuditLog">
    metadata?: JsonNullableFilter<"CqcAuditLog">
    ipAddress?: StringNullableFilter<"CqcAuditLog"> | string | null
    userAgent?: StringNullableFilter<"CqcAuditLog"> | string | null
    latitude?: FloatNullableFilter<"CqcAuditLog"> | number | null
    longitude?: FloatNullableFilter<"CqcAuditLog"> | number | null
    locationName?: StringNullableFilter<"CqcAuditLog"> | string | null
    recordHash?: StringFilter<"CqcAuditLog"> | string
    previousHash?: StringNullableFilter<"CqcAuditLog"> | string | null
    timestamp?: DateTimeFilter<"CqcAuditLog"> | Date | string
  }, "id">

  export type CqcAuditLogOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrderInput | SortOrder
    userId?: SortOrderInput | SortOrder
    userEmail?: SortOrderInput | SortOrder
    userFullName?: SortOrderInput | SortOrder
    userRoleName?: SortOrderInput | SortOrder
    categoryType?: SortOrder
    actionType?: SortOrder
    entityType?: SortOrderInput | SortOrder
    entityId?: SortOrderInput | SortOrder
    entityLabel?: SortOrderInput | SortOrder
    oldValue?: SortOrderInput | SortOrder
    newValue?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    ipAddress?: SortOrderInput | SortOrder
    userAgent?: SortOrderInput | SortOrder
    latitude?: SortOrderInput | SortOrder
    longitude?: SortOrderInput | SortOrder
    locationName?: SortOrderInput | SortOrder
    recordHash?: SortOrder
    previousHash?: SortOrderInput | SortOrder
    timestamp?: SortOrder
    _count?: CqcAuditLogCountOrderByAggregateInput
    _avg?: CqcAuditLogAvgOrderByAggregateInput
    _max?: CqcAuditLogMaxOrderByAggregateInput
    _min?: CqcAuditLogMinOrderByAggregateInput
    _sum?: CqcAuditLogSumOrderByAggregateInput
  }

  export type CqcAuditLogScalarWhereWithAggregatesInput = {
    AND?: CqcAuditLogScalarWhereWithAggregatesInput | CqcAuditLogScalarWhereWithAggregatesInput[]
    OR?: CqcAuditLogScalarWhereWithAggregatesInput[]
    NOT?: CqcAuditLogScalarWhereWithAggregatesInput | CqcAuditLogScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"CqcAuditLog"> | string
    tenantId?: StringNullableWithAggregatesFilter<"CqcAuditLog"> | string | null
    userId?: StringNullableWithAggregatesFilter<"CqcAuditLog"> | string | null
    userEmail?: StringNullableWithAggregatesFilter<"CqcAuditLog"> | string | null
    userFullName?: StringNullableWithAggregatesFilter<"CqcAuditLog"> | string | null
    userRoleName?: StringNullableWithAggregatesFilter<"CqcAuditLog"> | string | null
    categoryType?: StringWithAggregatesFilter<"CqcAuditLog"> | string
    actionType?: StringWithAggregatesFilter<"CqcAuditLog"> | string
    entityType?: StringNullableWithAggregatesFilter<"CqcAuditLog"> | string | null
    entityId?: StringNullableWithAggregatesFilter<"CqcAuditLog"> | string | null
    entityLabel?: StringNullableWithAggregatesFilter<"CqcAuditLog"> | string | null
    oldValue?: JsonNullableWithAggregatesFilter<"CqcAuditLog">
    newValue?: JsonNullableWithAggregatesFilter<"CqcAuditLog">
    metadata?: JsonNullableWithAggregatesFilter<"CqcAuditLog">
    ipAddress?: StringNullableWithAggregatesFilter<"CqcAuditLog"> | string | null
    userAgent?: StringNullableWithAggregatesFilter<"CqcAuditLog"> | string | null
    latitude?: FloatNullableWithAggregatesFilter<"CqcAuditLog"> | number | null
    longitude?: FloatNullableWithAggregatesFilter<"CqcAuditLog"> | number | null
    locationName?: StringNullableWithAggregatesFilter<"CqcAuditLog"> | string | null
    recordHash?: StringWithAggregatesFilter<"CqcAuditLog"> | string
    previousHash?: StringNullableWithAggregatesFilter<"CqcAuditLog"> | string | null
    timestamp?: DateTimeWithAggregatesFilter<"CqcAuditLog"> | Date | string
  }

  export type AuditIntegrityBlockWhereInput = {
    AND?: AuditIntegrityBlockWhereInput | AuditIntegrityBlockWhereInput[]
    OR?: AuditIntegrityBlockWhereInput[]
    NOT?: AuditIntegrityBlockWhereInput | AuditIntegrityBlockWhereInput[]
    id?: StringFilter<"AuditIntegrityBlock"> | string
    tenantId?: StringNullableFilter<"AuditIntegrityBlock"> | string | null
    blockNumber?: IntFilter<"AuditIntegrityBlock"> | number
    startRecordId?: StringFilter<"AuditIntegrityBlock"> | string
    endRecordId?: StringFilter<"AuditIntegrityBlock"> | string
    recordCount?: IntFilter<"AuditIntegrityBlock"> | number
    cumulativeHash?: StringFilter<"AuditIntegrityBlock"> | string
    timestamp?: DateTimeFilter<"AuditIntegrityBlock"> | Date | string
  }

  export type AuditIntegrityBlockOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrderInput | SortOrder
    blockNumber?: SortOrder
    startRecordId?: SortOrder
    endRecordId?: SortOrder
    recordCount?: SortOrder
    cumulativeHash?: SortOrder
    timestamp?: SortOrder
  }

  export type AuditIntegrityBlockWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: AuditIntegrityBlockWhereInput | AuditIntegrityBlockWhereInput[]
    OR?: AuditIntegrityBlockWhereInput[]
    NOT?: AuditIntegrityBlockWhereInput | AuditIntegrityBlockWhereInput[]
    tenantId?: StringNullableFilter<"AuditIntegrityBlock"> | string | null
    blockNumber?: IntFilter<"AuditIntegrityBlock"> | number
    startRecordId?: StringFilter<"AuditIntegrityBlock"> | string
    endRecordId?: StringFilter<"AuditIntegrityBlock"> | string
    recordCount?: IntFilter<"AuditIntegrityBlock"> | number
    cumulativeHash?: StringFilter<"AuditIntegrityBlock"> | string
    timestamp?: DateTimeFilter<"AuditIntegrityBlock"> | Date | string
  }, "id">

  export type AuditIntegrityBlockOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrderInput | SortOrder
    blockNumber?: SortOrder
    startRecordId?: SortOrder
    endRecordId?: SortOrder
    recordCount?: SortOrder
    cumulativeHash?: SortOrder
    timestamp?: SortOrder
    _count?: AuditIntegrityBlockCountOrderByAggregateInput
    _avg?: AuditIntegrityBlockAvgOrderByAggregateInput
    _max?: AuditIntegrityBlockMaxOrderByAggregateInput
    _min?: AuditIntegrityBlockMinOrderByAggregateInput
    _sum?: AuditIntegrityBlockSumOrderByAggregateInput
  }

  export type AuditIntegrityBlockScalarWhereWithAggregatesInput = {
    AND?: AuditIntegrityBlockScalarWhereWithAggregatesInput | AuditIntegrityBlockScalarWhereWithAggregatesInput[]
    OR?: AuditIntegrityBlockScalarWhereWithAggregatesInput[]
    NOT?: AuditIntegrityBlockScalarWhereWithAggregatesInput | AuditIntegrityBlockScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"AuditIntegrityBlock"> | string
    tenantId?: StringNullableWithAggregatesFilter<"AuditIntegrityBlock"> | string | null
    blockNumber?: IntWithAggregatesFilter<"AuditIntegrityBlock"> | number
    startRecordId?: StringWithAggregatesFilter<"AuditIntegrityBlock"> | string
    endRecordId?: StringWithAggregatesFilter<"AuditIntegrityBlock"> | string
    recordCount?: IntWithAggregatesFilter<"AuditIntegrityBlock"> | number
    cumulativeHash?: StringWithAggregatesFilter<"AuditIntegrityBlock"> | string
    timestamp?: DateTimeWithAggregatesFilter<"AuditIntegrityBlock"> | Date | string
  }

  export type CqcAuditLogCreateInput = {
    id?: string
    tenantId?: string | null
    userId?: string | null
    userEmail?: string | null
    userFullName?: string | null
    userRoleName?: string | null
    categoryType: string
    actionType: string
    entityType?: string | null
    entityId?: string | null
    entityLabel?: string | null
    oldValue?: NullableJsonNullValueInput | InputJsonValue
    newValue?: NullableJsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
    ipAddress?: string | null
    userAgent?: string | null
    latitude?: number | null
    longitude?: number | null
    locationName?: string | null
    recordHash: string
    previousHash?: string | null
    timestamp?: Date | string
  }

  export type CqcAuditLogUncheckedCreateInput = {
    id?: string
    tenantId?: string | null
    userId?: string | null
    userEmail?: string | null
    userFullName?: string | null
    userRoleName?: string | null
    categoryType: string
    actionType: string
    entityType?: string | null
    entityId?: string | null
    entityLabel?: string | null
    oldValue?: NullableJsonNullValueInput | InputJsonValue
    newValue?: NullableJsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
    ipAddress?: string | null
    userAgent?: string | null
    latitude?: number | null
    longitude?: number | null
    locationName?: string | null
    recordHash: string
    previousHash?: string | null
    timestamp?: Date | string
  }

  export type CqcAuditLogUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    userEmail?: NullableStringFieldUpdateOperationsInput | string | null
    userFullName?: NullableStringFieldUpdateOperationsInput | string | null
    userRoleName?: NullableStringFieldUpdateOperationsInput | string | null
    categoryType?: StringFieldUpdateOperationsInput | string
    actionType?: StringFieldUpdateOperationsInput | string
    entityType?: NullableStringFieldUpdateOperationsInput | string | null
    entityId?: NullableStringFieldUpdateOperationsInput | string | null
    entityLabel?: NullableStringFieldUpdateOperationsInput | string | null
    oldValue?: NullableJsonNullValueInput | InputJsonValue
    newValue?: NullableJsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    locationName?: NullableStringFieldUpdateOperationsInput | string | null
    recordHash?: StringFieldUpdateOperationsInput | string
    previousHash?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CqcAuditLogUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    userEmail?: NullableStringFieldUpdateOperationsInput | string | null
    userFullName?: NullableStringFieldUpdateOperationsInput | string | null
    userRoleName?: NullableStringFieldUpdateOperationsInput | string | null
    categoryType?: StringFieldUpdateOperationsInput | string
    actionType?: StringFieldUpdateOperationsInput | string
    entityType?: NullableStringFieldUpdateOperationsInput | string | null
    entityId?: NullableStringFieldUpdateOperationsInput | string | null
    entityLabel?: NullableStringFieldUpdateOperationsInput | string | null
    oldValue?: NullableJsonNullValueInput | InputJsonValue
    newValue?: NullableJsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    locationName?: NullableStringFieldUpdateOperationsInput | string | null
    recordHash?: StringFieldUpdateOperationsInput | string
    previousHash?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CqcAuditLogCreateManyInput = {
    id?: string
    tenantId?: string | null
    userId?: string | null
    userEmail?: string | null
    userFullName?: string | null
    userRoleName?: string | null
    categoryType: string
    actionType: string
    entityType?: string | null
    entityId?: string | null
    entityLabel?: string | null
    oldValue?: NullableJsonNullValueInput | InputJsonValue
    newValue?: NullableJsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
    ipAddress?: string | null
    userAgent?: string | null
    latitude?: number | null
    longitude?: number | null
    locationName?: string | null
    recordHash: string
    previousHash?: string | null
    timestamp?: Date | string
  }

  export type CqcAuditLogUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    userEmail?: NullableStringFieldUpdateOperationsInput | string | null
    userFullName?: NullableStringFieldUpdateOperationsInput | string | null
    userRoleName?: NullableStringFieldUpdateOperationsInput | string | null
    categoryType?: StringFieldUpdateOperationsInput | string
    actionType?: StringFieldUpdateOperationsInput | string
    entityType?: NullableStringFieldUpdateOperationsInput | string | null
    entityId?: NullableStringFieldUpdateOperationsInput | string | null
    entityLabel?: NullableStringFieldUpdateOperationsInput | string | null
    oldValue?: NullableJsonNullValueInput | InputJsonValue
    newValue?: NullableJsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    locationName?: NullableStringFieldUpdateOperationsInput | string | null
    recordHash?: StringFieldUpdateOperationsInput | string
    previousHash?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CqcAuditLogUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    userEmail?: NullableStringFieldUpdateOperationsInput | string | null
    userFullName?: NullableStringFieldUpdateOperationsInput | string | null
    userRoleName?: NullableStringFieldUpdateOperationsInput | string | null
    categoryType?: StringFieldUpdateOperationsInput | string
    actionType?: StringFieldUpdateOperationsInput | string
    entityType?: NullableStringFieldUpdateOperationsInput | string | null
    entityId?: NullableStringFieldUpdateOperationsInput | string | null
    entityLabel?: NullableStringFieldUpdateOperationsInput | string | null
    oldValue?: NullableJsonNullValueInput | InputJsonValue
    newValue?: NullableJsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    locationName?: NullableStringFieldUpdateOperationsInput | string | null
    recordHash?: StringFieldUpdateOperationsInput | string
    previousHash?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AuditIntegrityBlockCreateInput = {
    id?: string
    tenantId?: string | null
    blockNumber: number
    startRecordId: string
    endRecordId: string
    recordCount: number
    cumulativeHash: string
    timestamp?: Date | string
  }

  export type AuditIntegrityBlockUncheckedCreateInput = {
    id?: string
    tenantId?: string | null
    blockNumber: number
    startRecordId: string
    endRecordId: string
    recordCount: number
    cumulativeHash: string
    timestamp?: Date | string
  }

  export type AuditIntegrityBlockUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: NullableStringFieldUpdateOperationsInput | string | null
    blockNumber?: IntFieldUpdateOperationsInput | number
    startRecordId?: StringFieldUpdateOperationsInput | string
    endRecordId?: StringFieldUpdateOperationsInput | string
    recordCount?: IntFieldUpdateOperationsInput | number
    cumulativeHash?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AuditIntegrityBlockUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: NullableStringFieldUpdateOperationsInput | string | null
    blockNumber?: IntFieldUpdateOperationsInput | number
    startRecordId?: StringFieldUpdateOperationsInput | string
    endRecordId?: StringFieldUpdateOperationsInput | string
    recordCount?: IntFieldUpdateOperationsInput | number
    cumulativeHash?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AuditIntegrityBlockCreateManyInput = {
    id?: string
    tenantId?: string | null
    blockNumber: number
    startRecordId: string
    endRecordId: string
    recordCount: number
    cumulativeHash: string
    timestamp?: Date | string
  }

  export type AuditIntegrityBlockUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: NullableStringFieldUpdateOperationsInput | string | null
    blockNumber?: IntFieldUpdateOperationsInput | number
    startRecordId?: StringFieldUpdateOperationsInput | string
    endRecordId?: StringFieldUpdateOperationsInput | string
    recordCount?: IntFieldUpdateOperationsInput | number
    cumulativeHash?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AuditIntegrityBlockUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: NullableStringFieldUpdateOperationsInput | string | null
    blockNumber?: IntFieldUpdateOperationsInput | number
    startRecordId?: StringFieldUpdateOperationsInput | string
    endRecordId?: StringFieldUpdateOperationsInput | string
    recordCount?: IntFieldUpdateOperationsInput | number
    cumulativeHash?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }
  export type JsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type FloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type CqcAuditLogCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    userId?: SortOrder
    userEmail?: SortOrder
    userFullName?: SortOrder
    userRoleName?: SortOrder
    categoryType?: SortOrder
    actionType?: SortOrder
    entityType?: SortOrder
    entityId?: SortOrder
    entityLabel?: SortOrder
    oldValue?: SortOrder
    newValue?: SortOrder
    metadata?: SortOrder
    ipAddress?: SortOrder
    userAgent?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    locationName?: SortOrder
    recordHash?: SortOrder
    previousHash?: SortOrder
    timestamp?: SortOrder
  }

  export type CqcAuditLogAvgOrderByAggregateInput = {
    latitude?: SortOrder
    longitude?: SortOrder
  }

  export type CqcAuditLogMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    userId?: SortOrder
    userEmail?: SortOrder
    userFullName?: SortOrder
    userRoleName?: SortOrder
    categoryType?: SortOrder
    actionType?: SortOrder
    entityType?: SortOrder
    entityId?: SortOrder
    entityLabel?: SortOrder
    ipAddress?: SortOrder
    userAgent?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    locationName?: SortOrder
    recordHash?: SortOrder
    previousHash?: SortOrder
    timestamp?: SortOrder
  }

  export type CqcAuditLogMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    userId?: SortOrder
    userEmail?: SortOrder
    userFullName?: SortOrder
    userRoleName?: SortOrder
    categoryType?: SortOrder
    actionType?: SortOrder
    entityType?: SortOrder
    entityId?: SortOrder
    entityLabel?: SortOrder
    ipAddress?: SortOrder
    userAgent?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    locationName?: SortOrder
    recordHash?: SortOrder
    previousHash?: SortOrder
    timestamp?: SortOrder
  }

  export type CqcAuditLogSumOrderByAggregateInput = {
    latitude?: SortOrder
    longitude?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type FloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type AuditIntegrityBlockCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    blockNumber?: SortOrder
    startRecordId?: SortOrder
    endRecordId?: SortOrder
    recordCount?: SortOrder
    cumulativeHash?: SortOrder
    timestamp?: SortOrder
  }

  export type AuditIntegrityBlockAvgOrderByAggregateInput = {
    blockNumber?: SortOrder
    recordCount?: SortOrder
  }

  export type AuditIntegrityBlockMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    blockNumber?: SortOrder
    startRecordId?: SortOrder
    endRecordId?: SortOrder
    recordCount?: SortOrder
    cumulativeHash?: SortOrder
    timestamp?: SortOrder
  }

  export type AuditIntegrityBlockMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    blockNumber?: SortOrder
    startRecordId?: SortOrder
    endRecordId?: SortOrder
    recordCount?: SortOrder
    cumulativeHash?: SortOrder
    timestamp?: SortOrder
  }

  export type AuditIntegrityBlockSumOrderByAggregateInput = {
    blockNumber?: SortOrder
    recordCount?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type NullableFloatFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedFloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}