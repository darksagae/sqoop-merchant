import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach } from 'vitest'
import { closeAll } from '@/lib/db'

let dir = ''

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'sqoop-'))
  process.env.SQOOP_DB = join(dir, 'sqoop.sqlite3')
})

afterEach(() => {
  closeAll()
  rmSync(dir, { recursive: true, force: true })
})
