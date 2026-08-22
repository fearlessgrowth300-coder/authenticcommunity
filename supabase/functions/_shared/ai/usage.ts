import type { AiProvider } from './provider.ts'

type RpcClient = {
  rpc: (name: string, params: Record<string, unknown>) => PromiseLike<{ error?: unknown }>
}

export async function recordAiUsage(
  client: RpcClient,
  provider: Pick<AiProvider, 'name'>,
  details: {
    model: string
    task: string
    success: boolean
    inputUnits?: number
    outputUnits?: number
  },
) {
  try {
    const { error } = await client.rpc('record_ai_usage', {
      p_provider: provider.name,
      p_model: details.model,
      p_task: details.task,
      p_success: details.success,
      p_input_units: Math.max(0, Math.round(details.inputUnits || 0)),
      p_output_units: Math.max(0, Math.round(details.outputUnits || 0)),
    })
    if (error) console.error('AI usage metric write failed')
  } catch {
    console.error('AI usage metric write failed')
  }
}
