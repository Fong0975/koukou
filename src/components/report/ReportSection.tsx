import { useId, type ReactNode } from "react";

/**
 * Titled panel of the annual report.
 *
 * @param props.title - Heading, also the section's accessible name.
 * @param props.children - The section's content.
 */
export function ReportSection({ title, children }: { title: string; children: ReactNode }) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className="report-panel p-4 sm:p-5">
      <h3 id={titleId} className="mb-3 text-base">
        {title}
      </h3>
      {children}
    </section>
  );
}
