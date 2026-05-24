/// <reference types="astro/client" />

declare module "astro:content" {
  export function getEntry(collection: string, id: string): Promise<any>;
  export function getCollection(collection: string): Promise<any[]>;
  export function defineCollection(config: any): any;
}
