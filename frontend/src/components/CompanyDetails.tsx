import { useEffect, useState } from 'react';
import type { CompanyDetails as CompanyDetailsType } from '../services/api';
import { getCompanyDetails } from '../services/api';
import { useI18n } from '../I18nContext';
import { useDraggable } from '../hooks/useDraggable';

interface Props {
  orgNumber: string;
  companyName: string;
  onClose: () => void;
}

export default function CompanyDetails({ orgNumber, companyName, onClose }: Props) {
  const { t, lang } = useI18n();
  const [details, setDetails] = useState<CompanyDetailsType | null>(null);
  const [loading, setLoading] = useState(true);
  const { position, handleMouseDown } = useDraggable({ x: window.innerWidth - 420, y: window.innerHeight - 400 });
  const panelClassName = 'w-[400px] bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-20 overflow-hidden';
  const panelStyle = { position: 'absolute' as const, left: position.x, top: position.y };

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
        <div
          className="flex justify-between items-center p-4 border-b border-slate-700 cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
        >
          <h3 className="text-white font-semibold">{companyName}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">✕</button>
        </div>
        <div className="p-4 text-slate-400 text-sm">{t('company.loading')}</div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className={panelClassName} style={panelStyle}>
        <div
          className="flex justify-between items-center p-4 border-b border-slate-700 cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
        >
          <h3 className="text-white font-semibold">{companyName}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">✕</button>
        </div>
        <div className="p-4 text-slate-400 text-sm">{t('company.noDetails')}</div>
      </div>
    );
  }

  return (
    <div className={panelClassName} style={panelStyle}>
      {/* Header */}
      <div
        className="flex justify-between items-start p-4 border-b border-slate-700 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
      >
        <div>
          <h3 className="text-white font-semibold text-lg">{details.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-1.5 py-0.5 rounded bg-green-900/50 text-green-300 border border-green-700/50">
              {details.organizationForm}
            </span>
            {details.isStateOwned && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-amber-900/50 text-amber-300 border border-amber-700/50"
                title={t('company.stateOwnedTooltip')}>
                {t('company.stateOwned')}
              </span>
            )}
            {details.isPubliclyListed && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-blue-900/50 text-blue-300 border border-blue-700/50">
                {t('company.listed')}
              </span>
            )}
            {details.isBankrupt && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-red-900/50 text-red-300 border border-red-700/50">
                {t('company.bankrupt')}
              </span>
            )}
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">✕</button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-3">
          {details.employees && (
            <MetricCard label={t('company.employees')} value={details.employees.toLocaleString(lang === 'no' ? 'nb-NO' : 'en-US')} icon="👥" />
          )}
          {details.founded && (
            <MetricCard label={t('company.founded')} value={formatDate(details.founded, lang)} icon="📅" />
          )}
          {details.lastAnnualReport && (
            <MetricCard label={t('company.lastReport')} value={details.lastAnnualReport} icon="📊" />
          )}
          {details.ownershipSector && (
            <MetricCard label={t('company.sector')} value={details.ownershipSector} icon="🏢" />
          )}
        </div>

        {/* Industry */}
        {details.industry.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">{t('company.industry')}</h4>
            <div className="space-y-1">
              {details.industry.map((ind, i) => (
                <div key={i} className="text-sm text-slate-300 bg-slate-700/50 px-2 py-1 rounded">
                  {ind}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Purpose */}
        {details.purpose && (
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">{t('company.purpose')}</h4>
            <p className="text-sm text-slate-300 leading-relaxed">{details.purpose}</p>
          </div>
        )}

        {/* Contact info */}
        <div className="pt-2 border-t border-slate-700 space-y-1.5">
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
        </div>

        {/* State ownership warning */}
        {details.isStateOwned && (
          <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-3 mt-2">
            <div className="text-xs font-semibold text-amber-300 mb-1">
              {t('company.conflictRelevance')}
            </div>
            <p className="text-xs text-amber-200/80">
              {t('company.conflictExplain')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-slate-700/50 rounded-lg p-2">
      <div className="text-[10px] text-slate-400 uppercase">{icon} {label}</div>
      <div className="text-sm text-white font-medium mt-0.5">{value}</div>
    </div>
  );
}

function InfoRow({ icon, label, value, href }: { icon: string; label: string; value: string; href?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-xs">{icon}</span>
      <span className="text-slate-400">{label}:</span>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate">
          {value}
        </a>
      ) : (
        <span className="text-slate-300 truncate">{value}</span>
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
