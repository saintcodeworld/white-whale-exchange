import { NextRequest, NextResponse } from 'next/server';
import { CHANGENOW_API_URL } from '@/lib/constants';

export async function POST(req: NextRequest) {
    const apiKey = process.env.CHANGENOW_API_KEY;

    if (!apiKey) {
        return NextResponse.json(
            { error: 'API key not configured' },
            { status: 500 }
        );
    }

    try {
        const body = await req.json();
        const { from, to, amount, address, extraId } = body;

        if (!from || !to || !amount || !address) {
            return NextResponse.json(
                { error: 'Missing required fields: from, to, amount, address' },
                { status: 400 }
            );
        }

        const payload: Record<string, unknown> = {
            from,
            to,
            amount: Number(amount),
            address,
        };

        if (extraId) {
            payload.extraId = extraId;
        }

        const res = await fetch(
            `${CHANGENOW_API_URL}/transactions/${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }
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
        console.error('Error creating transaction:', error);
        const message = error instanceof Error ? error.message : 'Failed to create transaction';
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
