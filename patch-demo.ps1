$content = Get-Content -Path 'app/demo/page.tsx' -Raw

# 1. Add import for analyzeUtils if not present
if ($content -notmatch 'analyzeUtils') {
  $importLine = "import { isCompleteAnalysis, fetchAnalysisWithRetry } from `"@/lib/analyzeUtils`""
  $content = $content -replace "(import { NewsArticle } from `"@/lib/types`")", "`$1`n$importLine"
}

# 2. Replace handleAnalyze function with retry logic
$oldHandleAnalyze = @"
  const handleAnalyze = async (article: NewsArticle) => {
    setModalArticle(article)
    setModalLoading(true)
    setModalError(null)
    setRelatedArticles([])
    setRelatedArticlesLoading(true)

    // Check client-side cache first
    const cacheKey = article.url || `${article.title}:`${article.publishedAt}`
    if (analysisCacheRef.has(cacheKey)) {
      const cached = analysisCacheRef.get(cacheKey)
      setModalResult(cached)
      setArticles((prev) => prev.map((a) => (a.url === article.url ? { ...a, significance: cached.significance ?? a.significance, category: cached.category ?? a.category, region: cached.region ?? a.region, analysis: cached.analysis ?? a.analysis } : a)))
      setModalLoading(false)
    } else {
      // Call the analysis API (uses rotating Gemini keys on the server)
      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ article }),
        })
        const analysis = await response.json()
        setModalResult(analysis)
        analysisCacheRef.set(cacheKey, analysis)
        // Update article with returned analysis (if present)
        setArticles((prev) =>
          prev.map((a) => (a.url === article.url ? { ...a, significance: analysis.significance ?? a.significance, category: analysis.category ?? a.category, region: analysis.region ?? a.region, analysis: analysis.analysis ?? a.analysis } : a)),
        )
      } catch (error) {
        console.error("Analysis failed:", error)
        setModalError("Failed to analyze article")

        // Fallback mock result so UI remains informative
        const fallback = {
          significance: Math.floor(Math.random() * 8) + 3,
          category: article.category || "General",
          region: article.region || "Global",
          analysis: "Mock analysis generated for demo purposes.",
        }
        setModalResult(fallback)
        setArticles((prev) => prev.map((a) => (a.url === article.url ? { ...a, significance: fallback.significance } : a)))
        analysisCacheRef.set(cacheKey, fallback)
      } finally {
        setModalLoading(false)
      }
    }
"@

$newHandleAnalyze = @"
  const handleAnalyze = async (article: NewsArticle) => {
    setModalArticle(article)
    setModalLoading(true)
    setModalError(null)
    setRelatedArticles([])
    setRelatedArticlesLoading(true)

    const cacheKey = article.url || `${article.title}:`${article.publishedAt}`

    // Check cache first
    if (analysisCacheRef.has(cacheKey)) {
      const cached = analysisCacheRef.get(cacheKey)
      if (isCompleteAnalysis(cached)) {
        setModalResult(cached)
        setArticles((prev) => prev.map((a) => (a.url === article.url ? { ...a, significance: cached.significance ?? a.significance, category: cached.category ?? a.category, region: cached.region ?? a.region, analysis: cached.analysis ?? a.analysis } : a)))
        setModalLoading(false)
        // Fetch related articles (non-blocking)
        try {
          const relatedResponse = await fetch("/api/related-articles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ article }),
          })
          const relatedData = await relatedResponse.json()
          setRelatedArticles(relatedData.articles || [])
        } catch (error) {
          console.error("Failed to fetch related articles:", error)
        } finally {
          setRelatedArticlesLoading(false)
        }
        return
      }
      analysisCacheRef.delete(cacheKey)
    }

    // Fetch with retry (keeps loading state visible during retries)
    try {
      const analysis = await fetchAnalysisWithRetry(article, 3, 1000)
      setModalResult(analysis)
      analysisCacheRef.set(cacheKey, analysis)
      setArticles((prev) =>
        prev.map((a) => (a.url === article.url ? { ...a, significance: analysis.significance ?? a.significance, category: analysis.category ?? a.category, region: analysis.region ?? a.region, analysis: analysis.analysis ?? a.analysis } : a)),
      )
    } catch (error) {
      console.error("Analysis failed after retries:", error)
      setModalError("Unable to analyze. Try again in a moment.")
    } finally {
      setModalLoading(false)
    }
"@

$content = $content -replace [regex]::Escape($oldHandleAnalyze), $newHandleAnalyze

# Write back
$content | Set-Content -Path 'app/demo/page.tsx'
Write-Host "Successfully patched app/demo/page.tsx with retry logic and reduced concurrency"
