import { NextRequest, NextResponse } from 'next/server';
import { CHANGENOW_API_URL } from '@/lib/constants';

export async function GET(req: NextRequest) {
    const apiKey = process.env.CHANGENOW_API_KEY;

    if (!apiKey) {
        return NextResponse.json(
            { error: 'API key not configured' },
            { status: 500 }
        );
    }

    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const amount = searchParams.get('amount');

    if (!from || !to || !amount) {
        return NextResponse.json(
            { error: 'Missing "from", "to", or "amount" parameter' },
            { status: 400 }
        );
    }

    try {
        const res = await fetch(
            `${CHANGENOW_API_URL}/exchange-amount/${amount}/${from}_${to}?api_key=${apiKey}`,
            { headers: { 'Content-Type': 'application/json' } }
        );

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(
                errorData.message || `ChangeNow API responded with ${res.status}`
            );
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching exchange amount:', error);
        const message = error instanceof Error ? error.message : 'Failed to fetch exchange amount';
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
