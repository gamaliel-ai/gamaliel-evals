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
    // Return context to persist (even though we're not modifying it)
    return context;
  }
}

module.exports = extensionHook;
