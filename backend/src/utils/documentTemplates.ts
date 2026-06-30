const BRAND_COLOR = '#1F4E79';

function baseStyles(): string {
  return `
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; font-size: 12px; }
    h1 { color: ${BRAND_COLOR}; font-size: 20px; margin-bottom: 4px; }
    h2 { color: ${BRAND_COLOR}; font-size: 14px; margin-top: 24px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border: 1px solid #d6dbe1; padding: 6px 10px; text-align: left; font-size: 12px; }
    th { background: ${BRAND_COLOR}; color: #fff; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid ${BRAND_COLOR}; padding-bottom: 12px; }
    .meta { color: #555; font-size: 11px; }
    .moyenne { font-size: 16px; font-weight: 700; color: ${BRAND_COLOR}; }
    .footer { margin-top: 32px; font-size: 10px; color: #888; text-align: center; }
  `;
}

export interface BulletinMatiereLigne {
  nom: string;
  code: string;
  coefficient: number;
  creditsEcts: number;
  moyenne: number;
}

export function bulletinSemestreHtml(params: {
  etablissement: string;
  etudiantNom: string;
  etudiantPrenom: string;
  matricule: string;
  filiere: string;
  niveau: string;
  semestre: number;
  anneeScolaire: string;
  matieres: BulletinMatiereLigne[];
  moyenneGenerale: number;
  mention: string;
  rang: number | null;
  effectifPromotion: number;
}): string {
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8" /><style>${baseStyles()}</style></head>
<body>
  <div class="header">
    <div><h1>${params.etablissement}</h1><div class="meta">Bulletin de notes — Semestre ${params.semestre} (${params.anneeScolaire})</div></div>
    <div class="meta">Édité le ${new Date().toLocaleDateString('fr-FR')}</div>
  </div>

  <h2>Informations de l'étudiant</h2>
  <table>
    <tr><th>Nom</th><td>${params.etudiantNom}</td><th>Prénom</th><td>${params.etudiantPrenom}</td></tr>
    <tr><th>Matricule</th><td>${params.matricule}</td><th>Filière</th><td>${params.filiere} — ${params.niveau}</td></tr>
  </table>

  <h2>Résultats par matière</h2>
  <table>
    <thead><tr><th>Matière</th><th>Code</th><th>Coefficient</th><th>Crédits ECTS</th><th>Moyenne / 20</th></tr></thead>
    <tbody>
      ${params.matieres
        .map(
          (m) => `<tr><td>${m.nom}</td><td>${m.code}</td><td>${m.coefficient}</td><td>${m.creditsEcts}</td><td>${m.moyenne.toFixed(2)}</td></tr>`,
        )
        .join('')}
    </tbody>
  </table>

  <h2>Synthèse</h2>
  <table>
    <tr><th>Moyenne générale</th><td class="moyenne">${params.moyenneGenerale.toFixed(2)} / 20</td>
        <th>Mention</th><td>${params.mention}</td></tr>
    <tr><th>Rang</th><td>${params.rang ?? '—'} / ${params.effectifPromotion}</td><th></th><td></td></tr>
  </table>

  <div class="footer">Document généré automatiquement par EduSmart — Plateforme de gestion scolaire intelligente.</div>
</body></html>`;
}

export interface PVLigneDecision {
  nom: string;
  prenom: string;
  matricule: string;
  moyenneGenerale: number;
  rang: number;
  decision: 'ADMIS' | 'AJOURNE';
}

const TYPE_FICHE_LABELS: Record<string, string> = {
  FICHE_RESUME: 'Fiche résumée',
  RESUME_DETAILLE: 'Résumé détaillé',
  QUIZ_QCM: 'Quiz QCM',
};

/** Convertit le markdown léger généré par le LLM (titres, listes, gras) en HTML simple. */
function markdownLeger(texte: string): string {
  return texte
    .split('\n')
    .map((ligne) => {
      const t = ligne.trim();
      if (t.startsWith('### ')) return `<h3>${t.slice(4)}</h3>`;
      if (t.startsWith('## ')) return `<h2>${t.slice(3)}</h2>`;
      if (t.startsWith('# ')) return `<h1>${t.slice(2)}</h1>`;
      if (t.startsWith('- ') || t.startsWith('* ')) return `<li>${t.slice(2)}</li>`;
      if (!t) return '<br/>';
      return `<p>${t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>`;
    })
    .join('\n');
}

export function fichePdfHtml(params: { etablissement: string; type: string; contenuGenere: string }): string {
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8" /><style>${baseStyles()} li { margin-left: 16px; }</style></head>
<body>
  <div class="header">
    <div><h1>${params.etablissement}</h1><div class="meta">${TYPE_FICHE_LABELS[params.type] ?? 'Fiche de révision'} — généré par IA</div></div>
    <div class="meta">${new Date().toLocaleDateString('fr-FR')}</div>
  </div>
  <div>${markdownLeger(params.contenuGenere)}</div>
  <div class="footer">Contenu généré automatiquement par le pipeline RAG d'EduSmart — à vérifier avant utilisation académique.</div>
</body></html>`;
}

export function statsDashboardHtml(params: {
  etablissement: string;
  genereLe: string;
  parFiliere: { nom: string; effectif: number; tauxReussite: number; moyenneGenerale: number }[];
  nbCoursDeposes: number;
  activiteChatbot: number;
  utilisateursActifs: number;
}): string {
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8" /><style>${baseStyles()}</style></head>
<body>
  <div class="header">
    <div><h1>${params.etablissement}</h1><div class="meta">Tableau de bord statistique</div></div>
    <div class="meta">Généré le ${new Date(params.genereLe).toLocaleString('fr-FR')}</div>
  </div>

  <h2>Indicateurs globaux</h2>
  <table>
    <tr><th>Utilisateurs actifs</th><td>${params.utilisateursActifs}</td>
        <th>Cours déposés</th><td>${params.nbCoursDeposes}</td>
        <th>Interactions chatbot</th><td>${params.activiteChatbot}</td></tr>
  </table>

  <h2>Résultats par filière</h2>
  <table>
    <thead><tr><th>Filière</th><th>Effectif</th><th>Taux de réussite</th><th>Moyenne générale</th></tr></thead>
    <tbody>
      ${params.parFiliere
        .map((f) => `<tr><td>${f.nom}</td><td>${f.effectif}</td><td>${f.tauxReussite}%</td><td>${f.moyenneGenerale.toFixed(2)}</td></tr>`)
        .join('')}
    </tbody>
  </table>

  <div class="footer">Document généré automatiquement par EduSmart.</div>
</body></html>`;
}

export function pvDeliberationHtml(params: {
  etablissement: string;
  filiere: string;
  niveau: string;
  semestre: number;
  anneeScolaire: string;
  lignes: PVLigneDecision[];
}): string {
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8" /><style>${baseStyles()}</style></head>
<body>
  <div class="header">
    <div><h1>${params.etablissement}</h1><div class="meta">Procès-verbal de délibération — ${params.filiere} ${params.niveau} — Semestre ${params.semestre} (${params.anneeScolaire})</div></div>
    <div class="meta">Édité le ${new Date().toLocaleDateString('fr-FR')}</div>
  </div>

  <h2>Décisions du jury</h2>
  <table>
    <thead><tr><th>Rang</th><th>Matricule</th><th>Nom</th><th>Prénom</th><th>Moyenne</th><th>Décision</th></tr></thead>
    <tbody>
      ${params.lignes
        .sort((a, b) => a.rang - b.rang)
        .map(
          (l) =>
            `<tr><td>${l.rang}</td><td>${l.matricule}</td><td>${l.nom}</td><td>${l.prenom}</td><td>${l.moyenneGenerale.toFixed(2)}</td><td>${l.decision}</td></tr>`,
        )
        .join('')}
    </tbody>
  </table>

  <div class="footer">Procès-verbal archivé conformément à la réglementation (conservation 10 ans) — EduSmart.</div>
</body></html>`;
}
