import { NextResponse } from 'next/server';

const API_BASE = 'https://api.whitewhalememe.com/api/v1';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const season = searchParams.get('season') || 'season_two';
    const wallet = searchParams.get('wallet');

    try {
        let url: string;
        if (wallet) {
            // Fetch individual wallet score
            url = `${API_BASE}/${season}/score/${wallet}`;
        } else {
            // Fetch full leaderboard
            url = `${API_BASE}/${season}/leaderboard`;
        }

        const res = await fetch(url, {
            next: { revalidate: 60 }, // cache 60 seconds
        });

        if (!res.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch leaderboard data' },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (err) {
        console.error('Leaderboard proxy error:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
