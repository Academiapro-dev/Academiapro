// Numero de TVA intracommunautaire francais.
//
// FR + une cle a deux chiffres + les 9 chiffres du SIREN.
// La cle vaut (12 + 3 x (SIREN modulo 97)) modulo 97.
//
// ATTENTION a ce que ce calcul NE dit PAS : le numero obtenu est
// syntaxiquement correct, il ne prouve ni que l entreprise existe, ni
// qu elle est assujettie, ni que le numero est actif. Une micro-entreprise
// en franchise a un numero calculable qu elle n utilise pas. La seule
// verification reelle passe par le service VIES de la Commission.
//
// Ce calcul ne vaut QUE pour la France. Un preneur belge, luxembourgeois ou
// autre a une autre construction : son numero doit etre saisi.

// Extrait 9 chiffres d un SIREN ou d un SIRET (dont le SIREN est le debut).
export function sirenDe(valeur: string | null | undefined): string {
  const chiffres = String(valeur || "").replace(/\D/g, "");
  if (chiffres.length < 9) return "";
  return chiffres.slice(0, 9);
}

// La cle de Luhn du SIREN : elle ne fait pas partie du numero de TVA, mais
// elle dit si le SIREN lui-meme est plausible. Un SIREN mal saisi produirait
// sinon un numero de TVA plausible et faux.
export function sirenPlausible(siren: string): boolean {
  if (!/^\d{9}$/.test(siren)) return false;
  let somme = 0;
  for (let i = 0; i < 9; i++) {
    let n = parseInt(siren.charAt(i), 10);
    // On double un chiffre sur deux en partant de la droite.
    if ((9 - i) % 2 === 0) {
      n = n * 2;
      if (n > 9) n = n - 9;
    }
    somme = somme + n;
  }
  return somme % 10 === 0;
}

export function numeroTvaDepuisSiren(valeur: string | null | undefined): string {
  const siren = sirenDe(valeur);
  if (!siren) return "";
  if (!sirenPlausible(siren)) return "";

  const reste = Number(BigInt(siren) % BigInt(97));
  const cle = (12 + 3 * reste) % 97;

  return "FR" + String(cle).padStart(2, "0") + siren;
}
