/**
 * Shown on a registered portal address that cannot be used right now (ownership not verified, the
 * portal was disabled, or the organization's plan no longer includes it). Deliberately neutral: no
 * product name, no organization details.
 */
export default function PortalUnavailable() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-6">
      <section className="max-w-md rounded-2xl border bg-background p-8 text-center shadow-lg">
        <h1 className="text-xl font-semibold">This portal isn't available</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The address you opened is not active right now. Please contact the organization that gave you this link.
        </p>
      </section>
    </main>
  );
}
