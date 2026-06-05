import { useEffect, useState } from 'react';
import type { CompanyDetails as CompanyDetailsType } from '../services/api';
import { getCompanyDetails } from '../services/api';

interface Props {
  orgNumber: string;
  companyName: string;
  onClose: () => void;
}

export default function CompanyDetails({ orgNumber, companyName, onClose }: Props) {
  const [details, setDetails] = useState<CompanyDetailsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getCompanyDetails(orgNumber)
      .then(setDetails)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [orgNumber]);

  if (loading) {
    return (
      <div className="absolute bottom-4 right-4 w-96 bg-slate-800 border border-slate-600 rounded-lg p-4 z-20">
        <div className="text-slate-400 text-sm">Henter selskapsinformasjon...</div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="absolute bottom-4 right-4 w-96 bg-slate-800 border border-slate-600 rounded-lg p-4 z-20">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-white font-semibold">{companyName}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        <p className="text-slate-400 text-sm">Ingen detaljer tilgjengelig.</p>
      </div>
    );
  }

  return (
    <div className="absolute bottom-4 right-4 w-[400px] bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-20 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-start p-4 border-b border-slate-700">
        <div>
          <h3 className="text-white font-semibold text-lg">{details.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-1.5 py-0.5 rounded bg-green-900/50 text-green-300 border border-green-700/50">
              {details.organizationForm}
            </span>
            {details.isStateOwned && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-amber-900/50 text-amber-300 border border-amber-700/50"
                title="Statlig eid — potensielt relevant for interessekonflikter med politikere">
                🏛️ Statlig eid
              </span>
            )}
            {details.isPubliclyListed && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-blue-900/50 text-blue-300 border border-blue-700/50">
                📈 Børsnotert
              </span>
            )}
            {details.isBankrupt && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-red-900/50 text-red-300 border border-red-700/50">
                ⚠️ Konkurs
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
            <MetricCard label="Ansatte" value={details.employees.toLocaleString('nb-NO')} icon="👥" />
          )}
          {details.founded && (
            <MetricCard label="Stiftet" value={formatDate(details.founded)} icon="📅" />
          )}
          {details.lastAnnualReport && (
            <MetricCard label="Siste årsregnskap" value={details.lastAnnualReport} icon="📊" />
          )}
          {details.ownershipSector && (
            <MetricCard label="Sektor" value={details.ownershipSector} icon="🏢" />
          )}
        </div>

        {/* Industry */}
        {details.industry.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">Bransje / Næringskoder</h4>
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
            <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">Formål</h4>
            <p className="text-sm text-slate-300 leading-relaxed">{details.purpose}</p>
          </div>
        )}

        {/* Contact info */}
        <div className="pt-2 border-t border-slate-700 space-y-1.5">
          {details.location && (
            <InfoRow icon="📍" label="Adresse" value={details.location} />
          )}
          {details.website && (
            <InfoRow
              icon="🌐"
              label="Nettside"
              value={details.website}
              href={details.website.startsWith('http') ? details.website : `https://${details.website}`}
            />
          )}
          {details.phone && (
            <InfoRow icon="📞" label="Telefon" value={details.phone} />
          )}
          <InfoRow icon="🔢" label="Org.nr" value={details.orgNumber} />
        </div>

        {/* State ownership warning */}
        {details.isStateOwned && (
          <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-3 mt-2">
            <div className="text-xs font-semibold text-amber-300 mb-1">
              ⚠️ Relevans for interessekonflikter
            </div>
            <p className="text-xs text-amber-200/80">
              Dette er et statlig eid selskap. Politikere som har hatt ansvar for statlig eierskap
              og som senere tar styreverv her kan ha interessekonflikter.
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

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('nb-NO', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return dateStr;
  }
}
