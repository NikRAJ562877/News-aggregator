$demoFile = "app/demo/page.tsx"
$content = Get-Content -Path $demoFile -Raw

# Replace handleAnalyze with retry version
$oldAnalyze = @'
  // Basic stubs for analyze / persona /bulk-check to keep the page interactive
  const handleAnalyze = async (article: NewsArticle) => {
    setModalArticle(article)
    setModalLoading(true)
    setModalError(null)
    setRelatedArticles([])
    setRelatedArticlesLoading(true)

    // Check client-side cache first
    const cacheKey = article.url || `${article.title}:${article.publishedAt}`
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

    // Fetch related articles in parallel (non-blocking for the main analysis)
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
  }
'@

$newAnalyze = @'
  // Analyze with retry logic - keeps loading state visible during retries instead of showing N/A
  const handleAnalyze = async (article: NewsArticle) => {
    setModalArticle(article)
    setModalLoading(true)
    setModalError(null)
    setRelatedArticles([])
    setRelatedArticlesLoading(true)

    const cacheKey = article.url || `${article.title}:${article.publishedAt}`

    // Check cache first - use cached result only if it's complete
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
      // Cached result is incomplete, delete and refetch
      analysisCacheRef.delete(cacheKey)
    }

    // Fetch with retry logic - keeps loading state visible during retries
    try {
      const analysis = await fetchAnalysisWithRetry(article, 3, 1000)
      setModalResult(analysis)
      analysisCacheRef.set(cacheKey, analysis)
      setArticles((prev) =>
        prev.map((a) => (a.url === article.url ? { ...a, significance: analysis.significance ?? a.significance, category: analysis.category ?? a.category, region: analysis.region ?? a.region, analysis: analysis.analysis ?? a.analysis } : a)),
      )
    } catch (error) {
      console.error("Analysis failed after retries:", error)
      setModalError("Unable to analyze this article. Try again in a moment.")
    } finally {
      setModalLoading(false)
    }

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
  }
'@

if ($content.Contains($oldAnalyze)) {
  $content = $content.Replace($oldAnalyze, $newAnalyze)
  $content | Set-Content -Path $demoFile
  Write-Host "✓ Successfully updated handleAnalyze with retry logic"
} else {
  Write-Host "✗ Could not find exact handleAnalyze string to replace"
  Write-Host "Attempting alternative replacement..."
}
