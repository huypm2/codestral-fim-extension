const vscode = require("vscode")

const API_URL = "https://codestral.mistral.ai/v1/fim/completions"

function activate(context) {
  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  )
  statusBar.command = "codestralFim.toggle"
  statusBar.tooltip = "Click to toggle Codestral FIM"

  const renderStatus = () => {
    const on = vscode.workspace.getConfiguration("codestralFim").get("enabled")
    statusBar.text = on ? "$(sparkle) Codestral" : "$(circle-slash) Codestral"
  }
  renderStatus()
  statusBar.show()

  context.subscriptions.push(
    statusBar,
    vscode.commands.registerCommand("codestralFim.toggle", async () => {
      const config = vscode.workspace.getConfiguration("codestralFim")
      const next = !config.get("enabled")
      await config.update("enabled", next, vscode.ConfigurationTarget.Global)
    }),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("codestralFim.enabled")) renderStatus()
    }),
  )

  const provider = {
    async provideInlineCompletionItems(document, position, _ctx, token) {
      const config = vscode.workspace.getConfiguration("codestralFim")
      if (!config.get("enabled")) return

      const allowed = config.get("fileExtensions") ?? []
      if (allowed.length > 0) {
        const match = document.fileName.match(/\.([^./\\]+)$/)
        const ext = match ? match[1].toLowerCase() : ""
        const normalized = allowed.map((e) =>
          e.replace(/^\./, "").toLowerCase(),
        )
        if (!normalized.includes(ext)) return
      }

      const apiKey = config.get("apiKey") || process.env.CODESTRAL_API_KEY
      if (!apiKey) return

      // Natural debounce: VSCode cancels the previous in-flight request
      // when the user types again, so a sleep here = no extra plumbing.
      const debounceMs = config.get("debounceMs") ?? 300
      await new Promise((r) => setTimeout(r, debounceMs))
      if (token.isCancellationRequested) return

      // prefix = everything before the cursor, suffix = everything after
      const prefix = document.getText(
        new vscode.Range(new vscode.Position(0, 0), position),
      )
      const lastLine = document.lineAt(document.lineCount - 1)
      const suffix = document.getText(
        new vscode.Range(position, lastLine.range.end),
      )

      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: config.get("model") || "codestral-latest",
            prompt: prefix,
            suffix: suffix,
            max_tokens: config.get("maxTokens") ?? 128,
            temperature: config.get("temperature") ?? 0.2,
            stop: ["\n\n"],
          }),
        })

        if (token.isCancellationRequested) return

        if (!response.ok) {
          console.error(
            "[codestral-fim]",
            response.status,
            await response.text(),
          )
          return
        }

        const data = await response.json()
        const text = data?.choices?.[0]?.message?.content ?? ""
        if (!text) return

        return [
          new vscode.InlineCompletionItem(
            text,
            new vscode.Range(position, position),
          ),
        ]
      } catch (err) {
        console.error("[codestral-fim]", err)
      }
    },
  }

  context.subscriptions.push(
    vscode.languages.registerInlineCompletionItemProvider(
      { pattern: "**" },
      provider,
    ),
  )
}

function deactivate() {}

module.exports = { activate, deactivate }
