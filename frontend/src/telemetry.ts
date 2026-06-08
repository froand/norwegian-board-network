import { ApplicationInsights } from '@microsoft/applicationinsights-web';

let appInsights: ApplicationInsights | null = null;

const connectionString = import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING;

if (connectionString) {
  appInsights = new ApplicationInsights({
    config: {
      connectionString,
      enableAutoRouteTracking: true,
      enableCorsCorrelation: true,
      enableRequestHeaderTracking: true,
      enableResponseHeaderTracking: true,
    },
  });
  appInsights.loadAppInsights();
}

// Custom event tracking helpers
export function trackSearch(query: string, resultCount: number) {
  appInsights?.trackEvent({
    name: 'Search',
    properties: { query, resultCount: String(resultCount) },
  });
}

export function trackNodeClick(nodeId: string, nodeType: string, nodeName: string) {
  appInsights?.trackEvent({
    name: 'NodeClick',
    properties: { nodeId, nodeType, nodeName },
  });
}

export function trackExport(format: string) {
  appInsights?.trackEvent({
    name: 'Export',
    properties: { format },
  });
}

export function trackFeatureUsed(feature: string) {
  appInsights?.trackEvent({
    name: 'FeatureUsed',
    properties: { feature },
  });
}

export default appInsights;
