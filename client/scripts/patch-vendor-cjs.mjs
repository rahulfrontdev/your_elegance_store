import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const vendorDir = path.join(__dirname, '../src/vendor')

const THROW_RE =
  /throw Error\('Dynamic require of "' \+ x \+ '" is not supported'\);/
const PATCHED_THROW = `if (x === "react") return __VENDOR_REACT__.default ?? __VENDOR_REACT__;
  throw Error('Dynamic require of "' + x + '" is not supported');`

const IMPORT_REACT = `import __VENDOR_REACT__ from './react.js'\n`

for (const file of fs.readdirSync(vendorDir)) {
  if (!file.endsWith('-core.js') || file === 'react-core.js') continue

  const filePath = path.join(vendorDir, file)
  let code = fs.readFileSync(filePath, 'utf8')
  if (!code.includes('__require("react")')) continue
  if (code.includes('__VENDOR_REACT__')) continue

  code = code.replace(THROW_RE, PATCHED_THROW)
  fs.writeFileSync(filePath, IMPORT_REACT + code)
  console.log(`patched ${file}`)
}
