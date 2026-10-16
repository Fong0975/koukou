import nodeFs from "node:fs";
import path from "node:path";
import { formatTimestamp } from "./format";

/** Destination for rendered log lines. */
export interface LogSink {
  write(line: string): void;
}

/** The file system calls the sink uses, injectable for testing. */
export type SinkFs = Pick<
  typeof nodeFs,
  "appendFileSync" | "existsSync" | "mkdirSync" | "readdirSync" | "renameSync" | "statSync" | "unlinkSync"
>;

export interface RotatingFileSinkOptions {
  /** Absolute path of the active log file. */
  filePath: string;
  /** Size at which the active file is rotated. */
  maxBytes: number;
  /** Most log files kept, including the active one. */
  maxFiles: number;
  /** Called once when writing fails; the sink stops writing afterwards. */
  onError: (error: unknown) => void;
  fs?: SinkFs;
  now?: () => Date;
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Turns a date into the compact local stamp used in archive names, e.g. `20260829T125438`. */
function archiveStamp(date: Date): string {
  return formatTimestamp(date).slice(0, 19).replace(/[-:]/g, "");
}

/** Sorts archives oldest first by stamp, then by the `-n` collision suffix. */
function archiveOrder(pattern: RegExp) {
  const key = (name: string) => {
    const [, stamp, suffix] = pattern.exec(name)!;
    return { stamp, index: suffix ? Number(suffix) : 0 };
  };
  return (a: string, b: string) => {
    const ka = key(a);
    const kb = key(b);
    return ka.stamp === kb.stamp ? ka.index - kb.index : ka.stamp < kb.stamp ? -1 : 1;
  };
}

/**
 * Creates a sink that appends lines to a file and rotates it by size. When a write would push
 * the file past `maxBytes`, the file is renamed to `<name>-<yyyyMMddTHHmmss>[-n]<ext>` and a new
 * one is started; the oldest archives are then deleted so at most `maxFiles` files remain.
 *
 * Writes are synchronous so writes and rotation from one process never interleave. Any file
 * system failure is reported once through `onError` and disables the sink, so logging can
 * never break request handling.
 *
 * @param options - File location, limits and collaborators.
 * @returns The sink.
 */
export function createRotatingFileSink({
  filePath,
  maxBytes,
  maxFiles,
  onError,
  fs = nodeFs,
  now = () => new Date(),
}: RotatingFileSinkOptions): LogSink {
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const base = path.basename(filePath, ext);
  const archivePattern = new RegExp(`^${escapeRegExp(base)}-(\\d{8}T\\d{6})(?:-(\\d+))?${escapeRegExp(ext)}$`);

  let size: number | undefined;
  let disabled = false;

  function nextArchivePath(): string {
    const stamp = archiveStamp(now());
    for (let index = 0; ; index++) {
      const candidate = path.join(dir, `${base}-${stamp}${index > 0 ? `-${index}` : ""}${ext}`);
      if (!fs.existsSync(candidate)) return candidate;
    }
  }

  function pruneArchives(): void {
    const archives = fs
      .readdirSync(dir)
      .filter((name) => archivePattern.test(name))
      .sort(archiveOrder(archivePattern));
    const excess = archives.length - (maxFiles - 1);
    for (const name of archives.slice(0, Math.max(0, excess))) fs.unlinkSync(path.join(dir, name));
  }

  function rotate(): void {
    fs.renameSync(filePath, nextArchivePath());
    pruneArchives();
  }

  return {
    write(line) {
      if (disabled) return;
      try {
        if (size === undefined) {
          fs.mkdirSync(dir, { recursive: true });
          size = fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
        }
        const data = `${line}\n`;
        const bytes = Buffer.byteLength(data);
        if (size > 0 && size + bytes > maxBytes) {
          rotate();
          size = 0;
        }
        fs.appendFileSync(filePath, data);
        size += bytes;
      } catch (error) {
        disabled = true;
        onError(error);
      }
    },
  };
}
