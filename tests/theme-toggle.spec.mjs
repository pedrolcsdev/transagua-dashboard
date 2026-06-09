import { spawn } from "node:child_process"
import { once } from "node:events"
import assert from "node:assert/strict"
import { chromium } from "playwright"

const PORT = 51879
const BASE_URL = `http://127.0.0.1:${PORT}`
const STORAGE_KEY = "transagua-theme"

function waitForServer(process) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Timed out waiting for Vite dev server"))
    }, 30_000)

    function handleData(chunk) {
      const text = chunk.toString()
      if (text.includes(`localhost:${PORT}`) || text.includes(`127.0.0.1:${PORT}`)) {
        clearTimeout(timeout)
        resolve()
      }
    }

    process.stdout.on("data", handleData)
    process.stderr.on("data", handleData)
    process.once("exit", (code) => {
      clearTimeout(timeout)
      reject(new Error(`Vite dev server exited early with code ${code}`))
    })
  })
}

async function main() {
  const server = spawn(
    "npm",
    ["run", "dev", "--", "--host", "127.0.0.1", "--port", String(PORT)],
    {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
    }
  )

  try {
    await waitForServer(server)

    const browser = await chromium.launch()
    const page = await browser.newPage()

    await page.goto(BASE_URL)
    const toggle = page.getByRole("switch", { name: /modo escuro/i })
    assert.equal(await toggle.count(), 1)
    await assert.doesNotReject(() => toggle.waitFor({ timeout: 5_000 }))

    assert.equal(
      await page.evaluate(() => document.documentElement.classList.contains("dark-mode")),
      false
    )
    assert.equal(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY), "light")

    await toggle.click()
    assert.equal(
      await page.evaluate(() => document.documentElement.classList.contains("dark-mode")),
      true
    )
    assert.equal(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY), "dark")

    await page.reload()
    assert.equal(
      await page.evaluate(() => document.documentElement.classList.contains("dark-mode")),
      true
    )
    await assert.doesNotReject(() =>
      page.getByRole("switch", { name: /modo escuro/i }).waitFor({ timeout: 5_000 })
    )

    await page.getByRole("switch", { name: /modo escuro/i }).click()
    assert.equal(
      await page.evaluate(() => document.documentElement.classList.contains("dark-mode")),
      false
    )
    assert.equal(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY), "light")

    await browser.close()
  } finally {
    server.kill("SIGTERM")
    await once(server, "exit").catch(() => undefined)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
