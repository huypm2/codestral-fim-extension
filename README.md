# Codestral FIM (minimal)

Tiny VSCode extension that uses Codestral's fill-in-the-middle endpoint for inline (ghost-text) completions.

## Setup

1. Get an API key from https://console.mistral.ai
2. Open this folder in VSCode and press **F5** to launch an Extension Development Host. To install permanently, package and install via the CLI:

   ```
   npx --yes @vscode/vsce package --allow-missing-repository --skip-license
   code --install-extension codestral-fim-0.0.1.vsix
   ```

   If you use a custom VSCode **profile**, pass it explicitly — otherwise the extension installs into the default profile and won't show up:

   ```
   code --profile <profile-name> --install-extension codestral-fim-0.0.1.vsix
   ```

   Or use the GUI: Extensions view → `...` menu → **Install from VSIX...** (this targets the active profile).

   Avoid copying the folder into `~/.vscode/extensions/` directly — it doesn't register with profile-aware installs and tends to leave stale entries that block later CLI installs.

3. Set the key in **Settings → Codestral FIM → API Key**, or export `CODESTRAL_API_KEY` before launching VSCode.

## How it works

Sends everything before the cursor as `prompt` and everything after as `suffix` to `POST https://codestral.mistral.ai/v1/fim/completions`, then renders the response as an inline completion. Type, pause briefly, accept with **Tab**.

## Settings

- `codestralFim.apiKey` — your key
- `codestralFim.model` — default `codestral-latest`
- `codestralFim.maxTokens` — default `128`
- `codestralFim.temperature` — default `0.2`
- `codestralFim.debounceMs` — default `300`

## Notes / next steps

- Requires VSCode 1.85+ (Node 18+) so `fetch` is global.
- API key lives in plain `settings.json`. For real use, switch to `context.secrets` (VSCode SecretStorage).
- No streaming — each completion is one round trip. Codestral does support streaming if you want to add it.
- Filters: currently triggers on every document. Add a `documentSelector` if you want to scope by language.
