-- ============================================================
-- Migration compliance_0001_socle
-- Socle multi-tenant du module LLC Compliance
-- Schema strict et type. Regles en donnees, pas en dur.
-- tenant_id + RLS partout des la premiere ligne.
-- ============================================================

-- Extension pour uuid si absente
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- ENUMS (schema type, pas de texte libre sur les champs cles)
-- ------------------------------------------------------------
do $$ begin
  create type compliance_entity_type as enum ('LLC', 'CORP', 'OTHER');
exception when duplicate_object then null; end $$;

do $$ begin
  create type compliance_us_residency as enum ('NRA', 'US_PERSON');
exception when duplicate_object then null; end $$;

do $$ begin
  create type compliance_deadline_status as enum ('a_venir', 'prepare', 'depose', 'accuse_archive');
exception when duplicate_object then null; end $$;

do $$ begin
  create type compliance_channel as enum ('portail', 'fax', 'courrier', 'email', 'interne');
exception when duplicate_object then null; end $$;

do $$ begin
  create type compliance_jurisdiction as enum ('US_FEDERAL', 'US_STATE', 'FR', 'EU', 'FINCEN', 'INTERNE');
exception when duplicate_object then null; end $$;

do $$ begin
  create type compliance_member_tx_kind as enum ('apport', 'retrait', 'transaction_membre');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------
-- TABLE 1 : compliance_tenants (profil de compliance)
-- Une ligne par LLC abonnee. Jacques = tenant n.1.
-- Le profil pilote la generation des echeances.
-- ------------------------------------------------------------
create table if not exists compliance_tenants (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null default gen_random_uuid(),
  label               text not null,
  legal_name          text not null,
  entity_type         compliance_entity_type not null default 'LLC',
  formation_state     text not null,                 -- ex: 'WY'
  formation_date      date,
  anniversary_month   int  check (anniversary_month between 1 and 12),
  us_residency        compliance_us_residency not null default 'NRA',
  has_us_source_income boolean not null default false, -- flag 1040-NR
  fr_tax_resident     boolean not null default false,  -- declenche volet FR
  urssaf_watch        boolean not null default false,  -- point de vigilance
  doola_renewal_date  date,                            -- a remplir par Jacques
  notes               text,
  created_at          timestamptz not null default now()
);

-- ------------------------------------------------------------
-- TABLE 2 : compliance_rules (catalogue generique, partage)
-- Ajouter un Etat / une obligation = INSERER des lignes.
-- Zero ligne de code touchee.
-- ------------------------------------------------------------
create table if not exists compliance_rules (
  id                  uuid primary key default gen_random_uuid(),
  code                text not null unique,          -- ex: 'US_5472'
  jurisdiction        compliance_jurisdiction not null,
  title               text not null,
  -- declencheurs : quelles caracteristiques de tenant activent la regle
  trig_entity_type    compliance_entity_type,        -- null = tout type
  trig_formation_state text,                          -- null = tout Etat
  trig_us_residency   compliance_us_residency,        -- null = indifferent
  trig_requires_us_income boolean not null default false,
  trig_requires_fr_resident boolean not null default false,
  -- regle de date : decrite en donnees
  due_month           int check (due_month between 1 and 12), -- null = mois anniv
  due_day             int check (due_day between 1 and 31),
  use_anniversary_month boolean not null default false,
  recurrence          text not null default 'annual', -- annual|quarterly|on_demand|once
  -- montant et canal
  amount_min          numeric(12,2),
  currency            text default 'USD',
  penalty_note        text,
  channel             compliance_channel not null default 'portail',
  filing_note         text,
  reminder_offsets    int[] not null default '{60,30,7}', -- J-n
  active              boolean not null default true,
  created_at          timestamptz not null default now()
);

-- ------------------------------------------------------------
-- TABLE 3 : compliance_deadlines (echeances generees)
-- Intersection tenant x regle, propre a chaque tenant.
-- ------------------------------------------------------------
create table if not exists compliance_deadlines (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null,
  rule_code           text not null references compliance_rules(code),
  period_label        text,                          -- ex: 'FY2026'
  due_date            date not null,
  status              compliance_deadline_status not null default 'a_venir',
  amount_due          numeric(12,2),
  currency            text default 'USD',
  prepared_at         timestamptz,
  filed_at            timestamptz,
  acknowledged_at     timestamptz,
  document_url        text,                          -- coffre versionne
  notes               text,
  created_at          timestamptz not null default now(),
  unique (tenant_id, rule_code, period_label)
);

-- ------------------------------------------------------------
-- TABLE 4 : compliance_member_transactions (tag membre<->LLC)
-- Socle du futur pre-remplissage 5472. Pose des maintenant.
-- ------------------------------------------------------------
create table if not exists compliance_member_transactions (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null,
  tx_date             date not null,
  kind                compliance_member_tx_kind not null,
  amount              numeric(12,2) not null,
  currency            text not null default 'USD',
  description         text,
  source_ref          text,                          -- lien vers mouvement hub
  created_at          timestamptz not null default now()
);

-- ------------------------------------------------------------
-- INDEX utiles
-- ------------------------------------------------------------
create index if not exists idx_deadlines_tenant on compliance_deadlines(tenant_id);
create index if not exists idx_deadlines_due    on compliance_deadlines(due_date);
create index if not exists idx_membertx_tenant  on compliance_member_transactions(tenant_id);

-- ------------------------------------------------------------
-- RLS : isolation stricte par tenant des la creation
-- (les regles sont un catalogue partage : lecture ouverte,
--  ecriture reservee au proprietaire via service role)
-- ------------------------------------------------------------
alter table compliance_tenants               enable row level security;
alter table compliance_rules                 enable row level security;
alter table compliance_deadlines             enable row level security;
alter table compliance_member_transactions   enable row level security;

-- Politiques tenants : chaque tenant ne voit que sa/ses lignes
do $$ begin
  create policy tenants_isolation on compliance_tenants
    using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy deadlines_isolation on compliance_deadlines
    using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy membertx_isolation on compliance_member_transactions
    using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
exception when duplicate_object then null; end $$;

-- Catalogue de regles : lecture pour tout utilisateur authentifie
do $$ begin
  create policy rules_read on compliance_rules
    for select using (true);
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------
-- SEED 1 : tenant n.1 (Jacques)
-- LLC Wyoming, NRA, resident fiscal FR, anniversaire juin
-- ------------------------------------------------------------
insert into compliance_tenants
  (label, legal_name, entity_type, formation_state, formation_date,
   anniversary_month, us_residency, has_us_source_income, fr_tax_resident,
   urssaf_watch, doola_renewal_date, notes)
values
  ('AcademIA Pro LLC (tenant 1)', 'ACADEMIA PRO LLC', 'LLC', 'WY',
   date '2026-06-25', 6, 'NRA', false, true, true, null,
   'Tenant fondateur. doola_renewal_date a renseigner. Formule Doola a retrograder des EIN recu.')
on conflict do nothing;

-- ------------------------------------------------------------
-- SEED 2 : catalogue de regles initial
-- ------------------------------------------------------------

-- Federal US
insert into compliance_rules
 (code, jurisdiction, title, trig_entity_type, trig_us_residency,
  due_month, due_day, recurrence, amount_min, currency, penalty_note,
  channel, filing_note)
values
 ('US_5472_1120', 'US_FEDERAL', 'Form 5472 + 1120 pro forma', 'LLC', 'NRA',
  4, 15, 'annual', null, 'USD', 'Penalite non-depot : 25 000 USD',
  'fax', 'Depot par fax ou courrier uniquement. Obligatoire meme sans revenu US.'),
 ('US_7004', 'US_FEDERAL', 'Form 7004 (extension de delai)', 'LLC', null,
  4, 15, 'on_demand', null, 'USD', null,
  'courrier', 'Genere en un clic si echeance approche sans depot.'),
 ('US_W8BENE', 'US_FEDERAL', 'W-8BEN-E', 'LLC', 'NRA',
  null, null, 'on_demand', null, 'USD', null,
  'email', 'A la demande des clients/plateformes. Pre-remplissage instantane.')
on conflict (code) do nothing;

-- 1040-NR : conditionnel au flag revenus source US
insert into compliance_rules
 (code, jurisdiction, title, trig_entity_type, trig_us_residency,
  trig_requires_us_income, due_month, due_day, recurrence, channel, filing_note)
values
 ('US_1040NR', 'US_FEDERAL', 'Form 1040-NR', 'LLC', 'NRA',
  true, 6, 15, 'annual', 'courrier',
  'Uniquement si revenus de source US. Extension possible au 15 octobre.')
on conflict (code) do nothing;

-- Wyoming : Annual Report au mois anniversaire (juin pour Jacques)
insert into compliance_rules
 (code, jurisdiction, title, trig_entity_type, trig_formation_state,
  due_day, use_anniversary_month, recurrence, amount_min, currency,
  channel, filing_note)
values
 ('WY_ANNUAL_REPORT', 'US_STATE', 'Wyoming Annual Report + license tax', 'LLC', 'WY',
  1, true, 'annual', 60, 'USD',
  'portail', 'Du le 1er du mois anniversaire. Montant min ~60 USD. Portail Secretary of State WY.'),
 ('WY_REGISTERED_AGENT', 'US_STATE', 'Maintien registered agent Wyoming', 'LLC', 'WY',
  null, false, 'annual', null, 'USD',
  'interne', 'Maintien continu obligatoire. Actuellement Doola.')
on conflict (code) do nothing;

-- FinCEN BOI : statut suivi (exempte pour entite domestique a ce jour)
insert into compliance_rules
 (code, jurisdiction, title, trig_entity_type, recurrence, channel, filing_note, active)
values
 ('FINCEN_BOI', 'FINCEN', 'FinCEN BOI (statut suivi)', 'LLC',
  'on_demand', 'portail',
  'Entites domestiques US exemptees depuis 2025. Regle mouvante : declaration guidee si reactivation.',
  true)
on conflict (code) do nothing;

-- Francais (declenches si fr_tax_resident)
insert into compliance_rules
 (code, jurisdiction, title, trig_requires_fr_resident,
  due_month, recurrence, currency, penalty_note, channel, filing_note)
values
 ('FR_2042', 'FR', 'Declaration revenus 2042 + 2042 C PRO', true,
  5, 'annual', 'EUR', null, 'portail',
  'Revenus mondiaux, BIC/BNC LLC inclus. Avant fin mai N+1.'),
 ('FR_3916', 'FR', 'Formulaire 3916 (comptes etrangers)', true,
  5, 'annual', 'EUR', 'Penalite 1 500 EUR par compte par an', 'portail',
  'Comptes Mercury et Stripe (USA). A joindre a la 2042.'),
 ('FR_3916BIS', 'FR', 'Formulaire 3916 BIS (structure LLC >10%)', true,
  5, 'annual', 'EUR', 'Penalite 750 EUR min par structure', 'portail',
  'Declaration structure etrangere controlee. Obligatoire depuis 2019.'),
 ('EU_OSS_NONUNION', 'EU', 'OSS non-Union (declaration TVA)', true,
  null, 'quarterly', 'EUR', null, 'portail',
  'Declaration trimestrielle avant le 20 du mois suivant. CA HT + TVA par pays.')
on conflict (code) do nothing;

-- Interne : fenetre de retrogradation Doola
insert into compliance_rules
 (code, jurisdiction, title, recurrence, channel, filing_note, reminder_offsets)
values
 ('INT_DOOLA_DOWNGRADE', 'INTERNE', 'Fenetre de retrogradation abonnement Doola',
  'on_demand', 'interne',
  'Retrograder vers la formule minimale (~300 EUR/an) AVANT renouvellement. Verifier que le registered agent reste inclus.',
  '{90,60,30}')
on conflict (code) do nothing;

-- ============================================================
-- Fin migration compliance_0001_socle
-- ============================================================
