import { useOAuthConfigurationActions } from "./useOAuthConfigurationActions";

export function useOAuthConfiguration() {
  const c1 = useOAuthConfigurationActions();
  return { ...c1 };
}

export type OAuthConfigurationState = ReturnType<typeof useOAuthConfiguration>;
