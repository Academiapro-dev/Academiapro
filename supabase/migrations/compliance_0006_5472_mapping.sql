-- ============================================================
-- compliance_0006_5472_mapping.sql
-- Table de mapping du Form 5472 (rev. 12-2023) + 1120 pro forma
-- pour un tenant. Approche bi-branches sur la qualification
-- des avances de creation (compte courant vs apport).
-- ============================================================

create table if not exists compliance_5472_mapping (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references compliance_tenants(tenant_id) on delete cascade,
  tax_year int not null,

  -- Qualification (bi-branches, basculable par un fiscaliste)
  hypothese_qualification text not null default 'compte_courant'
    check (hypothese_qualification in ('compte_courant','apport')),
  qualification_validee_par_fiscaliste boolean not null default false,

  -- Part I : Reporting corporation (la LLC)
  ri_name text,               -- 1a
  ri_address text,            -- 1a
  ri_ein text,                -- 1b
  ri_total_assets_usd numeric,-- 1c (depend du taux de change)
  ri_business_activity text,  -- 1d
  ri_naics text,              -- 1e
  ri_total_gross_payments_usd numeric, -- 1f (= ligne 17b)
  ri_nb_5472 int default 1,   -- 1g
  ri_initial_year boolean default true, -- 1j
  ri_nb_partsviii int default 0, -- 1k
  ri_country_incorp text default 'United States', -- 1l
  ri_date_incorp date,        -- 1m
  ri_country_resident text default 'France', -- 1n
  ri_country_business text default 'France', -- 1o
  ri_is_foreign_owned_de boolean default true, -- case 3 (COCHEE)

  -- Part II : 25% foreign shareholder (Jacques)
  fs_name_address text,       -- 4a
  fs_us_id text,              -- 4b(1) (aucun, non-resident)
  fs_ftin text,               -- 4b(3) FTIN = num fiscal FR
  fs_country_business text default 'France', -- 4c
  fs_country_citizenship text default 'France', -- 4d
  fs_country_resident text default 'France', -- 4e

  -- Part III : related party (Jacques aussi)
  rp_is_foreign boolean default true,
  rp_name_address text,       -- 8a
  rp_ftin text,               -- 8b(3)
  rp_business_activity text,  -- 8c
  rp_naics text,              -- 8d
  rp_related_to_reporting boolean default true, -- 8e
  rp_is_25pct_shareholder boolean default true, -- 8e
  rp_country_business text default 'France', -- 8f
  rp_country_resident text default 'France', -- 8g

  -- Part IV : monetary transactions
  -- Compte courant = pret de l'associe a la LLC => ligne 17
  p4_l17a_beginning_balance_usd numeric default 0, -- 17a
  p4_l17b_ending_balance_usd numeric,              -- 17b
  p4_l22_total_usd numeric,                        -- 22

  -- Part VII : additional info (pret SANS interet)
  p7_q42a_safe_haven_in_range boolean default false,  -- No
  p7_q42b_safe_haven_out_range boolean default false, -- No

  -- 1120 pro forma (5 champs + Schedule K)
  f1120_name_address text,
  f1120_ein text,           -- case B
  f1120_date_incorp date,   -- case C
  f1120_total_assets_usd numeric, -- case D
  f1120_initial_return boolean default true, -- case E
  f1120_schedk_q7_foreign_owner boolean default true, -- Q7 Yes
  f1120_schedk_q7_pct int default 100,
  f1120_schedk_q7_country text default 'France',
  f1120_schedk_q27_digital_assets boolean default false, -- No

  -- Conversion de devise (a valider)
  taux_eur_usd numeric,     -- taux applique, A CONFIRMER
  taux_source text,         -- source du taux (a documenter)
  taux_valide boolean default false,

  -- Montants sources (avant conversion, pour tracabilite)
  avances_usd_natif numeric,  -- montant deja en USD
  avances_eur_natif numeric,  -- montant en EUR (a convertir)

  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (tenant_id, tax_year)
);

alter table compliance_5472_mapping enable row level security;

create policy compliance_5472_tenant_isolation
  on compliance_5472_mapping
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- ============================================================
-- SEED : exercice fiscal 2026 (depot 2027) pour Jacques
-- Champs statiques remplis ; montants USD et total assets
-- laisses a completer une fois le taux de change valide.
-- ============================================================
insert into compliance_5472_mapping (
  tenant_id, tax_year, hypothese_qualification,
  ri_name, ri_address, ri_ein, ri_business_activity, ri_naics,
  ri_nb_5472, ri_initial_year, ri_date_incorp, ri_is_foreign_owned_de,
  fs_name_address, fs_ftin,
  rp_is_foreign, rp_name_address, rp_ftin, rp_business_activity, rp_naics,
  rp_related_to_reporting, rp_is_25pct_shareholder,
  p4_l17a_beginning_balance_usd,
  p7_q42a_safe_haven_in_range, p7_q42b_safe_haven_out_range,
  f1120_name_address, f1120_ein, f1120_date_incorp, f1120_initial_return,
  f1120_schedk_q7_foreign_owner, f1120_schedk_q7_pct, f1120_schedk_q7_country,
  f1120_schedk_q27_digital_assets,
  avances_usd_natif, avances_eur_natif,
  taux_valide, qualification_validee_par_fiscaliste,
  notes
) values (
  '048da817-b4d1-40d8-9107-88fe87e600ee', 2026, 'compte_courant',
  'AcademIA Pro LLC',
  '30 N Gould St Ste R, Sheridan, WY 82801',
  '32-0862305',
  'Online educational services',
  '611000',
  1, true, '2026-06-25', true,
  'Jacques Lalou, 34 Allee Thiellement, 93340 Le Raincy, France',
  '0219587652221',
  true,
  'Jacques Lalou, 34 Allee Thiellement, 93340 Le Raincy, France',
  '0219587652221',
  'Online educational services',
  '611000',
  true, true,
  0,
  false, false,
  'AcademIA Pro LLC, 30 N Gould St Ste R, Sheridan, WY 82801',
  '32-0862305', '2026-06-25', true,
  true, 100, 'France',
  false,
  2289.54, 47.90,
  false, false,
  'DE foreign-owned. Avances de creation qualifiees compte courant associe (ligne 17 amounts borrowed), SANS interet. A VALIDER par fiscaliste/CPA avant depot. Taux de change EUR->USD a fixer et documenter (annexe obligatoire). Depot par 1120 pro forma + 5472 attache, canal FAX 855-887-7737 ou courrier Ogden UT, jamais electronique.'
)
on conflict (tenant_id, tax_year) do nothing;
