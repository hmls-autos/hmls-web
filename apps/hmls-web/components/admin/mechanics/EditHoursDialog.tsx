"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdminMechanicAvailability } from "@/hooks/useAdminMechanics";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Slot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

function normalize(t: string) {
  return t.length >= 5 ? t.slice(0, 5) : t;
}

interface Props {
  mechanicId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditHoursDialog({ mechanicId, open, onOpenChange }: Props) {
  const { availability, saveAvailability } =
    useAdminMechanicAvailability(mechanicId);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSlots(
        availability.map((a) => ({
          dayOfWeek: a.dayOfWeek,
          startTime: normalize(a.startTime),
          endTime: normalize(a.endTime),
        })),
      );
      setError(null);
    }
  }, [open, availability]);

  function update(idx: number, patch: Partial<Slot>) {
    setSlots((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    );
  }

  function remove(idx: number) {
    setSlots((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    for (const s of slots) {
      if (s.endTime <= s.startTime) {
        setError("End time must be after start time");
        return;
      }
    }
    setIsSaving(true);
    setError(null);
    try {
      await saveAvailability(
        slots.map((s) => ({
          dayOfWeek: s.dayOfWeek,
          startTime:
            s.startTime.length === 5 ? `${s.startTime}:00` : s.startTime,
          endTime: s.endTime.length === 5 ? `${s.endTime}:00` : s.endTime,
        })),
      );
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Weekly hours</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {slots.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No hours set. Add a time range to start.
            </p>
          )}
          {slots.map((s, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: slots reorder only on user edits; keys map to row index
              key={i}
              className="flex items-center gap-2"
            >
              <select
                value={s.dayOfWeek}
                onChange={(e) =>
                  update(i, { dayOfWeek: Number(e.target.value) })
                }
                className="border border-border rounded-md px-2 py-1.5 text-sm bg-background"
              >
                {DAY_LABELS.map((label, idx) => (
                  <option key={label} value={idx}>
                    {label}
                  </option>
                ))}
              </select>
              <input
                type="time"
                value={s.startTime}
                onChange={(e) => update(i, { startTime: e.target.value })}
                className="border border-border rounded-md px-2 py-1.5 text-sm bg-background"
              />
              <span className="text-muted-foreground text-sm">to</span>
              <input
                type="time"
                value={s.endTime}
                onChange={(e) => update(i, { endTime: e.target.value })}
                className="border border-border rounded-md px-2 py-1.5 text-sm bg-background"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => remove(i)}
                className="text-muted-foreground hover:text-red-500"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setSlots((prev) => [
                ...prev,
                { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
              ])
            }
          >
            + Add time range
          </Button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
