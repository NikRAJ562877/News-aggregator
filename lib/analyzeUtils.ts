// Helper utilities for article analysis

export const isCompleteAnalysis = (analysis: any): boolean => {
  return (
    analysis &&
    typeof analysis.significance === 'number' &&
    analysis.significance >= 1 &&
    analysis.significance <= 10 &&
    analysis.category &&
    analysis.category !== 'N/A' &&
    analysis.category !== 'undefined' &&
    analysis.region &&
    analysis.region !== 'N/A' &&
    analysis.region !== 'undefined' &&
    analysis.analysis &&
    String(analysis.analysis).trim().length > 0
  )
}

export const fetchAnalysisWithRetry = async (
  article: any,
  maxRetries: number = 3,
  initialDelayMs: number = 1000,
  keyIndex?: number,
  analysisType?: 'general' | 'innovation' | 'sector',
): Promise<any> => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const body: any = { article, analysisType }
      if (typeof keyIndex === 'number') body.keyIndex = keyIndex

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      // Retry on rate-limit or server errors
      if (response.status === 429 || response.status >= 500) {
        if (attempt < maxRetries - 1) {
          const delayMs = initialDelayMs * Math.pow(2, attempt) + Math.random() * 500
          console.warn(`Analysis request returned status ${response.status}, retrying in ${delayMs.toFixed(0)}ms...`)
          await new Promise((r) => setTimeout(r, delayMs))
          continue
        }
      }

      const text = await response.text()
      let analysis: any = null
      try {
        analysis = JSON.parse(text)
      } catch (e) {
        try {
          const match = text.match(/\{[\s\S]*\}/m)
          if (match) analysis = JSON.parse(match[0])
        } catch (ee) {
          // fallthrough
        }
      }

      if (analysis && isCompleteAnalysis(analysis)) {
        return analysis
      }

      if (attempt < maxRetries - 1) {
        const delayMs = initialDelayMs * Math.pow(2, attempt)
        console.warn(`Incomplete analysis (attempt ${attempt + 1}/${maxRetries}), retrying in ${delayMs.toFixed(0)}ms...`, analysis || text)
        await new Promise((r) => setTimeout(r, delayMs))
        continue
      }

      // Last attempt: if we have some structured analysis, return it (best-effort)
      if (analysis) return analysis

      throw new Error(`Analysis failed after ${maxRetries} attempts`)
    } catch (error) {
      if (attempt < maxRetries - 1) {
        const delayMs = initialDelayMs * Math.pow(2, attempt)
        console.warn(`Analysis fetch failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delayMs.toFixed(0)}ms...`, error)
        await new Promise((r) => setTimeout(r, delayMs))
      } else {
        throw error
      }
    }
  }

  throw new Error('Failed to get complete analysis after retries')
}
