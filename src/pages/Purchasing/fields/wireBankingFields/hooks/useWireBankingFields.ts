import { useWireBankingFieldsActions } from "./useWireBankingFieldsActions";
import type { WireBankingFieldsProps } from "../types";

export function useWireBankingFields(props: WireBankingFieldsProps) {
  const { form, setForm, validationErrors = {}, setValidationErrors } = props;
  const c1 = useWireBankingFieldsActions(props);
  return { ...c1, form, setForm, validationErrors, setValidationErrors };
}

export type WireBankingFieldsState = ReturnType<typeof useWireBankingFields>;
