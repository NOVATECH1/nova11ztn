declare module 'next/server' {
  export class NextResponse<T = unknown> extends Response {
    static json<T>(body: T, init?: ResponseInit): NextResponse<T>;
    static redirect(url: string | URL, init?: number | ResponseInit): NextResponse;
    cookies: { set(name: string, value: string, options?: Record<string, unknown>): void; get(name: string): { value: string } | undefined; delete(name: string): void };
  }
  export function after(callback: () => void | Promise<void>): void;
}

declare module 'next/headers' {
  export function cookies(): Promise<{ get(name: string): { value: string } | undefined; set(name: string, value: string, options?: Record<string, unknown>): void; delete(name: string): void }>;
  export function headers(): Promise<Headers>;
}

declare module 'next/navigation' {
  export function redirect(url: string): never;
  export function notFound(): never;
  export function useRouter(): { push(url: string): void; replace(url: string): void; back(): void };
  export function useSearchParams(): URLSearchParams;
  export function usePathname(): string;
}

declare module 'next/link' {
  import type { ReactNode } from 'react';
  const Link: (props: { href: string; children?: ReactNode; className?: string; onClick?: () => void; title?: string; key?: string }) => JSX.Element;
  export default Link;
}

declare module 'next/image' {
  import type { ImgHTMLAttributes } from 'react';
  const Image: (props: ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean }) => JSX.Element;
  export default Image;
}

declare module '@prisma/client' {
  export class PrismaClient {
    [key: string]: any;
    constructor(...args: any[]);
    $disconnect(): Promise<void>;
    $transaction<T>(fn: (tx: any) => Promise<T>): Promise<T>;
  }
  export const Prisma: any;
  export type User = any;
}

declare module 'zod' {
  export const z: any;
}

declare namespace JSX {
  interface Element extends React.ReactElement<any, any> {}
  interface IntrinsicElements { [elemName: string]: any }
}


declare const process: { env: Record<string, string | undefined> };
declare const global: any;
declare const Buffer: any;
declare function require(id: string): any;

declare module 'react' {
  export type ReactNode = any;
  export type ReactElement<T = any, P = any> = any;
  export type ChangeEvent<T = any> = { target: T };
  export function useState<T>(initial: T): [T, (value: T | ((current: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
}

declare module 'next' {
  export interface NextConfig { [key: string]: any }
}

declare module 'node:crypto' {
  const crypto: any;
  export = crypto;
  export const createHash: any;
  export const createHmac: any;
  export const randomBytes: any;
  export const timingSafeEqual: any;
}
