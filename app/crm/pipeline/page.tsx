import React, { useState } from "react";

const GOLD = "#c8a96e";
const BG = "#050508";
const COL_BG = "#0d0d14";
const CARD_BG = "#12121c";
const BORDER = "#1e1e2e";
const TEXT_MAIN = "#e8e0d0";
const TEXT_MUTED = "#6b6880";
const TEXT_GOLD = "#c8a96e";

interface Prospect {
  id: number;
  name: string;
  company: string;
  value: string;
  contact: string;
  date: string;
  priority: "haute" | "moyenne" | "basse";
  avatar: string;
}

interface Column {
  id: string;
  label: string;
  color: string;
  prospects: Prospect[];
}

const priorityColor: Record<string, string> = {
  haute: "#e85c5c",
  moyenne: "#c8a96e",
  basse: "#5c9ee8",
};

const initialColumns: Column[] = [
  {
    id: "lead",
    label: "Lead",
    color: "#5c9ee8",
    prospects: [
      { id: 1, name: "Sophie Martin", company: "TechFlow SAS", value: "12 000 €", contact: "sophie@techflow.fr", date: "12 Jan", priority: "haute", avatar: "SM" },
      { id: 2, name: "Marc Dupont", company: "Innovex SARL", value: "8 500 €", contact: "marc@innovex.fr", date: "14 Jan", priority: "moyenne", avatar: "MD" },
      { id: 3, name: "Claire Petit", company: "DataSphere", value: "22 000 €", contact: "claire@datasphere.io", date: "15 Jan", priority: "basse", avatar: "CP" },
    ],
  },
  {
    id: "qualification",
    label: "Qualification",
    color: "#a05ce8",
    prospects: [
      { id: 4, name: "Thomas Bernard", company: "CloudNet SA", value: "35 000 €", contact: "thomas@cloudnet.fr", date: "10 Jan", priority: "haute", avatar: "TB" },
      { id: 5, name: "Lucie Moreau", company: "Nexus Digital", value: "18 000 €", contact: "lucie@nexus.fr", date: "11 Jan", priority: "moyenne", avatar: "LM" },
    ],
  },
  {
    id: "proposition",
    label: "Proposition",
    color: "#e8a05c",
    prospects: [
      { id: 6, name: "Antoine Leroy", company: "Optima Group", value: "54 000 €", contact: "a.leroy@optima.fr", date: "08 Jan", priority: "haute", avatar: "AL" },
      { id: 7, name: "Emma Roux", company: "Stratex Corp", value: "29 000 €", contact: "e.roux@stratex.com", date: "09 Jan", priority: "haute", avatar: "ER" },
      { id: 8, name: "Paul Simon", company: "FutureLab", value: "11 000 €", contact: "paul@futurelab.io", date: "10 Jan", priority: "basse", avatar: "PS" },
    ],
  },
  {
    id: "negociation",
    label: "Négociation",
    color: "#e8e05c",
    prospects: [
      { id: 9, name: "Julie Blanc", company: "Apex Solutions", value: "72 000 €", contact: "j.blanc@apex.fr", date: "05 Jan", priority: "haute", avatar: "JB" },
      { id: 10, name: "Romain Garnier", company: "Vertex AI", value: "41 000 €", contact: "r.garnier@vertex.ai", date: "06 Jan", priority: "moyenne", avatar: "RG" },
    ],
  },
  {
    id: "gagne",
    label: "Gagné",
    color: "#5ce87a",
    prospects: [
      { id: 11, name: "Isabelle Laurent", company: "Momentum SAS", value: "95 000 €", contact: "i.laurent@momentum.fr", date: "02 Jan", priority: "haute", avatar: "IL" },
      { id: 12, name: "Nicolas Faure", company: "Synergy Ltd", value: "63 000 €", contact: "n.faure@synergy.co", date: "03 Jan", priority: "moyenne", avatar: "NF" },
    ],
  },
  {
    id: "perdu",
    label: "Perdu",
    color: "#e85c5c",
    prospects: [
      { id: 13, name: "Camille Durand", company: "OldTech Inc", value: "27 000 €", contact: "c.durand@oldtech.fr", date: "28 Dec", priority: "basse", avatar: "CD" },
    ],
  },
];

function getTotalValue(prospects: Prospect[]): string {
  const total = prospects.reduce((acc, p) => {
    const n = parseInt(p.value.replace(/[^0-9]/g, ""), 10);
    return acc + (isNaN(n) ? 0 : n);
  }, 0);
  if (total === 0) return "0 €";
  return total.toLocaleString("fr-FR") + " €";
}

function ProspectCard({ prospect, columnColor, onDragStart }: { prospect: Prospect; columnColor: string; onDragStart: (e: React.DragEvent, id: number) => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, prospect.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "#16162a" : CARD_BG,
        border: "1px solid",
        borderColor: hovered ? columnColor + "60" : BORDER,
        borderRadius: "10px",
        padding: "14px",
        marginBottom: "10px",
        cursor: "grab",
        transition: "all 0.2s ease",
        boxShadow: hovered ? "0 4px 20px rgba(0,0,0,0.5)" : "0 2px 8px rgba(0,0,0,0.3)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "3px",
          height: "100%",
          background: columnColor,
          borderRadius: "10px 0 0 10px",
        }}
      />
      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "10px" }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, " + columnColor + "40, " + columnColor + "20)",
            border: "1px solid " + columnColor + "60",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
            fontWeight: "700",
            color: columnColor,
            flexShrink: 0,
            fontFamily: "monospace",
          }}
        >
          {prospect.avatar}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "13px",
              fontWeight: "600",
              color: TEXT_MAIN,
              marginBottom: "2px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {prospect.name}
          </div>
          <div
            style={{
              fontSize: "11px",
              color: TEXT_MUTED,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {prospect.company}
          </div>
        </div>
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: priorityColor[prospect.priority],
            flexShrink: 0,
            marginTop: "4px",
            boxShadow: "0 0 6px " + priorityColor[prospect.priority] + "80",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "8px",
        }}
      >
        <div
          style={{
            fontSize: "15px",
            fontWeight: "700",
            color: TEXT_GOLD,
            letterSpacing: "0.3px",
          }}
        >
          {prospect.value}
        </div>
        <div
          style={{
            fontSize: "10px",
            color: TEXT_MUTED,
            background: "#1a1a2e",
            padding: "3px 8px",
            borderRadius: "20px",
            border: "1px solid " + BORDER,
          }}
        >
          {prospect.date}
        </div>
      </div>

      <div
        style={{
          fontSize: "10px",
          color: TEXT_MUTED,
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <span style={{ color: columnColor + "80" }}>✉</span>
        <span
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {prospect.contact}
        </span>
      </div>

      <div
        style={{
          marginTop: "8px",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <span
          style={{
            fontSize: "9px",
            padding: "2px 8px",
            borderRadius: "20px",
            background: priorityColor[prospect.priority] + "20",
            color: priorityColor[prospect.priority],
            border: "1px solid " + priorityColor[prospect.priority] + "40",
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {prospect.priority}
        </span>
      </div>
    </div>
  );
}

function KanbanColumn({
  column,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  column: Column;
  onDragStart: (e: React.DragEvent, id: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, colId: string) => void;
}) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      style={{
        width: "240px",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          background: COL_BG,
          border: "1px solid",
          borderColor: dragOver ? column.color + "60" : BORDER,
          borderRadius: "14px",
          padding: "14px",
          display: "flex",
          flexDirection: "column",
          minHeight: "200px",
          transition: "border-color 0.2s ease",
          boxShadow: dragOver ? "0 0 20px " + column.color + "20" : "none",
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
          onDragOver(e);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          setDragOver(false);
          onDrop(e, column.id);
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "14px",
            paddingBottom: "12px",
            borderBottom: "1px solid " + BORDER,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: column.color,
                boxShadow: "0 0 8px " + column.color + "80",
              }}
            />
            <span
              style={{
                fontSize: "13px",
                fontWeight: "700",
                color: TEXT_MAIN,
                letterSpacing: "0.3px",
              }}
            >
              {column.label}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                fontSize: "10px",
                fontWeight: "700",
                color: column.color,
                background: column.color + "20",
                border: "1px solid " + column.color + "40",
                borderRadius: "20px",
                padding: "2px 8px",
              }}
            >
              {column.prospects.length}
            </span>
          </div>
        </div>

        <div
          style={{
            fontSize: "11px",
            color: TEXT_GOLD,
            fontWeight: "600",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span style={{ color: TEXT_MUTED, fontWeight: "400" }}>Total :</span>
          {getTotalValue(column.prospects)}
        </div>

        <div style={{ flex: 1 }}>
          {column.prospects.map((p) => (
            <ProspectCard
              key={p.id}
              prospect={p}
              columnColor={column.color}
              onDragStart={onDragStart}
            />
          ))}
          {column.prospects.length === 0 && (
            <div
              style={{
                border: "2px dashed " + column.color + "30",
                borderRadius: "10px",
                padding: "24px 16px",
                textAlign: "center",
                color: TEXT_MUTED,
                fontSize: "12px",
              }}
            >
              Déposer ici
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CRMPipeline() {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [draggingId, setDraggingId] = useState<number | null>(null);

  const totalDeals = columns.reduce((acc, c)