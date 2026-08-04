"use client";

import { TextAreaField } from "@/components/fields";

/**
 * The three narrative blocks from the paper form. Prompts are kept close to
 * the PDF's wording, trimmed of the parenthetical example lists that only
 * existed to fill a printed box — those move to `hint` so the field itself
 * stays scannable.
 */
export function StepSkills() {
  return (
    <div className="grid gap-5">
      <TextAreaField
        name="training"
        label="Have you completed any training or classes relevant to this job?"
        hint="For example: on-the-job safety training, military training, production training."
        rows={4}
      />

      <TextAreaField
        name="specialSkills"
        label="Do you have any special skills or experience relevant to this job?"
        hint="For example: operating plant or office machines, computer skills, warehouse work, maintaining or repairing machinery."
        rows={4}
      />

      <TextAreaField
        name="experienceAndActivities"
        label="What shows your desire and ability to advance or learn new skills?"
        hint="Any job experience, school, or other activities. We want employees to advance."
        rows={4}
      />
    </div>
  );
}
