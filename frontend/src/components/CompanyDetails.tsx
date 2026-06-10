import { useEffect, useState } from 'react';
import type { CompanyDetails as CompanyDetailsType, LiveBoardMember, PoliticalConnection } from '../services/api';
import { getCompanyDetails } from '../services/api';
import { useI18n } from '../I18nContext';
import { useDraggable } from '../hooks/useDraggable';

interface Props {
  orgNumber: string;
  companyName: string;
  onClose: () => void;
  onPersonClick: (personId: string) => void;
}

export default function CompanyDetails({ orgNumber, companyName, onClose, onPersonClick }: Props) {
  const { t, lang } = useI18n();
  const [details, setDetails] = useState<CompanyDetailsType | null>(null);
  const [loading, setLoading] = useState(true);
  const { position, handleMouseDown } = useDraggable({ x: window.innerWidth - 460, y: 20 });
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const panelClassName = isMobile
    ? 'fixed inset-x-0 bottom-0 max-h-[70vh] w-full rounded-t-xl border-t bg-[var(--stortinget-surface)] border-[var(--stortinget-border)] shadow-xl z-30 overflow-hidden flex flex-col'
    : 'w-[440px] max-w-[calc(100vw-16px)] bg-[var(--stortinget-surface)] border border-[var(--stortinget-border)] rounded-lg shadow-xl z-20 overflow-hidden';
  const panelStyle = isMobile ? undefined : { position: 'absolute' as const, left: position.x, top: position.y };
  const headerDrag = isMobile ? {} : { onMouseDown: handleMouseDown };
  const headerClass = `flex justify-between items-center p-4 border-b border-[var(--stortinget-border)] select-none ${isMobile ? '' : 'cursor-grab active:cursor-grabbing'}`;

  useEffect(() => {
    setLoading(true);
    getCompanyDetails(orgNumber)
      .then(setDetails)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [orgNumber]);

  if (loading) {
    return (
      <div className={panelClassName} style={panelStyle}>
        {isMobile && <div className="flex justify-center py-2"><div className="w-10 h-1 rounded-full bg-gray-300" /></div>}
        <div className={headerClass} {...headerDrag}>
          <h3 className="text-[var(--stortinget-dark)] font-semibold">{companyName}</h3>
          <button onClick={onClose} className="text-[var(--stortinget-muted)] hover:text-[var(--stortinget-dark)] text-lg">✕</button>
        </div>
        <div className="p-4 text-[var(--stortinget-muted)] text-sm">{t('company.loading')}</div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className={panelClassName} style={panelStyle}>
        {isMobile && <div className="flex justify-center py-2"><div className="w-10 h-1 rounded-full bg-gray-300" /></div>}
        <div className={headerClass} {...headerDrag}>
          <h3 className="text-[var(--stortinget-dark)] font-semibold">{companyName}</h3>
          <button onClick={onClose} className="text-[var(--stortinget-muted)] hover:text-[var(--stortinget-dark)] text-lg">✕</button>
        </div>
        <div className="p-4 text-[var(--stortinget-muted)] text-sm">{t('company.noDetails')}</div>
      </div>
    );
  }

  return (
    <div className={panelClassName} style={panelStyle}>
      {isMobile && <div className="flex justify-center py-2 flex-shrink-0"><div className="w-10 h-1 rounded-full bg-gray-300" /></div>}
      {/* Header */}
      <div
        className={headerClass}
        {...headerDrag}
      >
        <div>
          <h3 className="text-[var(--stortinget-dark)] font-semibold text-lg">{details.name}</h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 border border-green-200">
              {details.organizationForm}
            </span>
            {details.isStateOwned && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200"
                title={t('company.stateOwnedTooltip')}>
                {t('company.stateOwned')}
              </span>
            )}
            {details.isPubliclyListed && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200">
                {t('company.listed')}
              </span>
            )}
            {details.isBankrupt && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">
                {t('company.bankrupt')}
              </span>
            )}
            {details.isDeleted && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-300">
                {lang === 'no' ? 'Slettet' : 'Deleted'} {details.deletedDate || ''}
              </span>
            )}
          </div>
        </div>
        <button onClick={onClose} className="text-[var(--stortinget-muted)] hover:text-[var(--stortinget-dark)] text-lg">✕</button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
        {/* Not found in Brreg notice */}
        {details.notFoundInBrreg && (
          <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm">
            <p className="text-amber-800 font-medium mb-1">
              {lang === 'no' ? 'Ikke funnet i Enhetsregisteret' : 'Not found in business registry'}
            </p>
            <p className="text-amber-700 text-xs mb-2">
              {lang === 'no'
                ? 'Organisasjonen kan være slettet, slått sammen, eller ha byttet organisasjonsnummer.'
                : 'The organization may have been deleted, merged, or changed its org number.'}
            </p>
            {details.brregUrl && (
              <a href={details.brregUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline">
                🔗 {lang === 'no' ? 'Søk i Brønnøysundregistrene' : 'Search Brreg'} →
              </a>
            )}
          </div>
        )}

        {/* Brreg link for found companies */}
        {!details.notFoundInBrreg && details.brregUrl && (
          <a href={details.brregUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline block">
            🔗 {lang === 'no' ? 'Se i Brønnøysundregistrene' : 'View in Brreg'} →
          </a>
        )}

        {/* Entanglement Score */}
        {details.entanglementScore > 0 && (
          <EntanglementScoreBar score={details.entanglementScore} lang={lang} />
        )}

        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-3">
          {details.employees != null && (
            <MetricCard label={t('company.employees')} value={details.employees.toLocaleString(lang === 'no' ? 'nb-NO' : 'en-US')} icon="👥" />
          )}
          {details.founded && (
            <MetricCard label={t('company.founded')} value={formatDate(details.founded, lang)} icon="📅" />
          )}
          {details.stateOwnershipPercent != null && (
            <MetricCard
              label={lang === 'no' ? 'Statlig eierandel' : 'State ownership'}
              value={`${details.stateOwnershipPercent}%`}
              icon="🏛️"
            />
          )}
          {details.lastAnnualReport && (
            <MetricCard label={t('company.lastReport')} value={details.lastAnnualReport} icon="📊" />
          )}
        </div>

        {/* Financials */}
        {details.financials && (
          <div>
            <h4 className="text-xs font-semibold text-[var(--stortinget-muted)] uppercase mb-1">
              {lang === 'no' ? `Regnskap ${details.financials.year}` : `Financials ${details.financials.year}`}
              <span className="text-[10px] font-normal ml-1 text-[var(--stortinget-muted)]">({details.financials.currency})</span>
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {details.financials.revenue != null && (
                <div className="bg-[var(--stortinget-surface-muted)] rounded px-2 py-1.5 border border-[var(--stortinget-border)]">
                  <div className="text-[10px] text-[var(--stortinget-muted)]">{lang === 'no' ? 'Driftsinntekter' : 'Revenue'}</div>
                  <div className="text-sm font-semibold text-[var(--stortinget-dark)]">{formatAmount(details.financials.revenue, lang)}</div>
                </div>
              )}
              {details.financials.operatingResult != null && (
                <div className="bg-[var(--stortinget-surface-muted)] rounded px-2 py-1.5 border border-[var(--stortinget-border)]">
                  <div className="text-[10px] text-[var(--stortinget-muted)]">{lang === 'no' ? 'Driftsresultat' : 'Operating result'}</div>
                  <div className={`text-sm font-semibold ${details.financials.operatingResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatAmount(details.financials.operatingResult, lang)}
                  </div>
                </div>
              )}
              {details.financials.netIncome != null && (
                <div className="bg-[var(--stortinget-surface-muted)] rounded px-2 py-1.5 border border-[var(--stortinget-border)]">
                  <div className="text-[10px] text-[var(--stortinget-muted)]">{lang === 'no' ? 'Årsresultat' : 'Net income'}</div>
                  <div className={`text-sm font-semibold ${details.financials.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatAmount(details.financials.netIncome, lang)}
                  </div>
                </div>
              )}
              {details.financials.totalAssets != null && (
                <div className="bg-[var(--stortinget-surface-muted)] rounded px-2 py-1.5 border border-[var(--stortinget-border)]">
                  <div className="text-[10px] text-[var(--stortinget-muted)]">{lang === 'no' ? 'Eiendeler' : 'Total assets'}</div>
                  <div className="text-sm font-semibold text-[var(--stortinget-dark)]">{formatAmount(details.financials.totalAssets, lang)}</div>
                </div>
              )}
              {details.financials.equity != null && (
                <div className="bg-[var(--stortinget-surface-muted)] rounded px-2 py-1.5 border border-[var(--stortinget-border)]">
                  <div className="text-[10px] text-[var(--stortinget-muted)]">{lang === 'no' ? 'Egenkapital' : 'Equity'}</div>
                  <div className="text-sm font-semibold text-[var(--stortinget-dark)]">{formatAmount(details.financials.equity, lang)}</div>
                </div>
              )}
              {details.financials.totalDebt != null && (
                <div className="bg-[var(--stortinget-surface-muted)] rounded px-2 py-1.5 border border-[var(--stortinget-border)]">
                  <div className="text-[10px] text-[var(--stortinget-muted)]">{lang === 'no' ? 'Gjeld' : 'Debt'}</div>
                  <div className="text-sm font-semibold text-[var(--stortinget-dark)]">{formatAmount(details.financials.totalDebt, lang)}</div>
                </div>
              )}
            </div>
            <div className="text-[10px] text-[var(--stortinget-muted)] mt-1">
              {lang === 'no' ? 'Kilde: Brønnøysundregistrene' : 'Source: Brønnøysundregistrene'}
            </div>
          </div>
        )}

        {/* Industry */}
        {details.industry.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-[var(--stortinget-muted)] uppercase mb-1">{t('company.industry')}</h4>
            <div className="space-y-1">
              {details.industry.map((ind, i) => (
                <div key={i} className="text-sm text-[var(--stortinget-text)] bg-[var(--stortinget-surface-muted)] px-2 py-1 rounded">
                  {ind}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Purpose */}
        {details.purpose && (
          <div>
            <h4 className="text-xs font-semibold text-[var(--stortinget-muted)] uppercase mb-1">{t('company.purpose')}</h4>
            <p className="text-sm text-[var(--stortinget-text)] leading-relaxed">{details.purpose}</p>
          </div>
        )}

        {/* Political Connections */}
        {details.politicalConnections.length > 0 && (
          <PoliticalConnectionsSection
            connections={details.politicalConnections}
            revolvingDoorCount={details.revolvingDoorCount}
            lang={lang}
          />
        )}

        {/* Live board members */}
        {details.liveBoard.length > 0 && (
          <BoardMembersSection
            members={details.liveBoard}
            lang={lang}
            onPersonClick={onPersonClick}
          />
        )}

        {/* Contact info */}
        <div className="pt-2 border-t border-[var(--stortinget-border)] space-y-1.5">
          {details.location && (
            <InfoRow icon="📍" label={t('company.address')} value={details.location} />
          )}
          {details.website && (
            <InfoRow
              icon="🌐"
              label={t('company.website')}
              value={details.website}
              href={details.website.startsWith('http') ? details.website : `https://${details.website}`}
            />
          )}
          {details.phone && (
            <InfoRow icon="📞" label={t('company.phone')} value={details.phone} />
          )}
          <InfoRow icon="🔢" label={t('company.orgNr')} value={details.orgNumber} />
          {details.stateOwnershipSource && (
            <InfoRow icon="🏛️" label={lang === 'no' ? 'Eier' : 'Owner'} value={details.stateOwnershipSource} />
          )}
        </div>

        {/* State ownership warning */}
        {details.isStateOwned && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
            <div className="text-xs font-semibold text-amber-700 mb-1">
              {t('company.conflictRelevance')}
            </div>
            <p className="text-xs text-amber-600">
              {t('company.conflictExplain')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function BoardMembersSection({
  members,
  lang,
  onPersonClick,
}: {
  members: LiveBoardMember[];
  lang: string;
  onPersonClick: (personId: string) => void;
}) {
  return (
    <div className="pt-2 border-t border-gray-200">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-xs font-semibold text-gray-500 uppercase">
          {lang === 'no' ? 'Styre og ledelse' : 'Board and management'}
        </h4>
        <span className="text-xs text-gray-400">
          {members.length} {lang === 'no' ? 'roller' : 'roles'}
        </span>
      </div>
      <div className="space-y-1.5">
        {members.map((member, index) => (
          <div key={`${member.name}-${member.role}-${index}`} className="flex items-center justify-between text-sm bg-gray-50 border border-gray-200 rounded px-2 py-1.5">
            {member.personId ? (
              <button
                type="button"
                onClick={() => onPersonClick(member.personId!)}
                className="font-medium text-blue-700 hover:underline text-left"
              >
                {member.name}
              </button>
            ) : (
              <span className="font-medium text-gray-900">{member.name}</span>
            )}
            <span className="text-xs text-gray-500">{member.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EntanglementScoreBar({ score, lang }: { score: number; lang: string }) {
  const getColor = (s: number) => {
    if (s >= 70) return { bg: 'bg-red-500', text: 'text-red-600', border: 'border-red-700/50', bgFill: 'bg-red-900/30' };
    if (s >= 40) return { bg: 'bg-amber-500', text: 'text-amber-700', border: 'border-amber-700/50', bgFill: 'bg-amber-900/30' };
    return { bg: 'bg-green-500', text: 'text-green-300', border: 'border-green-700/50', bgFill: 'bg-green-900/30' };
  };

  const colors = getColor(score);
  const label = lang === 'no' ? 'Politisk innflytelsesgrad' : 'Political Entanglement Score';
  const levelLabel = score >= 70
    ? (lang === 'no' ? 'Høy' : 'High')
    : score >= 40
      ? (lang === 'no' ? 'Middels' : 'Medium')
      : (lang === 'no' ? 'Lav' : 'Low');

  return (
    <div className={`${colors.bgFill} border ${colors.border} rounded-lg p-3`}>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-semibold text-[var(--stortinget-text)]">{label}</span>
        <span className={`text-xs font-bold ${colors.text}`}>{score}/100 ({levelLabel})</span>
      </div>
      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors.bg} rounded-full transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function PoliticalConnectionsSection({
  connections,
  revolvingDoorCount,
  lang,
}: {
  connections: PoliticalConnection[];
  revolvingDoorCount: number;
  lang: string;
}) {
  const title = lang === 'no' ? 'Politiske forbindelser' : 'Political Connections';
  const rdLabel = lang === 'no' ? 'Svingdør-tilfeller' : 'Revolving door cases';

  return (
    <div className="pt-2 border-t border-[var(--stortinget-border)]">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-xs font-semibold text-[var(--stortinget-muted)] uppercase">{title}</h4>
        <span className="text-xs text-[var(--stortinget-muted)]">{connections.length} {lang === 'no' ? 'personer' : 'people'}</span>
      </div>

      {revolvingDoorCount > 0 && (
        <div className="flex items-center gap-1.5 mb-2 px-2 py-1 bg-red-50 border border-red-200 rounded text-xs text-red-600">
          <span>🚪</span>
          <span>{rdLabel}: <strong>{revolvingDoorCount}</strong></span>
        </div>
      )}

      <div className="space-y-2">
        {connections.map((conn, i) => (
          <ConnectionCard key={i} connection={conn} lang={lang} />
        ))}
      </div>
    </div>
  );
}

function ConnectionCard({ connection, lang }: { connection: PoliticalConnection; lang: string }) {
  const yearRange = connection.endYear
    ? `${connection.startYear}–${connection.endYear}`
    : `${connection.startYear}–${lang === 'no' ? 'nå' : 'present'}`;

  const categoryColors: Record<string, string> = {
    board: 'bg-blue-900/50 text-blue-300 border-blue-700/50',
    executive: 'bg-purple-100 text-purple-700 border-purple-200',
    political: 'bg-green-900/50 text-green-300 border-green-700/50',
    government: 'bg-amber-900/50 text-amber-700 border-amber-700/50',
  };

  const categoryLabels: Record<string, Record<string, string>> = {
    board: { no: 'Styre', en: 'Board' },
    executive: { no: 'Ledelse', en: 'Executive' },
    political: { no: 'Politisk', en: 'Political' },
    government: { no: 'Regjering', en: 'Government' },
  };

  return (
    <div className="bg-[var(--stortinget-surface-muted)] border border-[var(--stortinget-border)] rounded-lg p-2.5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--stortinget-dark)] font-medium truncate">{connection.personName}</span>
            {connection.isRevolvingDoor && (
              <span className="text-xs" title={lang === 'no' ? 'Svingdør' : 'Revolving door'}>🚪</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-[var(--stortinget-muted)]">{connection.role}</span>
            <span className="text-[10px] text-[var(--stortinget-muted)]">{yearRange}</span>
          </div>
          {connection.previousPoliticalRole && (
            <div className="text-[10px] text-red-600 mt-0.5 italic">
              ← {lang === 'no' ? 'Tidl.' : 'Former'}: {connection.previousPoliticalRole}
            </div>
          )}
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${categoryColors[connection.category] || ''}`}>
          {categoryLabels[connection.category]?.[lang] || connection.category}
        </span>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-[var(--stortinget-surface-muted)] rounded-lg p-2 border border-[var(--stortinget-border)]">
      <div className="text-[10px] text-[var(--stortinget-muted)] uppercase">{icon} {label}</div>
      <div className="text-sm text-[var(--stortinget-dark)] font-medium mt-0.5">{value}</div>
    </div>
  );
}

function InfoRow({ icon, label, value, href }: { icon: string; label: string; value: string; href?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-xs">{icon}</span>
      <span className="text-[var(--stortinget-muted)]">{label}:</span>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
          {value}
        </a>
      ) : (
        <span className="text-[var(--stortinget-text)] truncate">{value}</span>
      )}
    </div>
  );
}

function formatDate(dateStr: string, lang: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(lang === 'no' ? 'nb-NO' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatAmount(amount: number, lang: string): string {
  const locale = lang === 'no' ? 'nb-NO' : 'en-US';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toLocaleString(locale, { maximumFractionDigits: 1 })} mrd`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toLocaleString(locale, { maximumFractionDigits: 0 })} mill`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toLocaleString(locale, { maximumFractionDigits: 0 })} tusen`;
  return amount.toLocaleString(locale);
}
