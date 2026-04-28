"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Video } from "lucide-react";
import type { Interview } from "../../types/interviews.types";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export function InterviewCalendar({ interviews }: { interviews: Interview[] }) {
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [selected, setSelected] = useState<Interview | null>(null);

  const days = useMemo(() => {
    const start = startOfMonth(month);
    const firstGridDate = new Date(start);
    firstGridDate.setDate(start.getDate() - start.getDay());

    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(firstGridDate);
      day.setDate(firstGridDate.getDate() + index);
      return day;
    });
  }, [month]);

  const byDay = useMemo(() => {
    return interviews.reduce<Record<string, Interview[]>>((acc, interview) => {
      const key = new Date(interview.scheduledAt).toDateString();
      acc[key] = [...(acc[key] ?? []), interview];
      return acc;
    }, {});
  }, [interviews]);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => setMonth(addMonths(month, -1))} aria-label="Previous month">
          <ChevronLeft size={16} />
        </button>
        <strong style={{ flex: 1 }}>
          {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </strong>
        <button onClick={() => setMonth(addMonths(month, 1))} aria-label="Next month">
          <ChevronRight size={16} />
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
          border: "1px solid var(--border-color, #e5e7eb)",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
          <div key={label} style={{ padding: 10, fontSize: 12, fontWeight: 600 }}>
            {label}
          </div>
        ))}
        {days.map((day) => {
          const dayInterviews = byDay[day.toDateString()] ?? [];
          const muted = day.getMonth() !== month.getMonth();
          return (
            <div
              key={day.toISOString()}
              style={{
                minHeight: 104,
                padding: 8,
                borderTop: "1px solid var(--border-color, #e5e7eb)",
                borderRight: "1px solid var(--border-color, #e5e7eb)",
                background: muted ? "var(--surface-muted, #fafafa)" : "transparent",
              }}
            >
              <div style={{ fontSize: 12, color: muted ? "#9ca3af" : "inherit" }}>
                {day.getDate()}
              </div>
              <div style={{ display: "grid", gap: 4, marginTop: 6 }}>
                {dayInterviews.slice(0, 3).map((interview) => (
                  <button
                    key={interview.id}
                    onClick={() => setSelected(interview)}
                    style={{
                      textAlign: "left",
                      border: 0,
                      borderRadius: 6,
                      padding: "5px 6px",
                      background: "var(--color-background-info, #eef2ff)",
                      color: "var(--text-primary, #111827)",
                      fontSize: 11,
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {new Date(interview.scheduledAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    {interview.candidate || interview.jobTitle}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div
          style={{
            border: "1px solid var(--border-color, #e5e7eb)",
            borderRadius: 8,
            padding: 14,
            display: "grid",
            gap: 8,
          }}
        >
          <strong>{selected.jobTitle}</strong>
          <span>{selected.candidate} · {selected.company}</span>
          <span>
            <Clock size={13} /> {new Date(selected.scheduledAt).toLocaleString()} ·{" "}
            {selected.duration} min
          </span>
          <span>
            <CalendarDays size={13} /> {selected.type} · {selected.status}
          </span>
          {selected.meetLink && (
            <a href={selected.meetLink}>
              <Video size={13} /> Meeting link
            </a>
          )}
          {selected.notes && <p>{selected.notes}</p>}
        </div>
      )}
    </div>
  );
}
