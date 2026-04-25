export type ForYouMixConfig = {
  recommendationsPct: number;
  globalSocialPct: number;
  followingPct: number;
};

// Ajusta estos valores para cambiar el blend exacto de la pestaña "Para ti".
export const FOR_YOU_MIX_CONFIG: ForYouMixConfig = {
  recommendationsPct: 45,
  globalSocialPct: 35,
  followingPct: 20,
};

export const FOR_YOU_PAGE_SIZE = 24;

export function normalizeMixConfig(config: ForYouMixConfig): ForYouMixConfig {
  const rawValues = {
    recommendationsPct: Math.max(0, config.recommendationsPct),
    globalSocialPct: Math.max(0, config.globalSocialPct),
    followingPct: Math.max(0, config.followingPct),
  };

  const total =
    rawValues.recommendationsPct +
    rawValues.globalSocialPct +
    rawValues.followingPct;

  if (total <= 0) {
    return {
      recommendationsPct: 45,
      globalSocialPct: 35,
      followingPct: 20,
    };
  }

  if (total === 100) return rawValues;

  return {
    recommendationsPct: Math.round(
      (rawValues.recommendationsPct / total) * 100,
    ),
    globalSocialPct: Math.round((rawValues.globalSocialPct / total) * 100),
    followingPct: Math.round((rawValues.followingPct / total) * 100),
  };
}
