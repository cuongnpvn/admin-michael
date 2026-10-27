import { GEMINI_MAX_CONCURRENT } from "@/lib/admin/gemini/constants";
import { geminiLog } from "@/lib/admin/gemini/gemini-log";

type ReleaseFn = () => void;

class ConcurrencyLimiter {
  private active = 0;
  private readonly queue: Array<() => void> = [];

  constructor(private readonly max: number) {}

  async acquire(label: string): Promise<ReleaseFn> {
    if (this.active < this.max) {
      this.active++;
      geminiLog("concurrency_acquired", {
        label,
        active: this.active,
        max: this.max,
        queued: this.queue.length,
      });
      return () => this.release(label);
    }

    geminiLog("concurrency_queued", {
      label,
      active: this.active,
      max: this.max,
      queued: this.queue.length + 1,
    });

    await new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
    this.active++;
    geminiLog("concurrency_acquired", {
      label,
      active: this.active,
      max: this.max,
      queued: this.queue.length,
      waited: true,
    });
    return () => this.release(label);
  }

  private release(label: string) {
    this.active--;
    geminiLog("concurrency_released", {
      label,
      active: this.active,
      max: this.max,
      queued: this.queue.length,
    });
    const next = this.queue.shift();
    if (next) next();
  }

  async run<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const release = await this.acquire(label);
    try {
      return await fn();
    } finally {
      release();
    }
  }
}

const geminiLimiter = new ConcurrencyLimiter(GEMINI_MAX_CONCURRENT);

export async function withGeminiConcurrency<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T> {
  return geminiLimiter.run(label, fn);
}

export async function* withGeminiConcurrencyStream<T>(
  label: string,
  start: () => AsyncIterable<T> | Promise<AsyncIterable<T>>,
): AsyncGenerator<T> {
  const release = await geminiLimiter.acquire(label);
  try {
    yield* await start();
  } finally {
    release();
  }
}
