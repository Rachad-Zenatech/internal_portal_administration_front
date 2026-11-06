import { useSecureInfoRequestActions } from "./useSecureInfoRequestActions";

export function useSecureInfoRequest(props) {
  const { requestId, summary, refetch } = props;
  const c1 = useSecureInfoRequestActions(props);
  return { ...c1, requestId, summary, refetch };
}

export type SecureInfoRequestState = ReturnType<typeof useSecureInfoRequest>;
