import { useId, type ReactNode } from "react";

interface FormSectionProps {
  title: string;
  children: ReactNode;
}

/**
 * A titled group of form fields, named by its title. Sections placed one after another are set off by a
 * divider (see `.form-section` in globals.css).
 *
 * @param props.title - Heading of the group, also its accessible name.
 * @param props.children - The fields of the group, stacked.
 */
export function FormSection({ title, children }: FormSectionProps) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className="form-section">
      <h3 id={titleId} className="form-section-title">
        {title}
      </h3>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}
