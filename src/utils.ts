import { basename, dirname, extname, join, posix, sep } from "node:path";

export function renderBundleName(entrypoint: string) {
    const parts = join(entrypoint).split(sep);
    if (parts[0] === "src") {
        parts.shift(); // just remove 'src' if its the first element for ergonomics
    }

    const p = parts.join(sep);
    const dir = dirname(p);
    const base = basename(p, extname(p));
    return join(dir, base);
}

/**
 * Converts the given path string to posix if it wasn't already.
 */
export function convertToPosixPath(p: string) {
    return p.split(sep).join(posix.sep);
}
