// Validation hook for promptfoo config
// Checks that OPENAI_API_KEY is set before running evals
// Promptfoo automatically loads .env files, so this checks both environment and .env

async function extensionHook(hookName, context) {
  if (hookName === 'beforeAll') {
    if (!process.env.OPENAI_API_KEY) {
      console.error('ERROR: OPENAI_API_KEY is required but not set.');
      console.error('Set it in your environment or .env file.');
      console.error('Example: export OPENAI_API_KEY=sk-...');
      process.exit(1);
    }

    // Check custom endpoint vars when using the custom config
    const isCustomConfig = (context.config?.description || '').includes('Custom OpenAI-compatible');
    if (isCustomConfig) {
      const missing = ['CUSTOM_API_BASE_URL', 'CUSTOM_API_KEY', 'CUSTOM_MODEL']
        .filter(v => !process.env[v]);
      if (missing.length > 0) {
        console.error(`ERROR: Missing env vars for custom config: ${missing.join(', ')}`);
        console.error('Set them in your .env file or environment.');
        process.exit(1);
      }
    }

    // Return context to persist (even though we're not modifying it)
    return context;
  }
}

module.exports = extensionHook;
