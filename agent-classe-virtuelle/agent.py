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
- Tu parles en francais, de maniere claire et pedagogique.
- Tu restes strictement dans le sujet de la formation.
- Si une question depasse le cadre, tu proposes de la traiter
  en session individuelle avec l'agent de la formation.
- Tu conclus la session en annoncant le theme de la prochaine.
"""


class FormateurClasseVirtuelle(Agent):
    def __init__(self, contenu_du_jour: str) -> None:
        super().__init__(
            instructions=INSTRUCTIONS_FORMATEUR
            + "\n\nCONTENU DU COURS DU JOUR :\n"
            + contenu_du_jour
        )


async def entrypoint(ctx: agents.JobContext):
    """Point d'entree : appele quand une salle demande l'agent."""
    await ctx.connect()
    logger.info("Connecte a la salle : %s", ctx.room.name)

    # Le contenu du cours est passe via les metadata de la salle
    contenu_du_jour = ctx.room.metadata or "Cours general."

    # 1. La session agent : cerveau (LLM Claude via LiveAvatar mode Lite)
    session = AgentSession(
        stt="deepgram/nova-3:fr",
        llm=anthropic.LLM(model="claude-sonnet-4-6"),
    )

    # 2. L'avatar LiveAvatar rejoint la salle et publie SON flux video
    avatar = liveavatar.AvatarSession(
        avatar_id=os.environ["LIVEAVATAR_AVATAR_ID"],
    )
    await avatar.start(session, room=ctx.room)

    # 3. Demarrage de la session pedagogique
    await session.start(
        room=ctx.room,
        agent=FormateurClasseVirtuelle(contenu_du_jour),
        room_input_options=RoomInputOptions(),
    )

    session.generate_reply(
        instructions="Salue chaleureusement les participants qui arrivent, "
        "presente-toi comme le formateur IA de cette classe virtuelle "
        "AcademIA Pro, et invite-les a te poser des questions a voix haute."
    )
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
