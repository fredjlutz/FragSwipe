import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
    width: 32,
    height: 32,
}
export const contentType = 'image/png'

export default function Icon() {
    return new ImageResponse(
        (
            <div
                style={{
                    fontSize: 24,
                    background: 'linear-gradient(to bottom right, #3b82f6, #4ade80)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    borderRadius: '8px',
                    fontWeight: '900',
                    fontStyle: 'italic',
                }}
            >
                F
            </div>
        ),
        {
            ...size,
        }
    )
}
