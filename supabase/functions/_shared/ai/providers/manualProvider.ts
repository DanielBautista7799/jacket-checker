import {
  JACKET_ANALYSIS_VERSION,
  type JacketAnalysisProvider,
  type JacketAnalysisProviderResult,
} from "../jacketAnalysisSchema.ts";
import { AiProviderError } from "../aiErrors.ts";

export function createManualProvider(): JacketAnalysisProvider {
  return {
    id: "manual",
    async analyze(): Promise<JacketAnalysisProviderResult> {
      throw new AiProviderError({
        provider: "manual",
        message: `Manual mode (${JACKET_ANALYSIS_VERSION}) does not call an AI provider. Enter the jacket details in the form.`,
        status: 422,
        retryable: false,
        code: "manual_entry_required",
      });
    },
  };
}
