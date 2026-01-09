
export const calculateStreak = (dailyStats: { date: string; seconds: number }[]): number => {
    if (!dailyStats.length) return 0;

    // Sort descending by date
    const sorted = [...dailyStats].sort((a, b) => b.date.localeCompare(a.date));

    // Check if today or yesterday has reading time
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Find the latest entry that has > 0 seconds
    const latestEntry = sorted.find(s => s.seconds > 0);
    if (!latestEntry) return 0;

    // If the latest entry is not today or yesterday, streak is broken (0).
    // Note: This logic assumes dailyStats contains ALL history or sufficiently long history.
    // If dailyStats is truncated (e.g. last 7 days), streak calculation might be limited.
    // For a robust streak, we need continuous data.
    // Assuming 'dailyStats' passed here is a list of days where reading occurred.

    if (latestEntry.date !== today && latestEntry.date !== yesterday) {
        return 0;
    }

    let streak = 0;
    let expectedDate = new Date(latestEntry.date);

    for (const stat of sorted) {
        if (stat.seconds === 0) continue; // Skip zero days if they are in the list? 
        // Actually, if we have a gap in dates, the streak breaks.

        const statDate = new Date(stat.date);

        // Check if this stat date matches expected date
        if (statDate.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]) {
            streak++;
            // Move expected date back by one day
            expectedDate.setDate(expectedDate.getDate() - 1);
        } else {
            // Gap found
            break;
        }
    }

    return streak;
};

export const formatDuration = (seconds: number): { hours: number; minutes: number } => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return { hours, minutes };
};
