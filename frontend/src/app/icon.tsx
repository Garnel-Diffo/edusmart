import { ImageResponse } from 'next/og';

// Favicon affiché dans l'onglet du navigateur (32 × 32 px).
// Next.js App Router sert ce fichier comme <link rel="icon"> automatiquement.
export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 7,
          background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
          display: 'flex',
          position: 'relative',
        }}
      >
        {/* Mortarboard top board - carré 11×11 pivoté 45° → losange 15.6 px de diagonal */}
        <div
          style={{
            position: 'absolute',
            width: 11,
            height: 11,
            background: 'white',
            transform: 'rotate(45deg)',
            top: 5,    // center_y(11) - half(5.5) ≈ 5
            left: 10,  // center_x(16) - half(5.5) ≈ 10
          }}
        />

        {/* Cap band juste sous le losange */}
        <div
          style={{
            position: 'absolute',
            width: 12,
            height: 4,
            background: 'rgba(255,255,255,0.86)',
            borderRadius: 1,
            top: 18,
            left: 10,
          }}
        />

        {/* Cordon de gland (côté droit du losange) */}
        <div
          style={{
            position: 'absolute',
            width: 2,
            height: 8,
            background: 'rgba(255,255,255,0.68)',
            borderRadius: 1,
            top: 12,
            left: 23,
          }}
        />

        {/* Extrémité du gland (dorée) */}
        <div
          style={{
            position: 'absolute',
            width: 5,
            height: 3,
            background: '#fbbf24',
            borderRadius: 1,
            top: 21,
            left: 21,
          }}
        />

        {/* Étoile IA (coin supérieur droit) */}
        <div
          style={{
            position: 'absolute',
            width: 4,
            height: 4,
            background: '#93c5fd',
            borderRadius: '50%',
            top: 3,
            right: 3,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
