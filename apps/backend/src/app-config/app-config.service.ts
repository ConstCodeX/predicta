import { Injectable } from '@nestjs/common';

export interface ConfigEntry {
  key: string;
  value: string;
  description: string | null;
}

@Injectable()
export class AppConfigService {
  private store: Map<string, ConfigEntry> = new Map();

  async get(key: string, defaultValue: string): Promise<string> {
    return this.store.get(key)?.value ?? defaultValue;
  }

  async set(key: string, value: string, description?: string): Promise<void> {
    this.store.set(key, {
      key,
      value,
      description: description ?? this.store.get(key)?.description ?? null,
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async listAll(): Promise<ConfigEntry[]> {
    return [...this.store.values()].sort((a, b) => a.key.localeCompare(b.key));
  }
}
