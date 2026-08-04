"use client";

import { PhoneField, SelectField, TextField } from "@/components/fields";
import { US_STATES } from "@/lib/us-states";

const stateOptions = US_STATES.map((s) => ({ value: s.code, label: s.name }));

export function StepPersonal() {
  return (
    <div className="grid gap-5">
      {/* First / Middle / Last on one line, matching how a name is written. */}
      <div className="grid gap-4 sm:grid-cols-[1fr_7rem_1fr]">
        <TextField
          name="firstName"
          label="First name"
          required
          autoComplete="given-name"
          maxLength={50}
        />
        <TextField
          name="middleName"
          label="Middle"
          autoComplete="additional-name"
          maxLength={50}
        />
        <TextField
          name="lastName"
          label="Last name"
          required
          autoComplete="family-name"
          maxLength={50}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <PhoneField
          name="primaryPhone"
          label="Primary phone"
          required
          autoComplete="tel"
        />
        <PhoneField
          name="secondaryPhone"
          label="Other phone"
          autoComplete="tel-national"
        />
      </div>

      <TextField
        name="email"
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="email"
        hint="We'll use this to confirm we received your application."
        placeholder="you@example.com"
      />

      <TextField
        name="mailingAddress"
        label="Mailing address"
        required
        autoComplete="street-address"
        placeholder="Street address"
      />

      <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
        <TextField name="city" label="City" required autoComplete="address-level2" />
        <SelectField
          name="state"
          label="State"
          required
          options={stateOptions}
          placeholder="State"
          className="sm:w-44"
        />
        <TextField
          name="zipCode"
          label="ZIP code"
          required
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={10}
          className="sm:w-40"
        />
      </div>
    </div>
  );
}
