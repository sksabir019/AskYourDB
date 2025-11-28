export function safeJsonParse<T = any>(text: string): T | null {
    // Defensive: strip markdown fences, try to locate JSON substring
    try {
        const trimmed = text.trim();
        // Try direct parse first
        return JSON.parse(trimmed) as T;
    } catch (e) {
        // Log initial parse failure
        console.debug('Initial JSON parse failed:', e instanceof Error ? e.message : 'Unknown error');
        
        // fallback: find first { and last }
        const first = text.indexOf('{');
        const last = text.lastIndexOf('}');
        if (first !== -1 && last !== -1 && last > first) {
            try { 
                return JSON.parse(text.slice(first, last + 1)) as T; 
            } catch (err) {
                // Log fallback parse failure but don't throw - return null
                console.warn('JSON fallback parse failed:', err instanceof Error ? err.message : 'Unknown error');
            }
        }
    }
    return null;
}
