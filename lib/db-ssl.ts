import { readFileSync } from "node:fs"
import { join } from "node:path"

let cachedCa: string | undefined

export function getDbSsl() {
  if (!cachedCa) {
    cachedCa = readFileSync(join(process.cwd(), "lib", "do-ca.crt"), "utf8")
  }

  return {
    ca: cachedCa,
    rejectUnauthorized: false,
  }
}
