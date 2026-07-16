import React from "react";

export const metadata = {
  title: "Annexe aux CGVU — Marques, Propriete Intellectuelle et TVA — AcademIA Pro",
  description: "Annexe aux CGVU d'AcademIA Pro : identification des marques exploitees, propriete intellectuelle etendue et regime TVA OSS non-Union.",
};

const ANNEXE_HTML = "<p style='background:rgba(200,169,110,0.1);border:1px solid rgba(200,169,110,0.3);border-radius:8px;padding:10px 16px;color:#c8a96e;font-size:12px;text-align:center;margin-bottom:24px;'>La pr&eacute;sente annexe compl&egrave;te les Conditions G&eacute;n&eacute;rales de Vente et d&rsquo;Utilisation d&rsquo;Acad&eacute;mIA Pro et en fait partie int&eacute;grante.</p><h1>ANNEXE AUX CGVU</h1>\n<h2>Marques exploit&eacute;es, propri&eacute;t&eacute; intellectuelle et r&eacute;gime de TVA</h2>\n<hr />\n<p><strong>Soci&eacute;t&eacute; :</strong> Acad&eacute;mIA Pro LLC &mdash; 30 N Gould St STE R, Sheridan, WY 82801, &Eacute;tats-Unis d&rsquo;Am&eacute;rique. <strong>Immatriculation :</strong> [EIN et immatriculation Wyoming : en cours d&rsquo;obtention]. <strong>Contact :</strong> contact@academiapro.fr.</p>\n<hr />\n<h2>ARTICLE A.1 &mdash; MARQUES ET PLATEFORMES EXPLOIT&Eacute;ES</h2>\n<p>Acad&eacute;mIA Pro LLC exploite plusieurs plateformes et marques commerciales, notamment <strong>Acad&eacute;mIA Pro</strong> et <strong>HebrewPro AI</strong>, ainsi que toute autre plateforme, marque ou service actuel ou futur d&eacute;velopp&eacute; par la Soci&eacute;t&eacute;.</p>\n<p>Les pr&eacute;sentes CGVU, la Politique de Confidentialit&eacute; et l&rsquo;ensemble des documents contractuels de la Soci&eacute;t&eacute; s&rsquo;appliquent indiff&eacute;remment &agrave; l&rsquo;ensemble de ces produits et services, quelle que soit la marque commerciale sous laquelle ils sont propos&eacute;s. Toute r&eacute;f&eacute;rence &agrave; &laquo; Acad&eacute;mIA Pro &raquo; dans les CGVU s&rsquo;entend comme visant &eacute;galement, le cas &eacute;ch&eacute;ant, les autres plateformes exploit&eacute;es par la Soci&eacute;t&eacute;.</p>\n<hr />\n<h2>ARTICLE A.2 &mdash; PROPRI&Eacute;T&Eacute; INTELLECTUELLE &Eacute;TENDUE</h2>\n<p>Acad&eacute;mIA Pro LLC d&eacute;tient l&rsquo;int&eacute;gralit&eacute; des droits de propri&eacute;t&eacute; intellectuelle sur l&rsquo;ensemble de ses plateformes, marques, logos, chartes graphiques, interfaces, contenus, textes, vid&eacute;os, audios, supports p&eacute;dagogiques, bases de donn&eacute;es et syst&egrave;mes d&rsquo;intelligence artificielle, pour Acad&eacute;mIA Pro, HebrewPro AI, ainsi que pour toute autre plateforme actuelle ou future exploit&eacute;e par la Soci&eacute;t&eacute;.</p>\n<p>Cette propri&eacute;t&eacute; s&rsquo;&eacute;tend &agrave; toute cr&eacute;ation d&eacute;velopp&eacute;e dans le cadre de nouveaux projets de la Soci&eacute;t&eacute;, sans qu&rsquo;il soit n&eacute;cessaire de modifier les pr&eacute;sentes. Toute reproduction, repr&eacute;sentation ou exploitation non autoris&eacute;e est interdite et constitue une contrefa&ccedil;on, dans les conditions pr&eacute;vues &agrave; l&rsquo;Article 10 des CGVU.</p>\n<hr />\n<h2>ARTICLE A.3 &mdash; R&Eacute;GIME DE TVA (OSS NON-UNION)</h2>\n<p>Acad&eacute;mIA Pro LLC, soci&eacute;t&eacute; &eacute;tablie hors Union Europ&eacute;enne, rel&egrave;ve du <strong>r&eacute;gime OSS non-Union</strong> (guichet unique pour les prestataires &eacute;tablis hors UE) pour la TVA applicable aux services num&eacute;riques fournis &agrave; des consommateurs de l&rsquo;Union Europ&eacute;enne.</p>\n<p>La TVA est collect&eacute;e au taux en vigueur dans le pays de r&eacute;sidence du client, <strong>d&egrave;s la premi&egrave;re vente et sans seuil de franchise</strong>, conform&eacute;ment aux r&egrave;gles de l&rsquo;UE sur la TVA num&eacute;rique (Directive 2006/112/CE modifi&eacute;e). Les clients professionnels de l&rsquo;Union Europ&eacute;enne communiquant un num&eacute;ro de TVA intracommunautaire valide b&eacute;n&eacute;ficient du m&eacute;canisme d&rsquo;autoliquidation ; aucune TVA ne leur est alors factur&eacute;e. Les clients situ&eacute;s hors Union Europ&eacute;enne rel&egrave;vent d&rsquo;un traitement hors champ de la TVA de l&rsquo;UE.</p>\n<p>N&deg; OSS : [en cours d&rsquo;enregistrement].</p>\n<hr />\n<p><em>La pr&eacute;sente annexe compl&egrave;te les CGVU d&rsquo;Acad&eacute;mIA Pro et ne remplace pas une consultation juridique personnalis&eacute;e. Annexe version 1.0 &mdash; &copy; Acad&eacute;mIA Pro LLC &mdash; Tous droits r&eacute;serv&eacute;s.</em></p>";

export default function PageAnnexeCGV() {
  return (
    <main
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "48px 20px 80px",
        lineHeight: 1.7,
        fontSize: 16,
      }}
    >
      <style>{`
        .cgv h1 { font-size: 1.9rem; margin: 1.2em 0 .6em; }
        .cgv h2 { font-size: 1.35rem; margin: 2em 0 .6em; border-bottom: 1px solid rgba(128,128,128,.35); padding-bottom: .3em; }
        .cgv h3 { font-size: 1.1rem; margin: 1.4em 0 .4em; }
        .cgv table { border-collapse: collapse; width: 100%; margin: 1em 0; font-size: .95em; }
        .cgv th, .cgv td { border: 1px solid rgba(128,128,128,.4); padding: 8px 10px; text-align: left; vertical-align: top; }
        .cgv blockquote { border-left: 4px solid #c9a227; margin: 1.2em 0; padding: .6em 1em; background: rgba(201,162,39,.08); }
        .cgv hr { border: none; border-top: 1px solid rgba(128,128,128,.35); margin: 2em 0; }
        .cgv ul, .cgv ol { padding-left: 1.4em; }
        .cgv li { margin: .3em 0; }
        .cgv a { color: #c9a227; }
      `}</style>
      <div className="cgv" dangerouslySetInnerHTML={{ __html: ANNEXE_HTML }} />
    </main>
  );
}

