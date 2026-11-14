import type { WatchStatus } from "./types";

export interface StatusTransitionPatch {
  status?: WatchStatus;
  progress?: number;
}

/**
 * Derives normalized episode progress based on requested patch and previous state.
 */
export function deriveProgress(
  prevProgress: number | undefined,
  prevStatus: WatchStatus | undefined,
  patch: StatusTransitionPatch,
  total: number | null,
): number {
  let progress = patch.progress ?? prevProgress ?? 0;

  if (patch.status === "COMPLETED" && total) {
    return total;
  }

  if (
    (patch.status === "CURRENT" || patch.status === "REPEATING") &&
    patch.progress === undefined &&
    prevStatus === "COMPLETED" &&
    total &&
    progress >= total
  ) {
    return 0;
  }

  if (patch.progress !== undefined) {
    return Math.max(0, total ? Math.min(total, progress) : progress);
  }

  return progress;
}

/**
 * Pure transition table function for watch status lifecycle.
 * Given previous status, the input patch, episode total, and (optionally) calculated progress,
 * derives the valid destination WatchStatus.
 */
export function deriveStatus(
  prevStatus: WatchStatus | undefined,
  patch: StatusTransitionPatch,
  total: number | null,
  computedProgress?: number,
): WatchStatus {
  let status: WatchStatus = patch.status ?? prevStatus ?? "PLANNING";

  const progress =
    computedProgress !== undefined
      ? computedProgress
      : patch.progress ?? 0;

  if (patch.progress !== undefined) {
    if (total && progress >= total) {
      status = "COMPLETED";
    } else if (progress > 0 && status === "PLANNING") {
      status = "CURRENT";
    } else if (progress > 0 && status === "COMPLETED") {
      status = "REPEATING";
    }
  }

  return status;
}

/**
 * Convenience helper returning both derived status and progress together.
 */
export function deriveWatchState(
  prev: { status?: WatchStatus; progress?: number } | undefined,
  patch: StatusTransitionPatch,
  total: number | null,
): { status: WatchStatus; progress: number } {
  const progress = deriveProgress(prev?.progress, prev?.status, patch, total);
  const status = deriveStatus(prev?.status, patch, total, progress);
  return { status, progress };
}
