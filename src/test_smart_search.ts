

async function testSearch(query: string) {
    console.log(`\n--- Testing Query: "${query}" ---`);
    try {
        const response = await fetch("http://127.0.0.1:3000/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: query,
                // We can force intent if NLP is tricky, but let's try natural first.
                // If NLP fails, we can add "web.search" intent manually if route supports it, 
                // but chat route parses message. 
                // Let's rely on "ara" keyword or explicit intent if possible.
                // Based on chatRoutes, we can't easily force intent via body unless we use a dev backdoor or just trust the NLP.
                // Let's use "ara" which maps to search.
                // Actually chatRoutes says: if (intent.startsWith("web.") || intent.startsWith("search.")) return Handlers.searchHandler;
                // And searchHandler handles "web.search". 
                // Let's try to define logic to force "web.search".
                // "google'da ara" usually triggers web.search.
            })
        });

        const data = await response.json();
        console.log("Response Status:", response.status);
        console.log("Reply:", data.reply);

        if (data.data?.results) {
            console.log("Structured Results:");
            data.data.results.forEach((r: any, i: number) => {
                console.log(`${i + 1}. [${r.site}] ${r.title} - ${r.price} ${r.currency}`);
            });
        }
    } catch (e) {
        console.error("Test failed:", e);
    }
}

// Case 1: Vague query (Semantic Optimization needed)
// Case 2: Specific query (Unified Search needed)
(async () => {
    // Wait for server to be ready
    await new Promise(r => setTimeout(r, 2000));

    // Explicitly ask for web search to ensure our handler is hit
    await testSearch("internettten kahvemi sıcak tutan bir şey ara");
})();
