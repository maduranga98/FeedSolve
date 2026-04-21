import { ReactNode } from 'react';
import { useHasFeature } from '../../hooks/useHasFeature';

interface FeatureCheckerProps {
  feature: 'canReply' | 'canViewAnalytics' | 'canRemoveBranding' | 'canAccessAPI';
  fallback?: ReactNode;
  children: ReactNode;
}

export function FeatureChecker({ feature, children, fallback }: FeatureCheckerProps) {
  const { checkFeature } = useHasFeature();

  if (!checkFeature(feature)) {
    return fallback || null;
  }

  return <>{children}</>;
}
