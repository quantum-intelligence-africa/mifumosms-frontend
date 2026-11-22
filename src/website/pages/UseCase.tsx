import { useParams, Navigate } from "react-router-dom";
import { ButtonLink, H2, Section, SitePage, Tag } from "../Layout";
import { Reveal } from "../Reveal";
import { useSiteLang } from "../i18n";
import { useUseCase } from "./useCases";
import { Faqs } from "./Home";

/**
 * One industry use-case page, rendered from the `useCases` config. Transport has
 * its own richer page (sample call, photos), so it is redirected away from here;
 * every other industry shares this layout. Adding an industry is a config change.
 */
export default function UseCase() {
  const { tr } = useSiteLang();
  const { slug } = useParams();
  const uc = useUseCase(slug);

  if (!uc) return <Navigate to="/use-cases/transport" replace />;
  if (uc.bespoke) return <Navigate to={`/use-cases/${uc.slug}`} replace />;

  const Icon = uc.icon;
  const demoLink = `/book-demo?usecase=${uc.slug}&source=usecase-${uc.slug}`;

  return (
    <SitePage title={`${uc.industry} — SENDA`}>
      <section className="bg-white" aria-labelledby="usecase-title">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-14 pt-12 sm:px-6 lg:grid-cols-2 lg:items-center lg:pb-20 lg:pt-16">
          <div>
            <Tag>{uc.industry}</Tag>
            <h1 id="usecase-title" className="mt-4 text-4xl font-extrabold leading-[1.08] tracking-tight text-[#0B1B3F] sm:text-5xl">
              {uc.title}
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-[#4B5565]">{uc.intro}.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink to={demoLink}>{tr("Book a demo", "Omba onyesho")}</ButtonLink>
              <ButtonLink to="/products/call-center" variant="secondary">
                {tr("Explore Call Center", "Angalia Kituo cha Simu")}
              </ButtonLink>
            </div>
          </div>
          <div className="flex aspect-[3/2] items-center justify-center rounded-3xl bg-[radial-gradient(120%_120%_at_0%_0%,#DCE8FF_0%,#EEF3FF_40%,#F7F1FB_75%,#FDF2F4_100%)]">
            <Icon className="h-24 w-24 text-[#2563EB]" aria-hidden strokeWidth={1.5} />
          </div>
        </div>
      </section>

      <Section grey labelledBy="usecase-needs-title">
        <Reveal>
          <H2 id="usecase-needs-title">{tr("Built around how you work", "Imejengwa kulingana na jinsi unavyofanya kazi")}</H2>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {uc.needs.map(({ icon: NeedIcon, title, body }, i) => (
            <Reveal key={title} delay={i * 80}>
              <div className="h-full rounded-2xl border border-[#E3E7EE] bg-white p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#2563EB]">
                  <NeedIcon className="h-6 w-6" aria-hidden />
                </span>
                <h3 className="mt-5 text-xl font-semibold text-[#0B1B3F]">{title}</h3>
                <p className="mt-2 leading-relaxed text-[#4B5565]">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section labelledBy="usecase-cta-title">
        <Reveal>
          <div className="rounded-3xl border border-[#E3E7EE] bg-[#F5F6F8] px-6 py-12 text-center sm:px-12">
            <H2 id="usecase-cta-title">{uc.ctaTitle}</H2>
            <div className="mt-8 flex justify-center">
              <ButtonLink to={demoLink}>{tr("Book a demo", "Omba onyesho")}</ButtonLink>
            </div>
          </div>
        </Reveal>
      </Section>

      <Faqs />
    </SitePage>
  );
}
