"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Mechanic } from "@/hooks/useAdminMechanics";

interface Props {
  mechanic: Mechanic;
  onSave: (patch: Partial<Mechanic>) => Promise<void>;
  onCancel: () => void;
}

export function EditProfileForm({ mechanic, onSave, onCancel }: Props) {
  const [name, setName] = useState(mechanic.name);
  const [email, setEmail] = useState(mechanic.email ?? "");
  const [phone, setPhone] = useState(mechanic.phone ?? "");
  const [timezone, setTimezone] = useState(mechanic.timezone);
  const [radius, setRadius] = useState(
    String(mechanic.serviceRadiusMiles ?? ""),
  );
  const [lat, setLat] = useState(mechanic.homeBaseLat ?? "");
  const [lng, setLng] = useState(mechanic.homeBaseLng ?? "");
  const [specialties, setSpecialties] = useState(
    Array.isArray(mechanic.specialties)
      ? (mechanic.specialties as string[]).join(", ")
      : "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        timezone: timezone.trim(),
        serviceRadiusMiles: radius ? Number(radius) : null,
        homeBaseLat: lat || null,
        homeBaseLng: lng || null,
        specialties: specialties
          ? specialties
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="ep-name">Name</Label>
        <Input
          id="ep-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="ep-email">Email</Label>
          <Input
            id="ep-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ep-phone">Phone</Label>
          <Input
            id="ep-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="ep-tz">Timezone</Label>
          <Input
            id="ep-tz"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ep-radius">Service radius (miles)</Label>
          <Input
            id="ep-radius"
            type="number"
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="ep-lat">Home base lat</Label>
          <Input
            id="ep-lat"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ep-lng">Home base lng</Label>
          <Input
            id="ep-lng"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="ep-spec">Specialties (comma-separated)</Label>
        <Input
          id="ep-spec"
          value={specialties}
          onChange={(e) => setSpecialties(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
