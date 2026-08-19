"""
Agent Classe Virtuelle - AcademIA Pro
Rejoint une salle LiveKit, pilote l'avatar LiveAvatar,
anime la session : 45 min de cours + 15 min de questions.
"""

import os
import asyncio
import logging
from dotenv import load_dotenv

from livekit import agents
from livekit.agents import AgentSession, Agent, RoomInputOptions
from livekit.plugins import liveavatar, anthropic

load_dotenv()

logger = logging.getLogger("classe-virtuelle")
logging.basicConfig(level=logging.INFO)

# ------------------------------------------------------------
# CONFIGURATION
# ------------------------------------------------------------
DUREE_COURS_MIN = 45       # phase 1 : conference
DUREE_QUESTIONS_MIN = 15   # phase 2 : questions/reponses

INSTRUCTIONS_FORMATEUR = """
Tu es le formateur IA d'AcademIA Pro pour cette classe virtuelle.

DEROULEMENT DE LA SESSION (60 minutes) :
- Phase 1 (45 min) : tu deroules le cours du jour de maniere
  structuree et vivante. Les participants ecrivent leurs
  questions dans le chat pendant ce temps - tu ne les traites
  PAS pendant la phase 1.
- Phase 2 (15 min) : tu reprends les questions du chat une par
  une. Tu lis chaque question a voix haute avant d'y repondre,
  pour que tout le monde en beneficie. Tu regroupes les
  questions similaires.

REGLES :
- Tu detectes la langue de chaque question et tu REPONDS
  TOUJOURS dans la langue utilisee par le stagiaire
  (francais, anglais, espagnol, hebreu, arabe, etc.).
- REGLE DE GROUPE ESSENTIELLE : la classe est collective et
  majoritairement francophone. Chaque fois que tu reponds
  dans une langue AUTRE que le francais, tu termines
  systematiquement par : "En francais pour tout le monde :"
  suivi d'un resume clair et concis (2-3 phrases) de ta
  reponse en francais, afin que tous les participants
  puissent suivre l'echange.
- Par defaut, en l'absence d'indication, tu parles en
  francais, de maniere claire et pedagogique.
- Tu restes strictement dans le sujet de la formation.
- Si une question depasse le cadre, tu proposes de la traiter
  en session individuelle avec l'agent de la formation.
- Tu conclus la session en annoncant le theme de la prochaine.
"""


class FormateurClasseVirtuelle(Agent):
    def __init__(self, contenu_du_jour: str,
                 consigne_formation: str = "") -> None:
        instructions = INSTRUCTIONS_FORMATEUR
        # 🚨 CONSIGNE PAR FORMATION — ajoutee le 19/08.
        # Certaines formations (F320 Psychanalyste en premier) ont une
        # consigne d'animation specifique dans la table agent_consignes :
        # posture, niveau, vocabulaire, limites. Elle s'ajoute AVANT le
        # contenu du jour. Sans consigne en table : rien ne change.
        if consigne_formation:
            instructions += (
                "\n\nCONSIGNE SPECIFIQUE A CETTE FORMATION"
                " (elle precise ou surcharge les regles ci-dessus) :\n"
                + consigne_formation
            )
        instructions += "\n\nCONTENU DU COURS DU JOUR :\n" + contenu_du_jour
        super().__init__(instructions=instructions)


def _code_formation(nom_salle: str) -> str:
    """Extrait le code formation du nom de salle (F320-session1 -> F320)."""
    import re
    m = re.match(r"^(F\d{3})", (nom_salle or "").upper())
    return m.group(1) if m else ""


def _lire_supabase(chemin: str):
    """Petit client REST Supabase en lecture seule. Retourne la liste
    des lignes, ou [] si indisponible - l'agent ne plante jamais."""
    import urllib.request
    import json as _json

    supabase_url = os.environ.get("SUPABASE_URL", "")
    supabase_key = os.environ.get("SUPABASE_ANON_KEY", "")
    if not supabase_url or not supabase_key:
        return []
    try:
        req = urllib.request.Request(
            supabase_url + chemin,
            headers={
                "apikey": supabase_key,
                "Authorization": "Bearer " + supabase_key,
            })
        with urllib.request.urlopen(req, timeout=10) as resp:
            return _json.loads(resp.read().decode())
    except Exception as e:
        logger.warning("Lecture Supabase impossible (%s) : %s", chemin, e)
        return []


def charger_programme(nom_salle: str) -> str:
    """Si la salle commence par un code formation (ex: F030-session1),
    charge le programme depuis Supabase. Sinon, cours general."""
    code = _code_formation(nom_salle)
    if not code:
        return "Cours general de decouverte AcademIA Pro."

    rows = _lire_supabase(
        "/rest/v1/formations"
        + "?code=eq." + code
        + "&select=titre,description,programme,objectifs")
    if rows:
        f = rows[0]
        return (
            "FORMATION DU JOUR : " + str(f.get("titre", code))
            + "\n\nDESCRIPTION : " + str(f.get("description", ""))[:500]
            + "\n\nOBJECTIFS : " + str(f.get("objectifs", ""))[:500]
            + "\n\nPROGRAMME : " + str(f.get("programme", ""))[:1500]
        )
    return "Cours general AcademIA Pro (formation " + code + ")."


def charger_consigne(nom_salle: str) -> str:
    """Consigne d'animation propre a la formation, si elle existe dans
    la table agent_consignes (F320 Psychanalyste en premier).
    Retourne une chaine vide sinon : comportement inchange."""
    code = _code_formation(nom_salle)
    if not code:
        return ""

    rows = _lire_supabase(
        "/rest/v1/agent_consignes"
        + "?formation_code=eq." + code
        + "&actif=eq.true"
        + "&select=consigne")
    if rows:
        logger.info("Consigne specifique chargee pour %s", code)
        return str(rows[0].get("consigne", ""))
    return ""


async def entrypoint(ctx: agents.JobContext):
    """Point d'entree : appele quand une salle demande l'agent."""
    await ctx.connect()
    logger.info("Connecte a la salle : %s", ctx.room.name)

    # ECONOMIE CREDITS : fermeture quand le dernier humain part
    def _humains_presents():
        return [
            p for p in ctx.room.remote_participants.values()
            if not p.identity.startswith("agent")
            and "avatar" not in p.identity
        ]

    @ctx.room.on("participant_disconnected")
    def _sur_depart(participant):
        if not _humains_presents():
            logger.info("Dernier humain parti - fermeture %s",
                        ctx.room.name)
            import asyncio as _aio
            _aio.create_task(ctx.room.disconnect())

    # Le contenu du cours est passe via les metadata de la salle
    contenu_du_jour = ctx.room.metadata or charger_programme(ctx.room.name)
    # La consigne par formation se charge TOUJOURS d'apres le nom de la
    # salle, que le contenu vienne des metadata ou de la fiche.
    consigne_formation = charger_consigne(ctx.room.name)

    # 1. La session agent : cerveau (LLM Claude via LiveAvatar mode Lite)
    session = AgentSession(
        stt="deepgram/nova-3:multi",
        llm=anthropic.LLM(model="claude-sonnet-4-6"),
        tts="cartesia/sonic-3:ab7c61f5-3daa-47dd-a23b-4ac0aac5f5c3",
    )

    # 2. L'avatar LiveAvatar rejoint la salle et publie SON flux video
    avatar = liveavatar.AvatarSession(
        avatar_id=os.environ["LIVEAVATAR_AVATAR_ID"],
        avatar_participant_name="Formateur AcadémIA",
    )
    await avatar.start(session, room=ctx.room)

    # 3. Demarrage de la session pedagogique
    await session.start(
        room=ctx.room,
        agent=FormateurClasseVirtuelle(contenu_du_jour, consigne_formation),
        room_input_options=RoomInputOptions(),
    )

    session.generate_reply(
        instructions="Salue chaleureusement les participants qui arrivent, "
        "presente-toi comme le formateur IA de cette classe virtuelle "
        "AcademIA Pro, et invite-les a te poser des questions a voix haute."
    )
    # LECTURE DU CHAT : l'agent recoit et repond aux messages ecrits
    @session.on("conversation_item_added")
    def _sur_message(ev):
        pass  # le chat LiveKit est route vers la session par defaut

    logger.info("Session demarree - phase cours (%d min)", DUREE_COURS_MIN)

    # 4. Minuterie du format 45 + 15
    await asyncio.sleep(DUREE_COURS_MIN * 60)
    session.generate_reply(
        instructions="La phase de cours est terminee. Annonce aux "
        "participants que tu passes maintenant aux questions du chat, "
        "et commence a les traiter une par une."
    )
    logger.info("Phase questions (%d min)", DUREE_QUESTIONS_MIN)

    await asyncio.sleep(DUREE_QUESTIONS_MIN * 60)
    session.generate_reply(
        instructions="La session est terminee. Remercie les participants, "
        "annonce le theme de la prochaine session et dis au revoir."
    )
    logger.info("Session terminee.")


if __name__ == "__main__":
    agents.cli.run_app(
        agents.WorkerOptions(entrypoint_fnc=entrypoint)
    )
