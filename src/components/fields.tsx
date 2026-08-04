"use client";

/**
 * Form field primitives bound to react-hook-form context.
 *
 * Every field here guarantees the same accessibility contract, so no individual
 * step has to remember it:
 *   - a real <label htmlFor> pointing at a real control id
 *   - aria-invalid when errored
 *   - aria-describedby wiring hint text and error text to the control
 *   - the error rendered in a role="alert" node so it announces on appearance
 *   - required communicated in text, never by a bare asterisk alone
 */
import * as React from "react";
import { Controller, useFormContext, type FieldPath } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ApplicationValues } from "@/lib/schema";

type Path = FieldPath<ApplicationValues>;

/** Reads `a.0.b` style paths out of the nested react-hook-form error tree. */
function errorAt(errors: unknown, path: string): string | undefined {
  const node = path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, errors);

  if (node && typeof node === "object" && "message" in node) {
    const message = (node as { message?: unknown }).message;
    return typeof message === "string" ? message : undefined;
  }
  return undefined;
}

export function useFieldError(name: string): string | undefined {
  const {
    formState: { errors },
  } = useFormContext<ApplicationValues>();
  return errorAt(errors, name);
}

/**
 * Checkboxes and radios have no meaningful blur, so an error on them would
 * otherwise sit there after the applicant has already fixed it. This clears
 * the error the moment a choice changes — but only once one is showing, so we
 * never validate a control the applicant hasn't answered yet.
 */
function useRevalidateOnChange(name: Path) {
  const { trigger } = useFormContext<ApplicationValues>();
  const hasError = Boolean(useFieldError(name));
  return React.useCallback(() => {
    if (hasError) void trigger(name);
  }, [hasError, trigger, name]);
}

/* ------------------------------------------------------------------ */
/* Shell                                                               */
/* ------------------------------------------------------------------ */

interface ShellProps {
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  /** Set when the control is a group (radio/checkbox set) rather than one input. */
  asFieldset?: boolean;
  children: (ids: {
    id: string;
    describedBy: string | undefined;
    invalid: boolean;
  }) => React.ReactNode;
}

export function FieldShell({
  name,
  label,
  hint,
  required,
  className,
  asFieldset,
  children,
}: ShellProps) {
  const error = useFieldError(name);
  const id = `f-${name.replace(/\./g, "-")}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const labelNode = (
    <span className="flex flex-wrap items-baseline gap-x-2">
      <span>{label}</span>
      {!required && (
        <span className="text-xs font-normal text-muted-foreground">
          Optional
        </span>
      )}
    </span>
  );

  const body = (
    <>
      {asFieldset ? (
        <legend className="mb-2 block text-sm font-medium">{labelNode}</legend>
      ) : (
        <Label htmlFor={id} className="mb-2 block text-sm font-medium">
          {labelNode}
        </Label>
      )}

      {hint && (
        <p id={hintId} className="mb-2 text-sm text-muted-foreground">
          {hint}
        </p>
      )}

      {children({ id, describedBy, invalid: Boolean(error) })}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-destructive"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="mt-0.5 size-3.5 shrink-0 fill-current"
          >
            <path d="M8 1.5 15 14H1L8 1.5Zm0 4.25a.75.75 0 0 0-.75.75v2.75a.75.75 0 0 0 1.5 0V6.5A.75.75 0 0 0 8 5.75Zm0 5.5a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8Z" />
          </svg>
          {error}
        </p>
      )}
    </>
  );

  if (asFieldset) {
    return (
      <fieldset className={cn("min-w-0", className)}>{body}</fieldset>
    );
  }
  return <div className={cn("min-w-0", className)}>{body}</div>;
}

/* ------------------------------------------------------------------ */
/* Text-like inputs                                                    */
/* ------------------------------------------------------------------ */

interface TextFieldProps {
  name: Path;
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  type?: "text" | "email" | "tel" | "month" | "date";
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  placeholder?: string;
  maxLength?: number;
}

export function TextField({
  name,
  label,
  hint,
  required,
  className,
  type = "text",
  inputMode,
  autoComplete,
  placeholder,
  maxLength,
}: TextFieldProps) {
  const { register } = useFormContext<ApplicationValues>();

  return (
    <FieldShell
      name={name}
      label={label}
      hint={hint}
      required={required}
      className={className}
    >
      {({ id, describedBy, invalid }) => (
        <Input
          id={id}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          placeholder={placeholder}
          maxLength={maxLength}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-11 bg-card",
            invalid && "border-destructive ring-2 ring-destructive/25",
          )}
          {...register(name)}
        />
      )}
    </FieldShell>
  );
}

/** Formats to (707) 443-7025 as the applicant types. */
export function PhoneField(props: Omit<TextFieldProps, "type">) {
  const { control } = useFormContext<ApplicationValues>();

  return (
    <FieldShell
      name={props.name}
      label={props.label}
      hint={props.hint}
      required={props.required}
      className={props.className}
    >
      {({ id, describedBy, invalid }) => (
        <Controller
          control={control}
          name={props.name}
          render={({ field }) => (
            <Input
              id={id}
              type="tel"
              inputMode="tel"
              autoComplete={props.autoComplete}
              placeholder="(707) 555-0123"
              aria-invalid={invalid || undefined}
              aria-describedby={describedBy}
              className={cn(
                "h-11 bg-card",
                invalid && "border-destructive ring-2 ring-destructive/25",
              )}
              value={typeof field.value === "string" ? field.value : ""}
              onBlur={field.onBlur}
              ref={field.ref}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                let formatted = digits;
                if (digits.length > 6) {
                  formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
                } else if (digits.length > 3) {
                  formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
                } else if (digits.length > 0) {
                  formatted = `(${digits}`;
                }
                field.onChange(formatted);
              }}
            />
          )}
        />
      )}
    </FieldShell>
  );
}

interface TextAreaFieldProps {
  name: Path;
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  rows?: number;
  placeholder?: string;
}

export function TextAreaField({
  name,
  label,
  hint,
  required,
  className,
  rows = 4,
  placeholder,
}: TextAreaFieldProps) {
  const { register } = useFormContext<ApplicationValues>();

  return (
    <FieldShell
      name={name}
      label={label}
      hint={hint}
      required={required}
      className={className}
    >
      {({ id, describedBy, invalid }) => (
        <Textarea
          id={id}
          rows={rows}
          placeholder={placeholder}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(
            "resize-y bg-card",
            invalid && "border-destructive ring-2 ring-destructive/25",
          )}
          {...register(name)}
        />
      )}
    </FieldShell>
  );
}

/* ------------------------------------------------------------------ */
/* Select                                                              */
/* ------------------------------------------------------------------ */

interface SelectFieldProps {
  name: Path;
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  placeholder?: string;
  options: readonly { value: string; label: string }[];
}

/**
 * A native <select>. Radix's Select is prettier, but on a phone the OS wheel
 * picker is faster, works offline of JS quirks, and is what this audience
 * already knows.
 */
export function SelectField({
  name,
  label,
  hint,
  required,
  className,
  placeholder = "Choose one",
  options,
}: SelectFieldProps) {
  const { register } = useFormContext<ApplicationValues>();

  return (
    <FieldShell
      name={name}
      label={label}
      hint={hint}
      required={required}
      className={className}
    >
      {({ id, describedBy, invalid }) => (
        <select
          id={id}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-11 w-full rounded-md border border-input bg-card px-3 text-base",
            "focus-visible:border-brand-green focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-green/35",
            invalid && "border-destructive ring-2 ring-destructive/25",
          )}
          {...register(name)}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </FieldShell>
  );
}

/* ------------------------------------------------------------------ */
/* Month + year                                                        */
/* ------------------------------------------------------------------ */

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
].map((label, i) => ({ value: String(i + 1).padStart(2, "0"), label }));

/** How far back the year list runs. Covers any plausible work history. */
const YEARS_BACK = 60;

interface MonthYearFieldProps {
  name: Path;
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
}

/**
 * Two dropdowns storing a single `YYYY-MM` string.
 *
 * Deliberately not `<input type="month">`: that control's typed format varies
 * by browser and locale — Chrome wants segments, Firefox falls back to a bare
 * text box — so an applicant typing "04/2020" or "April 2020" gets rejected
 * with no way to discover the format the field actually wants. Dropdowns have
 * no format to guess and no keyboard to fight on a phone.
 *
 * A half-answer is stored as a deliberately invalid marker so the schema can
 * tell "not started" apart from "half finished" and say so.
 */
export function MonthYearField({
  name,
  label,
  hint,
  required,
  className,
}: MonthYearFieldProps) {
  const { control } = useFormContext<ApplicationValues>();
  const revalidate = useRevalidateOnChange(name);
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: YEARS_BACK + 1 }, (_, i) =>
    String(thisYear - i),
  );

  const baseId = `f-${name.replace(/\./g, "-")}`;

  return (
    <FieldShell
      name={name}
      label={label}
      hint={hint}
      required={required}
      asFieldset
      className={className}
    >
      {({ describedBy, invalid }) => (
        <Controller
          control={control}
          name={name}
          render={({ field }) => {
            const raw = typeof field.value === "string" ? field.value : "";
            const [rawYear = "", rawMonth = ""] = raw.split("-");
            const year = /^\d{4}$/.test(rawYear) ? rawYear : "";
            const month = /^\d{2}$/.test(rawMonth) ? rawMonth : "";

            const write = (nextMonth: string, nextYear: string) => {
              if (nextMonth && nextYear) {
                field.onChange(`${nextYear}-${nextMonth}`);
              } else if (!nextMonth && !nextYear) {
                field.onChange("");
              } else {
                /*
                 * Half-answered: keep what they picked but stay invalid.
                 * The placeholders must be non-numeric ("0000" would satisfy
                 * the schema's YYYY-MM check and pass as the year 0) and must
                 * not contain "-", which is the separator this value is parsed
                 * back on.
                 */
                field.onChange(`${nextYear || "YYYY"}-${nextMonth || "MM"}`);
              }
              revalidate();
            };

            const selectClass = cn(
              "h-11 w-full min-w-0 rounded-md border border-input bg-card px-2 text-base",
              "focus-visible:border-brand-green focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-green/35",
              invalid && "border-destructive ring-2 ring-destructive/25",
            );

            return (
              <div className="flex gap-2" aria-describedby={describedBy}>
                <select
                  id={`${baseId}-month`}
                  aria-label={`${label} — month`}
                  aria-invalid={invalid || undefined}
                  className={selectClass}
                  value={month}
                  onBlur={field.onBlur}
                  onChange={(e) => write(e.target.value, year)}
                >
                  <option value="">Month</option>
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>

                <select
                  id={`${baseId}-year`}
                  aria-label={`${label} — year`}
                  aria-invalid={invalid || undefined}
                  className={cn(selectClass, "max-w-28")}
                  value={year}
                  onBlur={field.onBlur}
                  onChange={(e) => write(month, e.target.value)}
                >
                  <option value="">Year</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            );
          }}
        />
      )}
    </FieldShell>
  );
}

/* ------------------------------------------------------------------ */
/* Choice groups                                                       */
/* ------------------------------------------------------------------ */

/** Shared visual for a tappable choice tile. 44px minimum target. */
const tileClass = (checked: boolean) =>
  cn(
    "flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3.5 py-2.5 text-base transition-colors",
    "hover:bg-brand-green-tint",
    "has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-brand-green/45",
    checked
      ? "border-brand-green bg-brand-green-tint font-medium"
      : "border-input bg-card",
  );

interface YesNoFieldProps {
  name: Path;
  label: string;
  hint?: string;
  className?: string;
  yesLabel?: string;
  noLabel?: string;
}

export function YesNoField({
  name,
  label,
  hint,
  className,
  yesLabel = "Yes",
  noLabel = "No",
}: YesNoFieldProps) {
  const { control } = useFormContext<ApplicationValues>();
  const revalidate = useRevalidateOnChange(name);

  return (
    <FieldShell
      name={name}
      label={label}
      hint={hint}
      required
      asFieldset
      className={className}
    >
      {({ describedBy, invalid }) => (
        <Controller
          control={control}
          name={name}
          render={({ field }) => (
            <RadioGroup
              value={typeof field.value === "string" ? field.value : ""}
              onValueChange={(v) => {
                field.onChange(v);
                revalidate();
              }}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              className="flex flex-wrap gap-2"
            >
              {[
                { value: "yes", label: yesLabel },
                { value: "no", label: noLabel },
              ].map((option) => (
                <label
                  key={option.value}
                  className={cn(tileClass(field.value === option.value), "flex-1 min-w-28")}
                >
                  <RadioGroupItem
                    value={option.value}
                    className="size-5 shrink-0"
                  />
                  {option.label}
                </label>
              ))}
            </RadioGroup>
          )}
        />
      )}
    </FieldShell>
  );
}

interface RadioFieldProps {
  name: Path;
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  options: readonly string[];
}

export function RadioField({
  name,
  label,
  hint,
  required,
  className,
  options,
}: RadioFieldProps) {
  const { control } = useFormContext<ApplicationValues>();
  const revalidate = useRevalidateOnChange(name);

  return (
    <FieldShell
      name={name}
      label={label}
      hint={hint}
      required={required}
      asFieldset
      className={className}
    >
      {({ describedBy, invalid }) => (
        <Controller
          control={control}
          name={name}
          render={({ field }) => (
            <RadioGroup
              value={typeof field.value === "string" ? field.value : ""}
              onValueChange={(v) => {
                field.onChange(v);
                revalidate();
              }}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              className="grid gap-2 sm:grid-cols-2"
            >
              {options.map((option) => (
                <label key={option} className={tileClass(field.value === option)}>
                  <RadioGroupItem value={option} className="size-5 shrink-0" />
                  {option}
                </label>
              ))}
            </RadioGroup>
          )}
        />
      )}
    </FieldShell>
  );
}

interface CheckboxGroupProps {
  name: Path;
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  options: readonly string[];
  columns?: 1 | 2;
}

export function CheckboxGroupField({
  name,
  label,
  hint,
  required,
  className,
  options,
  columns = 2,
}: CheckboxGroupProps) {
  const { control } = useFormContext<ApplicationValues>();
  const revalidate = useRevalidateOnChange(name);

  return (
    <FieldShell
      name={name}
      label={label}
      hint={hint}
      required={required}
      asFieldset
      className={className}
    >
      {({ describedBy, invalid }) => (
        <Controller
          control={control}
          name={name}
          render={({ field }) => {
            const selected: string[] = Array.isArray(field.value)
              ? (field.value as string[])
              : [];
            return (
              <div
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
                className={cn(
                  "grid gap-2",
                  columns === 2 && "sm:grid-cols-2",
                )}
              >
                {options.map((option) => {
                  const checked = selected.includes(option);
                  return (
                    <label key={option} className={tileClass(checked)}>
                      <Checkbox
                        checked={checked}
                        className="size-5 shrink-0"
                        onCheckedChange={(next) => {
                          field.onChange(
                            next
                              ? [...selected, option]
                              : selected.filter((v) => v !== option),
                          );
                          revalidate();
                        }}
                      />
                      {option}
                    </label>
                  );
                })}
              </div>
            );
          }}
        />
      )}
    </FieldShell>
  );
}

interface ConsentFieldProps {
  name: Path;
  className?: string;
  children: React.ReactNode;
}

/** A single required checkbox with rich label content. */
export function ConsentField({ name, className, children }: ConsentFieldProps) {
  const { control } = useFormContext<ApplicationValues>();
  const revalidate = useRevalidateOnChange(name);
  const error = useFieldError(name);
  const id = `f-${name.replace(/\./g, "-")}`;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={className}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <label
            htmlFor={id}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
              "has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-brand-green/45",
              field.value
                ? "border-brand-green bg-brand-green-tint"
                : "border-input bg-card hover:bg-brand-green-tint/60",
              error && "border-destructive bg-destructive/5",
            )}
          >
            <Checkbox
              id={id}
              checked={field.value === true}
              onCheckedChange={(next) => {
                field.onChange(next === true);
                revalidate();
              }}
              aria-describedby={errorId}
              aria-invalid={Boolean(error) || undefined}
              className="mt-0.5 size-5 shrink-0"
            />
            <span className="text-sm leading-relaxed">{children}</span>
          </label>
        )}
      />
      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 text-sm font-medium text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  );
}
