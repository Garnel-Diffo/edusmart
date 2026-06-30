import { ImageResponse } from 'next/og';

// Icône Apple (180 × 180 px) — affichée lors de l'ajout à l'écran d'accueil iOS/iPadOS.
// Next.js App Router sert ce fichier comme <link rel="apple-touch-icon"> automatiquement.
export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
          display: 'flex',
          position: 'relative',
        }}
      >
        {/* ── Mortarboard ── */}

        {/* Top board : carré 65×65 pivoté 45° → losange ≈ 92 px de diagonale */}
        {/* Centre (90, 72) → top=72-32.5=39.5≈40, left=90-32.5=57.5≈58         */}
        <div
          style={{
            position: 'absolute',
            width: 65,
            height: 65,
            background: 'white',
            transform: 'rotate(45deg)',
            top: 40,
            left: 57,
          }}
        />

        {/* Cap band — sous le point bas du losange (90, 72+46=118) */}
        <div
          style={{
            position: 'absolute',
            width: 72,
            height: 24,
            background: 'rgba(255,255,255,0.87)',
            borderRadius: 7,
            top: 115,
            left: 54,
          }}
        />

        {/* Arrondi bas de la bande */}
        <div
          style={{
            position: 'absolute',
            width: 64,
            height: 14,
            background: 'rgba(255,255,255,0.70)',
            borderRadius: '0 0 12px 12px',
            top: 133,
            left: 58,
          }}
        />

        {/* Cordon du gland depuis le coin droit du losange (90+46=136, 72) */}
        <div
          style={{
            position: 'absolute',
            width: 3.5,
            height: 54,
            background: 'rgba(255,255,255,0.68)',
            borderRadius: 2,
            top: 72,
            left: 134,
          }}
        />

        {/* Extrémité du gland (dorée) */}
        <div
          style={{
            position: 'absolute',
            width: 22,
            height: 13,
            background: '#fbbf24',
            borderRadius: 5,
            top: 126,
            left: 124,
          }}
        />

        {/* ── Étoile IA (coin supérieur droit) ── */}
        {/* Simulation 4-branche : deux rectangles croisés */}
        <div
          style={{
            position: 'absolute',
            width: 16,
            height: 4,
            background: '#93c5fd',
            borderRadius: 2,
            top: 21,
            right: 22,
            opacity: 0.92,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 4,
            height: 16,
            background: '#93c5fd',
            borderRadius: 2,
            top: 15,
            right: 28,
            opacity: 0.92,
          }}
        />
        {/* Centre brillant de l'étoile */}
        <div
          style={{
            position: 'absolute',
            width: 6,
            height: 6,
            background: '#bfdbfe',
            borderRadius: '50%',
            top: 20,
            right: 26,
          }}
        />

        {/* ── Texte "EduSmart" ── */}
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              color: 'rgba(255,255,255,0.92)',
              fontSize: 18,
              fontWeight: 700,
              fontFamily: 'sans-serif',
              letterSpacing: '3px',
              textTransform: 'uppercase',
            }}
          >
            EDUSMART
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
