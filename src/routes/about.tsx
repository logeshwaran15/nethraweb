import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Gift,
  Heart,
  Leaf,
  PenTool,
  Sparkles,
  Truck,
  type LucideIcon,
} from "lucide-react";
import aboutsHero from "@/assets/abouts.png";
import { Screen } from "@/components/shop/AppChrome";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api";
import { usePageSeo } from "@/lib/use-page-seo";

type AboutRow = {
  Heading: string | null;
  Subheading: string | null;
  Body: string | null;
  ImagePath: string | null;
  Stat1Label: string | null;
  Stat1Value: string | null;
  Stat2Label: string | null;
  Stat2Value: string | null;
  Stat3Label: string | null;
  Stat3Value: string | null;
};

const DEFAULT_BODY =
  "Nethra's started as a small passion project for beautiful mehandi stencils that " +
  "make intricate designs achievable for everyone — no artist required.\n\n" +
  "Every stencil and accessory in our collection is chosen for quality, comfort, and the " +
  "little bit of celebration it brings to your day.";

const FEATURES: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Sparkles,
    title: "Thoughtfully Handpicked",
    text: "Carefully selected stencils and accessories for quality and ease of use.",
  },
  {
    icon: Heart,
    title: "Made for Every Celebration",
    text: "Designs that bring beauty to everyday moments and special occasions.",
  },
  {
    icon: Truck,
    title: "Delivered Across India",
    text: "Handcrafted collections delivered to customers across India.",
  },
];

const JOURNEY: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Leaf,
    title: "Inspired by Tradition",
    text: "We draw inspiration from the beauty of mehandi art.",
  },
  {
    icon: PenTool,
    title: "Thoughtful Design",
    text: "Stencil designs made approachable and easy to use.",
  },
  {
    icon: Heart,
    title: "Careful Selection",
    text: "We prioritize quality in every product we select.",
  },
  {
    icon: Gift,
    title: "Bringing Joy to You",
    text: "Our accessories help you celebrate special moments.",
  },
];

function Eyebrow({ children }: { children: string }) {
  return (
    <p className="text-label flex items-center gap-3 uppercase tracking-widest text-maroon-soft">
      {children}
      <span aria-hidden className="h-px w-10 bg-maroon-soft/50" />
    </p>
  );
}

export default function AboutPage() {
  const [about, setAbout] = useState<AboutRow | null>(null);

  useEffect(() => {
    apiGet<AboutRow>("/api/about_settings.php")
      .then(setAbout)
      .catch(() => setAbout(null));
  }, []);

  const heroTitle = about?.Heading?.trim() || "About Us";
  const body = about?.Body || DEFAULT_BODY;
  const paragraphs = body.split(/\n\s*\n/).filter(Boolean);
  const image = about?.ImagePath || null;
  usePageSeo(
    "About Us",
    about?.Subheading || (paragraphs[0] ? paragraphs[0].slice(0, 160) : null),
  );
  const stats = [
    { label: about?.Stat1Label, value: about?.Stat1Value },
    { label: about?.Stat2Label, value: about?.Stat2Value },
    { label: about?.Stat3Label, value: about?.Stat3Value },
  ].filter((s): s is { label: string; value: string } => !!s.label && !!s.value);

  return (
    <Screen title="About Us" back>
      <div className="overflow-x-hidden bg-[#FFF9F4]">
        {/* Hero */}
        <section>
          <h1 className="sr-only">{heroTitle}</h1>
          <Link to="/categories" aria-label="Explore Our Collection" className="block">
            <img
              src={aboutsHero}
              alt="About Nethra's - Made with Love, Inspired by Tradition"
              className="block h-auto w-full"
            />
          </Link>
        </section>

        {/* Our Story */}
        <section className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            {image && (
              <img
                src={image}
                alt="Mehandi stencils and accessories"
                className="aspect-[4/3] w-full rounded-3xl border border-[#F0D8D5] object-cover shadow-[var(--shadow-card)]"
              />
            )}
            <div className={`min-w-0 ${image ? "" : "lg:col-span-2 mx-auto max-w-3xl"}`}>
              <Eyebrow>Our Story</Eyebrow>
              <h2 className="text-h1 mt-3 break-words text-[clamp(1.6rem,4vw,2.5rem)] text-primary">
                A Little Story Behind Every Design
              </h2>
              <div className="mt-4 max-w-prose space-y-4">
                {paragraphs.map((p, i) => (
                  <p key={i} className="break-words leading-relaxed text-foreground">
                    {p}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {stats.length > 0 && (
            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-[#F0D8D5] bg-white p-5 text-center shadow-[var(--shadow-card)]"
                >
                  <p className="text-h1 text-primary">{s.value}</p>
                  <p className="text-caption mt-1 text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Feature cards */}
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="flex items-start gap-4 rounded-2xl border border-[#F0D8D5] bg-[#FCE9E6]/70 p-5 transition-shadow hover:shadow-[var(--shadow-card)]"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-h3 text-primary">{title}</h3>
                  <p className="text-caption mt-1 text-muted-foreground">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Brand journey */}
        <section className="bg-[#FCE9E6]/70 px-4 py-10 md:px-8 md:py-14">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:flex lg:items-start lg:gap-4">
            {JOURNEY.map(({ icon: Icon, title, text }, i) => (
              <Fragment key={title}>
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-primary shadow-sm">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-caption font-semibold text-maroon-soft">
                      {String(i + 1).padStart(2, "0")}
                    </p>
                    <h3 className="text-h3 text-primary">{title}</h3>
                    <p className="text-caption mt-1 text-muted-foreground">{text}</p>
                  </div>
                </div>
                {i < JOURNEY.length - 1 && (
                  <ArrowRight
                    aria-hidden
                    className="mt-4 hidden h-5 w-5 shrink-0 text-maroon-soft/60 lg:block"
                  />
                )}
              </Fragment>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-gradient-to-b from-[#FCE9E6] to-[#FFF9F4] px-4 py-12 text-center md:py-16">
          <h2 className="text-h1 mx-auto max-w-2xl break-words text-[clamp(1.5rem,4vw,2.25rem)] text-primary">
            Bring a Little Tradition to Every Moment
          </h2>
          <p className="text-body-lg mx-auto mt-3 max-w-xl text-muted-foreground">
            Discover stencils and accessories made to make every celebration a little more special.
          </p>
          <Button asChild variant="brand" size="ctaLg" className="mt-6 min-h-11">
            <Link to="/categories">
              Explore Our Collection <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </section>
      </div>
    </Screen>
  );
}
