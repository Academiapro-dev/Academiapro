-- compliance_0007_comptes_etrangers.sql
-- Brique declaration des comptes detenus a l'etranger (Formulaire 3916 / 3916 bis).
-- La table recense chaque compte etranger avec les champs exiges par le 3916.
-- Le module generera ensuite une fiche recapitulative a recopier sur impots.gouv.fr
-- (pas de teletransmission directe pour un particulier).

create table if not exists compliance_comptes_etrangers (
    id                  uuid primary key default gen_random_uuid(),
    tenant_id           uuid not null,

    -- Identification du compte (cases du 3916)
    designation         text not null,           -- designation / intitule du compte
    type_compte         text not null default 'bancaire'
                        check (type_compte in ('bancaire','actifs_numeriques','contrat_capitalisation')),
    caractere           text not null default 'professionnel'
                        check (caractere in ('personnel','professionnel')),

    -- Organisme gestionnaire
    organisme_nom       text not null,           -- nom de l'etablissement (ex. Airwallex)
    organisme_adresse   text,                    -- adresse complete de l'organisme
    organisme_pays      text,                    -- pays de l'organisme

    -- Le compte
    numero_compte       text,                    -- IBAN / numero de compte
    date_ouverture      date,
    date_cloture        date,                     -- null si toujours ouvert
    devise              text,                     -- devise principale du compte

    -- Titulaire (qui declare : point a valider fiscaliste FR/US)
    titulaire           text not null default 'personne_physique'
                        check (titulaire in ('personne_physique','entite')),
    titulaire_precision text,                     -- ex. "compte au nom de ACADEMIA PRO LLC, attribue au membre"

    -- Suivi / validation
    valide_par_fiscaliste boolean not null default false,
    notes               text,

    exercice            int not null,             -- annee fiscale de reference
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

comment on table compliance_comptes_etrangers is
    'Comptes detenus a l''etranger a declarer au Formulaire 3916/3916 bis (FR). Une ligne par compte et par exercice.';

-- RLS : isolation par tenant, coherent avec les autres tables compliance_*
alter table compliance_comptes_etrangers enable row level security;

drop policy if exists cce_service_all on compliance_comptes_etrangers;
create policy cce_service_all
    on compliance_comptes_etrangers
    for all
    to service_role
    using (true)
    with check (true);

-- Ajout de la regle d'echeance "declaration 3916" dans le catalogue de regles.
-- Calee sur la declaration de revenus annuelle FR (mai N+1).
-- Insert idempotent : ne double pas si la regle existe deja (code unique).
insert into compliance_rules
    (code, libelle, juridiction, periodicite, mois_echeance, jour_echeance, penalite, actif)
select
    'FR_3916',
    'Declaration des comptes detenus a l''etranger (Formulaire 3916 / 3916 bis)',
    'FR',
    'annuelle',
    5,          -- mai
    20,         -- avant date limite declaration revenus (repere prudent)
    'Amende par compte non declare (1 500 EUR/compte, 3916 bis 750 EUR min)',
    true
where not exists (
    select 1 from compliance_rules where code = 'FR_3916'
);
