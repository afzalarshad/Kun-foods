export function BehindTheScenes() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <span className="inline-block rounded-full bg-cream-dark px-4 py-1.5 text-sm font-semibold font-heading text-chili">
            Behind the scenes
          </span>
          <h2 className="mt-5 font-heading text-3xl font-extrabold sm:text-4xl">
            Made in small batches, by hand.
          </h2>
          <p className="mt-4 max-w-lg text-ink-soft">
            From stone-grinding whole spices to hand-curing every jar of pickle, nothing at Kun
            Foods is rushed. Here&apos;s a look at how your order actually gets made.
          </p>
        </div>

        {/* Video placeholder -- swap the inner content for a real <video>/embed once production
            footage is ready. */}
        <div className="relative aspect-video overflow-hidden rounded-3xl bg-ink shadow-lg">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-ink via-ink to-chili-dark/60 text-cream">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-cream/15 text-3xl backdrop-blur">
              ▶
            </span>
            <p className="text-sm font-medium text-cream/70">Production video coming soon</p>
          </div>
        </div>
      </div>
    </section>
  );
}
