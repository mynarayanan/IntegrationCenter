import { assertProductionConfiguration } from "@/lib/config";

export function register() {
  assertProductionConfiguration();
}
