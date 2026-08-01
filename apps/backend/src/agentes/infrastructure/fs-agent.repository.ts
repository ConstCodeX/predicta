import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { IAgentRepository } from '../domain/ports/agent-repository.port';
import {
  AgentDefinition,
  AgentMeta,
  AgentNotFoundException,
} from '../domain/agent.types';

/**
 * Carga agentes desde archivos Markdown en disco.
 * Directorio configurable con AGENTS_DIR (por defecto <cwd>/agents).
 */
@Injectable()
export class FsAgentRepository implements IAgentRepository {
  private readonly logger = new Logger(FsAgentRepository.name);
  private readonly baseDir: string;

  constructor(private readonly config: ConfigService) {
    const configured = this.config.get<string>('AGENTS_DIR');
    this.baseDir = configured
      ? path.resolve(configured)
      : path.resolve(process.cwd(), 'agents');
    this.logger.log(`Directorio de agentes: ${this.baseDir}`);
  }

  async load(agentId: string): Promise<AgentDefinition> {
    const safeId = this.sanitize(agentId);
    const filePath = path.join(this.baseDir, `${safeId}.md`);

    if (!fs.existsSync(filePath)) {
      throw new AgentNotFoundException(safeId);
    }

    const raw = await fs.promises.readFile(filePath, 'utf-8');
    const { meta, body } = this.parseFrontmatter(raw);

    return { id: safeId, instructions: body.trim(), meta };
  }

  async list(): Promise<string[]> {
    if (!fs.existsSync(this.baseDir)) return [];
    const files = await fs.promises.readdir(this.baseDir);
    return files
      .filter((f) => f.endsWith('.md') && !f.startsWith('_') && f !== 'README.md')
      .map((f) => f.replace(/\.md$/, ''));
  }

  /** Evita path traversal: solo nombre de archivo simple. */
  private sanitize(id: string): string {
    return id.replace(/[^a-zA-Z0-9_-]/g, '');
  }

  /** Parser mínimo de frontmatter YAML `--- ... ---` sin dependencias. */
  private parseFrontmatter(raw: string): { meta: AgentMeta; body: string } {
    const match = /^---\s*\n([\s\S]*?)\n---\s*\n?/.exec(raw);
    if (!match) return { meta: {}, body: raw };

    const meta: AgentMeta = {};
    for (const line of match[1].split('\n')) {
      const kv = /^\s*([a-zA-Z_]+)\s*:\s*(.+?)\s*$/.exec(line);
      if (!kv) continue;
      const key = kv[1];
      const value = kv[2].replace(/^["']|["']$/g, '');
      switch (key) {
        case 'model':
          meta.model = value;
          break;
        case 'temperature':
          meta.temperature = Number(value);
          break;
        case 'max_tokens':
          meta.max_tokens = Number(value);
          break;
        case 'json_mode':
          meta.json_mode = value === 'true';
          break;
      }
    }

    return { meta, body: raw.slice(match[0].length) };
  }
}
