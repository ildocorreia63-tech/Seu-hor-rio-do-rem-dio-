/**
 * Cache Local Inteligente para Respostas da IA
 * Reduz latência para 0ms em consultas frequentes e economiza consumo de tokens da API Gemini.
 */

export interface AiCacheEntry {
  key: string;
  prompt: string;
  answer: string;
  timestamp: number;
  hits: number;
  hasImage: boolean;
}

export interface AiCacheStats {
  totalEntries: number;
  totalHits: number;
  estimatedTokensSaved: number;
}

const CACHE_STORAGE_KEY = 'shdr_ai_response_cache_v1';
const CACHE_STATS_KEY = 'shdr_ai_cache_stats_v1';
const MAX_CACHE_ENTRIES = 120; // Máximo de itens para não sobrecarregar o localStorage
const CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 dias de validade

class AiCacheService {
  private memoryCache = new Map<string, AiCacheEntry>();
  private initialized = false;

  constructor() {
    this.initFromStorage();
  }

  private normalizeText(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove acentos
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ') // normaliza espaços múltiplos
      .replace(/[?!.,;:]+$/g, ''); // remove pontuação final repetida
  }

  /**
   * Gera uma chave determinística baseada na pergunta e no hash da imagem (se houver)
   */
  private generateKey(prompt: string, imageBase64?: string): string {
    const cleanPrompt = this.normalizeText(prompt);
    
    if (!imageBase64) {
      return `text_${cleanPrompt}`;
    }

    // Gerar hash simples e rápido para a imagem base64
    let imgHash = 0;
    const sampleLen = Math.min(imageBase64.length, 1000);
    for (let i = 0; i < sampleLen; i++) {
      const char = imageBase64.charCodeAt(i);
      imgHash = (imgHash << 5) - imgHash + char;
      imgHash |= 0;
    }

    return `img_${imageBase64.length}_${imgHash}_${cleanPrompt}`;
  }

  private initFromStorage() {
    if (typeof window === 'undefined' || this.initialized) return;

    try {
      const stored = localStorage.getItem(CACHE_STORAGE_KEY);
      if (stored) {
        const entries: AiCacheEntry[] = JSON.parse(stored);
        const now = Date.now();

        // Filtra entradas expiradas
        entries.forEach((entry) => {
          if (now - entry.timestamp < CACHE_TTL_MS) {
            this.memoryCache.set(entry.key, entry);
          }
        });
      }
    } catch (e) {
      console.warn('Erro ao inicializar cache da IA:', e);
    }
    this.initialized = true;
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;

    try {
      const entries = Array.from(this.memoryCache.values());
      // Mantém apenas os mais recentes se exceder o limite
      if (entries.length > MAX_CACHE_ENTRIES) {
        entries.sort((a, b) => b.timestamp - a.timestamp);
        const trimmed = entries.slice(0, MAX_CACHE_ENTRIES);
        this.memoryCache.clear();
        trimmed.forEach((e) => this.memoryCache.set(e.key, e));
        localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(trimmed));
        return;
      }
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
      console.warn('Erro ao persistir cache local da IA:', e);
    }
  }

  /**
   * Busca resposta em cache para a pergunta / imagem
   */
  get(prompt: string, imageBase64?: string): { answer: string; hits: number; timestamp: number } | null {
    this.initFromStorage();
    if (!prompt.trim() && !imageBase64) return null;

    const key = this.generateKey(prompt, imageBase64);
    const entry = this.memoryCache.get(key);

    if (!entry) return null;

    // Verificar expiração
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      this.memoryCache.delete(key);
      this.saveToStorage();
      return null;
    }

    // Incrementa contagem de acertos (cache hit)
    entry.hits += 1;
    this.recordHit(entry.answer.length);
    this.saveToStorage();

    return {
      answer: entry.answer,
      hits: entry.hits,
      timestamp: entry.timestamp,
    };
  }

  /**
   * Armazena nova resposta no cache
   */
  set(prompt: string, answer: string, imageBase64?: string): void {
    this.initFromStorage();
    if (!answer || answer.startsWith('Erro ao') || answer.includes('não foi possível')) {
      return; // Não salva mensagens transitórias de erro no cache
    }

    const key = this.generateKey(prompt, imageBase64);
    const entry: AiCacheEntry = {
      key,
      prompt: prompt.trim(),
      answer,
      timestamp: Date.now(),
      hits: 1,
      hasImage: !!imageBase64,
    };

    this.memoryCache.set(key, entry);
    this.saveToStorage();
  }

  private recordHit(answerLength: number) {
    try {
      const stats = this.getStats();
      stats.totalHits += 1;
      // Estimativa: ~4 caracteres por token + ~150 tokens de prompt/instruções
      const savedTokens = Math.round(answerLength / 3.8) + 180;
      stats.estimatedTokensSaved += savedTokens;
      localStorage.setItem(CACHE_STATS_KEY, JSON.stringify(stats));
    } catch {}
  }

  /**
   * Obtém estatísticas de desempenho e economia de tokens do cache
   */
  getStats(): AiCacheStats {
    this.initFromStorage();
    let stats: AiCacheStats = {
      totalEntries: this.memoryCache.size,
      totalHits: 0,
      estimatedTokensSaved: 0,
    };

    try {
      const saved = localStorage.getItem(CACHE_STATS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        stats.totalHits = parsed.totalHits || 0;
        stats.estimatedTokensSaved = parsed.estimatedTokensSaved || 0;
      }
    } catch {}

    stats.totalEntries = this.memoryCache.size;
    return stats;
  }

  /**
   * Limpa todo o cache local
   */
  clear(): void {
    this.memoryCache.clear();
    try {
      localStorage.removeItem(CACHE_STORAGE_KEY);
      localStorage.removeItem(CACHE_STATS_KEY);
    } catch {}
  }
}

export const aiCache = new AiCacheService();
