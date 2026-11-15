import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage } from "./api";

export function useApiData<T>(loader: () => Promise<T>, dependencies: readonly unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    setLoading(true); setError("");
    loader().then(setData).catch((reason) => setError(getApiErrorMessage(reason, "Không tải được dữ liệu từ ERIS."))).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
  useEffect(load, [load]);
  return { data, error, loading, reload: load, setData };
}
