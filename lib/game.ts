export type GameStep =
  | "intro"
  | "cleansing"
  | "toner"
  | "serumSelect"
  | "serumApply"
  | "cream"
  | "result";

export type FaceZoneKey = "forehead" | "leftCheek" | "rightCheek" | "nose" | "chin";

export type FaceZone = {
  key: FaceZoneKey;
  label: string;
  x: number;
  y: number;
  rx: number;
  ry: number;
};

export const FACE_ZONES: FaceZone[] = [
  { key: "forehead", label: "이마", x: 50, y: 33, rx: 17, ry: 10 },
  { key: "leftCheek", label: "왼쪽 볼", x: 35.5, y: 48.5, rx: 11.5, ry: 10 },
  { key: "rightCheek", label: "오른쪽 볼", x: 64.5, y: 48.5, rx: 11.5, ry: 10 },
  { key: "nose", label: "코", x: 50, y: 49.5, rx: 7, ry: 8.5 },
  { key: "chin", label: "턱", x: 50, y: 59.5, rx: 12, ry: 7.5 },
];

export const STEP_LABELS: Record<GameStep, string> = {
  intro: "START",
  cleansing: "CLEANSING",
  toner: "TONER",
  serumSelect: "SERUM",
  serumApply: "APPLY",
  cream: "CREAM",
  result: "RESULT",
};

export type SerumId = "calming" | "hydration" | "brightening";

export const SERUMS: Array<{
  id: SerumId;
  title: string;
  ingredient: string;
  icon: string;
  note: string;
  best?: boolean;
}> = [
  { id: "calming", title: "CALMING", ingredient: "CICA", icon: "🌿", note: "편안한 진정 케어" },
  {
    id: "hydration",
    title: "HYDRATION",
    ingredient: "HYALURONIC ACID",
    icon: "💧",
    note: "건조 피부에 수분 충전",
    best: true,
  },
  { id: "brightening", title: "BRIGHTENING", ingredient: "VITAMIN C", icon: "🍊", note: "생기 있는 톤 케어" },
];

export const emptyZoneProgress = (): Record<FaceZoneKey, number> => ({
  forehead: 0,
  leftCheek: 0,
  rightCheek: 0,
  nose: 0,
  chin: 0,
});

export function getZoneAtPoint(xPercent: number, yPercent: number) {
  return FACE_ZONES.find((zone) => {
    const dx = (xPercent - zone.x) / zone.rx;
    const dy = (yPercent - zone.y) / zone.ry;
    return dx * dx + dy * dy <= 1;
  });
}

export function averageProgress(progress: Record<FaceZoneKey, number>) {
  const values = Object.values(progress);
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}
