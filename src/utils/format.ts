/**
 * Utilitaire centralisé de formatage pour L'Écrin du Temps.
 * La devise officielle de l'application est uniquement le Franc CFA (FCFA), sans exception.
 */

/**
 * Formate un montant en Franc CFA (FCFA) selon le format camerounais :
 * - Pas de décimales (arrondi à l'entier le plus proche)
 * - Séparateur de milliers avec espace standard (ex: "80 000 FCFA")
 * - Toujours suivi de la mention "FCFA"
 *
 * @param amount - Montant numérique ou chaîne convertible
 * @returns Chaîne formatée, ex: "80 000 FCFA"
 */
export function formatPrice(amount?: number | string | null): string {
  if (amount === undefined || amount === null || amount === '') {
    return '0 FCFA';
  }
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) {
    return '0 FCFA';
  }
  const rounded = Math.round(num);
  // Remplace les espaces insécables ou fines (\u202f, \u00a0) par des espaces classiques pour une parfaite compatibilité
  const formatted = rounded.toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ');
  return `${formatted} FCFA`;
}

/**
 * Devise officielle de l'application
 */
export const OFFICIAL_CURRENCY = 'FCFA';
