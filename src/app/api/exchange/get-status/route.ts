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
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json(
            { error: 'Missing "id" parameter' },
            { status: 400 }
        );
    }

    try {
        const res = await fetch(
            `${CHANGENOW_API_URL}/transactions/${id}/${apiKey}`,
            { headers: { 'Content-Type': 'application/json' } }
        );

        if (!res.ok) {
            throw new Error(`ChangeNow API responded with ${res.status}`);
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching transaction status:', error);
        return NextResponse.json(
            { error: 'Failed to fetch transaction status' },
            { status: 500 }
        );
    }
}
