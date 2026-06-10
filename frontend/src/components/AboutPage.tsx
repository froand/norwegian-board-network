import { useI18n } from '../I18nContext';

interface Props {
  onClose: () => void;
}

export default function AboutPage({ onClose }: Props) {
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-3 md:p-6">
      <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-xl border border-[var(--stortinget-border)] bg-white shadow-xl">
        <div className="sticky top-0 bg-white border-b border-[var(--stortinget-border)] px-4 py-3 md:px-5 md:py-4 flex items-start justify-between gap-3">
          <h2 className="text-lg md:text-xl font-bold text-[var(--stortinget-dark)]">{t('about.title')}</h2>
          <button
            onClick={onClose}
            className="text-[var(--stortinget-muted)] hover:text-[var(--stortinget-red)] text-xl leading-none"
            aria-label={t('about.close')}
          >
            ✕
          </button>
        </div>

        <div className="px-4 py-4 md:px-5 md:py-5 space-y-5 text-sm md:text-base text-[var(--stortinget-text)]">
          <section>
            <h3 className="font-semibold text-[var(--stortinget-dark)] mb-1">{t('about.what.title')}</h3>
            <p>{t('about.what.body')}</p>
          </section>

          <section>
            <h3 className="font-semibold text-[var(--stortinget-dark)] mb-2">{t('about.sources.title')}</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><a className="text-[var(--stortinget-navy)] hover:underline" href="https://www.brreg.no/" target="_blank" rel="noreferrer">Brreg Enhetsregisteret</a></li>
              <li><a className="text-[var(--stortinget-navy)] hover:underline" href="https://www.brreg.no/" target="_blank" rel="noreferrer">Brreg Regnskapsregisteret</a></li>
              <li><a className="text-[var(--stortinget-navy)] hover:underline" href="https://www.stortinget.no/" target="_blank" rel="noreferrer">Stortinget</a></li>
              <li><a className="text-[var(--stortinget-navy)] hover:underline" href="https://www.regjeringen.no/" target="_blank" rel="noreferrer">regjeringen.no</a></li>
              <li><a className="text-[var(--stortinget-navy)] hover:underline" href="https://www.proff.no/" target="_blank" rel="noreferrer">proff.no</a></li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-[var(--stortinget-dark)] mb-2">{t('about.method.title')}</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>{t('about.method.point1')}</li>
              <li>{t('about.method.point2')}</li>
              <li>{t('about.method.point3')}</li>
              <li>{t('about.method.point4')}</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-[var(--stortinget-dark)] mb-2">{t('about.limitations.title')}</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>{t('about.limitations.point1')}</li>
              <li>{t('about.limitations.point2')}</li>
              <li>{t('about.limitations.point3')}</li>
              <li>{t('about.limitations.point4')}</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-[var(--stortinget-dark)] mb-1">GitHub</h3>
            <a className="text-[var(--stortinget-navy)] hover:underline break-all" href="https://github.com/froand/norwegian-board-network" target="_blank" rel="noreferrer">
              {t('about.github')}
            </a>
          </section>

          <p className="text-[var(--stortinget-muted)]">{t('about.disclaimer')}</p>
        </div>
      </div>
    </div>
  );
}
